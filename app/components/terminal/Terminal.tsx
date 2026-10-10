'use client';

import { usePaletteShortcut } from '@/app/lib/platform';
import { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Circle,
  Command as CommandIcon,
  Files,
  PanelRight,
  TerminalSquare,
} from 'lucide-react';
import CommandPalette, { PaletteAction } from '@/app/components/terminal/CommandPalette';
import PreviewPane from '@/app/components/terminal/PreviewPane';
import WorkspaceTree from '@/app/components/terminal/WorkspaceTree';
import { useSiteTheme } from '@/app/components/theme/SiteThemeProvider';
import { KNOWLEDGE_SIGNALS, PORTFOLIO_PROJECTS, SITE_CONFIG } from '@/app/lib/content/portfolio';
import {
  BUILTIN_COMMAND_NAMES,
  BUILTIN_COMMAND_DESCRIPTIONS,
  ARCHIVE_SESSION_PATH,
  DEFAULT_PREVIEW_PATH,
  displayPath,
  executeShellCommand,
  getPathCompletions,
  getPreviewDocument,
  getWorkspaceEntry,
  HOME_DIRECTORY,
  parseCommandLine,
  registerArchiveSession,
} from '@/app/lib/terminal/shell';
import { TerminalLine, TerminalProps } from '@/app/types/terminal';
import { completeToken, CompletionOption, getAutosuggestion, getCommonPrefix } from '@/app/lib/terminal/completion';
import styles from './TerminalWorkbench.module.css';
import { scrollToHomeSection } from '@/app/lib/home-navigation';

type TerminalView = 'shell' | 'docs';
type MobilePane = 'terminal' | 'files' | 'preview';

interface CompletionSession {
  options: CompletionOption[];
  originalInput: string;
}

interface PersistedTerminalSession {
  version: 1;
  lines: Array<Omit<TerminalLine, 'timestamp'> & { timestamp?: string }>;
  history: string[];
  cwd: string;
  previousCwd: string;
  previewPath: string;
  terminalView: TerminalView;
  mobilePane: MobilePane;
  archiveStoryIds: string[];
}

const TERMINAL_SESSION_STORAGE_KEY = 'ccsert-terminal:session';
const ARCHIVE_HANDOFF_STORAGE_KEY = 'signal-archive:handoff';
const TERMINAL_LINE_TYPES = new Set<TerminalLine['type']>(['input', 'output', 'error', 'success', 'info']);
const ARCHIVE_HANDOFF_ACTIONS = ['status', 'tree', `open ${ARCHIVE_SESSION_PATH}`] as const;

function parseTerminalSession(raw: string | null): PersistedTerminalSession | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<PersistedTerminalSession>;
    if (value.version !== 1 || !Array.isArray(value.lines) || !Array.isArray(value.history)) return null;
    const validLines = value.lines.every(line => (
      typeof line === 'object'
      && line !== null
      && typeof line.content === 'string'
      && TERMINAL_LINE_TYPES.has(line.type)
      && (line.timestamp === undefined || typeof line.timestamp === 'string')
    ));
    if (!validLines || !value.history.every(item => typeof item === 'string')) return null;
    const archiveStoryIds = Array.isArray(value.archiveStoryIds)
      ? value.archiveStoryIds.filter(item => typeof item === 'string').slice(-64)
      : [];
    if (archiveStoryIds.length > 0) registerArchiveSession(archiveStoryIds);
    if (typeof value.cwd !== 'string' || getWorkspaceEntry(value.cwd)?.type !== 'directory') return null;
    if (typeof value.previousCwd !== 'string' || getWorkspaceEntry(value.previousCwd)?.type !== 'directory') return null;
    if (typeof value.previewPath !== 'string' || !getPreviewDocument(value.previewPath)) return null;
    if (value.terminalView !== 'shell' && value.terminalView !== 'docs') return null;
    if (value.mobilePane !== 'terminal' && value.mobilePane !== 'files' && value.mobilePane !== 'preview') return null;
    return {
      version: 1,
      lines: value.lines.slice(-300),
      history: value.history.slice(-100),
      cwd: value.cwd,
      previousCwd: value.previousCwd,
      previewPath: value.previewPath,
      terminalView: value.terminalView,
      mobilePane: value.mobilePane,
      archiveStoryIds,
    };
  } catch {
    return null;
  }
}

const QUICK_COMMANDS = [
  { command: 'help', description: 'Show every available command' },
  { command: 'archive', description: 'Explore the questions behind the projects' },
  { command: `open projects/${PORTFOLIO_PROJECTS[0].slug}.md`, description: 'Open a verified public project' },
  { command: 'search protocol', description: 'Search projects and knowledge signals' },
  { command: 'tree', description: 'Inspect the virtual workspace' },
  { command: 'status', description: 'Show workbench health' },
  { command: 'neofetch', description: 'Show profile and system context' },
  { command: 'theme cyan', description: 'Change the whole site theme' },
] as const;

const PALETTE_ACTIONS: PaletteAction[] = [
  { command: 'archive', label: 'Enter Signal Archive', description: 'Follow a question into projects and field notes' },
  ...PORTFOLIO_PROJECTS.map(project => ({
    command: `open projects/${project.slug}.md`,
    label: `Open ${project.title}`,
    description: project.description,
  })),
  ...KNOWLEDGE_SIGNALS.map(signal => ({
    command: `open knowledge/${signal.slug}.md`,
    label: `Open ${signal.title}`,
    description: signal.excerpt,
  })),
  { command: 'open skills/stack.txt', label: 'Open Technical Stack', description: 'Explore current capabilities' },
  { command: 'search protocol', label: 'Search protocol boundaries', description: 'Fuzzy-search projects and research notes' },
  { command: 'tree', label: 'Show workspace tree', description: 'Print every indexed document' },
  { command: 'status', label: 'System status', description: 'Inspect shell and workspace health' },
  { command: 'neofetch', label: 'Profile summary', description: 'Show identity and environment information' },
  { command: 'theme green', label: 'Theme: Signal green', description: `Restore the full ${SITE_CONFIG.domain} system theme` },
  { command: 'theme cyan', label: 'Theme: Cyan', description: 'Switch the full interface to cyan telemetry' },
  { command: 'theme amber', label: 'Theme: Amber', description: 'Switch the full interface to warm operations mode' },
  { command: 'theme light', label: 'Theme: Paper light', description: 'Switch the full interface to a bright paper console' },
  { command: 'help', label: 'Command reference', description: 'List commands and keyboard shortcuts' },
];

function getLineClass(type: TerminalLine['type']): string {
  if (type === 'input') return `${styles.line} ${styles.inputLine}`;
  if (type === 'error') return `${styles.line} ${styles.errorLine}`;
  if (type === 'info') return `${styles.line} ${styles.infoLine}`;
  if (type === 'success') return `${styles.line} ${styles.successLine}`;
  return styles.line;
}

function getCompletionOptions(
  value: string,
  cwd: string,
  commands: Array<{ name: string; description: string }>,
): CompletionOption[] {
  if (!value) return [];

  const commandMatch = value.match(/^(\S*)$/);
  if (commandMatch) {
    const fragment = commandMatch[1].toLowerCase();
    if (!fragment) return [];

    return commands
      .filter(command => command.name.startsWith(fragment))
      .map(command => ({
        id: `command-${command.name}`,
        value: command.name,
        label: command.name,
        detail: command.description,
        kind: 'command' as const,
      }));
  }

  const pathMatch = value.match(/^(cd|cat|open|ls|grep|head|tail|find)\s+(\S*)$/);
  if (pathMatch) {
    return getPathCompletions(pathMatch[2], cwd, pathMatch[1] === 'cd')
      .map(path => {
        const folder = path.endsWith('/');
        return {
          id: `path-${pathMatch[1]}-${path}`,
          value: `${pathMatch[1]} ${path}`,
          label: path,
          detail: folder ? 'Folder in the virtual workspace' : 'File in the virtual workspace',
          kind: folder ? 'folder' as const : 'file' as const,
        };
      });
  }

  const themeMatch = value.match(/^theme\s+(\S*)$/);
  if (themeMatch) {
    return ['green', 'cyan', 'amber', 'light']
      .filter(option => option.startsWith(themeMatch[1].toLowerCase()))
      .map(option => ({
        id: `theme-${option}`,
        value: `theme ${option}`,
        label: option,
        detail: 'Switch the complete interface theme',
        kind: 'value' as const,
      }));
  }

  const searchMatch = value.match(/^search\s+(\S*)$/);
  if (searchMatch) {
    return ['agent', 'devops', 'kubernetes', 'architecture']
      .filter(option => option.startsWith(searchMatch[1].toLowerCase()))
      .map(option => ({
        id: `search-${option}`,
        value: `search ${option}`,
        label: option,
        detail: 'Suggested workspace search',
        kind: 'value' as const,
      }));
  }

  return [];
}

export default function Terminal({
  ref,
  commands,
  welcomeMessage = [],
  promptPrefix = `visitor@${SITE_CONFIG.domain}`,
  onCommand,
}: TerminalProps) {
  const paletteShortcut = usePaletteShortcut();
  const [lines, setLines] = useState<TerminalLine[]>(() =>
    welcomeMessage.map(content => ({ type: 'output', content })),
  );
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [cwd, setCwd] = useState(HOME_DIRECTORY);
  const [previousCwd, setPreviousCwd] = useState(HOME_DIRECTORY);
  const [previewPath, setPreviewPath] = useState(DEFAULT_PREVIEW_PATH);
  const [terminalView, setTerminalView] = useState<TerminalView>('shell');
  const [mobilePane, setMobilePane] = useState<MobilePane>('terminal');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [completionIndex, setCompletionIndex] = useState(-1);
  const [completionSession, setCompletionSession] = useState<CompletionSession | null>(null);
  const [suggestionsDismissed, setSuggestionsDismissed] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [cursorAtEnd, setCursorAtEnd] = useState(true);
  const [composing, setComposing] = useState(false);
  const composingRef = useRef(false);
  const historyDraftRef = useRef('');
  const ghostRef = useRef<HTMLDivElement>(null);
  const pendingInputRef = useRef<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [handoffActionsVisible, setHandoffActionsVisible] = useState(false);
  const [liveAnnouncement, setLiveAnnouncement] = useState('');
  const [archiveStoryIds, setArchiveStoryIds] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const workbenchRef = useRef<HTMLElement>(null);
  const { theme, changeTheme } = useSiteTheme();
  const currentPrompt = `${promptPrefix}:${displayPath(cwd)}$`;
  const commandSummaries = useMemo(() => {
    const builtins = BUILTIN_COMMAND_NAMES.map(name => ({
      name,
      description: BUILTIN_COMMAND_DESCRIPTIONS[name],
    }));
    const combined = [...builtins, ...commands.map(({ name, description }) => ({ name, description }))];
    return combined.filter((command, index) => combined.findIndex(item => item.name === command.name) === index);
  }, [commands]);
  const suggestedCompletions = useMemo(
    () => getCompletionOptions(input, cwd, commandSummaries),
    [commandSummaries, cwd, input],
  );
  const completionOptions = completionSession?.options ?? [];
  const activeCompletion = completionOptions[completionIndex];
  const autosuggestion = inputFocused && cursorAtEnd && !composing && !suggestionsDismissed && !completionSession
    ? getAutosuggestion(input, history, suggestedCompletions)
    : '';
  const latestSpokenLine = useMemo(() => {
    for (let index = lines.length - 1; index >= 0; index -= 1) {
      if (lines[index].content.trim()) return lines[index].content;
    }
    return '';
  }, [lines]);

  const focusInput = useCallback(() => {
    window.requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
  }, []);

  const syncInputPosition = () => {
    const element = inputRef.current;
    if (!element) return;
    setCursorAtEnd(element.selectionStart === element.value.length && element.selectionEnd === element.value.length);
    if (ghostRef.current) ghostRef.current.scrollLeft = element.scrollLeft;
  };

  const replaceInput = useCallback((value: string) => {
    const element = inputRef.current;
    if (element?.value === value) {
      pendingInputRef.current = null;
      element.setSelectionRange(value.length, value.length);
      if (ghostRef.current) ghostRef.current.scrollLeft = element.scrollLeft;
    } else {
      pendingInputRef.current = value;
    }
    setInput(value);
    setCursorAtEnd(true);
  }, []);

  useLayoutEffect(() => {
    const element = inputRef.current;
    if (!element || pendingInputRef.current !== input) return;
    pendingInputRef.current = null;
    element.setSelectionRange(input.length, input.length);
    // Synchronize before the next keystroke, without a deferred caret jump.
    if (ghostRef.current) ghostRef.current.scrollLeft = element.scrollLeft;
  }, [input]);

  const writeLine = useCallback((text: string, type: TerminalLine['type'] = 'output') => {
    setLines(previousLines => [...previousLines, { type, content: text, timestamp: new Date() }]);
  }, []);

  useEffect(() => {
    const output = outputRef.current;
    if (output) output.scrollTop = output.scrollHeight;
  }, [completionOptions.length, lines]);

  useEffect(() => {
    const openPalette = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', openPalette);
    return () => window.removeEventListener('keydown', openPalette);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      let persistedSession: PersistedTerminalSession | null = null;
      let rawHandoff: string | null = null;
      try {
        persistedSession = parseTerminalSession(window.sessionStorage.getItem(TERMINAL_SESSION_STORAGE_KEY));
        rawHandoff = window.sessionStorage.getItem(ARCHIVE_HANDOFF_STORAGE_KEY);
      } catch {
        // Session persistence is optional; the terminal must still mount.
      }

      if (persistedSession) {
        setLines(persistedSession.lines.map(line => {
          const timestamp = line.timestamp ? new Date(line.timestamp) : undefined;
          return {
            type: line.type,
            content: line.content,
            timestamp: timestamp && !Number.isNaN(timestamp.getTime()) ? timestamp : undefined,
          };
        }));
        setHistory(persistedSession.history);
        setCwd(persistedSession.cwd);
        setPreviousCwd(persistedSession.previousCwd);
        setPreviewPath(persistedSession.previewPath);
        setTerminalView(persistedSession.terminalView);
        setMobilePane(persistedSession.mobilePane);
        setArchiveStoryIds(persistedSession.archiveStoryIds);
      }

      let handoffMessage = '';
      let repairSummary = 'power · health · boot order';
      let discoveredCount = 0;
      if (rawHandoff) {
        try {
          const payload = JSON.parse(rawHandoff) as { repairSummary?: string[]; discoveredStoryIds?: string[] };
          if (Array.isArray(payload.repairSummary) && payload.repairSummary.length > 0) {
            repairSummary = payload.repairSummary.join(' · ');
          }
          if (Array.isArray(payload.discoveredStoryIds)) {
            const discoveredStoryIds = payload.discoveredStoryIds.filter(item => typeof item === 'string').slice(-64);
            setArchiveStoryIds(discoveredStoryIds);
            discoveredCount = registerArchiveSession(discoveredStoryIds);
          }
        } catch {
          // A malformed handoff must never block the terminal.
        }
        try {
          window.sessionStorage.removeItem(ARCHIVE_HANDOFF_STORAGE_KEY);
        } catch {
          // A blocked storage write must not block the terminal.
        }
        handoffMessage = `[archive] Local node A-17 online · Restored: ${repairSummary} · Recovered signals: ${discoveredCount}.`;
        const timestamp = new Date();
        setLines(previousLines => [
          ...previousLines,
          { type: 'success', content: handoffMessage, timestamp },
        ]);
        setHandoffActionsVisible(true);
        setTerminalView('shell');
        setMobilePane('terminal');
        setLiveAnnouncement(handoffMessage);
      }
      const requestedDocument = new URLSearchParams(window.location.search).get('open');
      const linkedDocument = requestedDocument ? getPreviewDocument(requestedDocument) : null;
      if (linkedDocument) {
        setPreviewPath(linkedDocument.path);
        setMobilePane('preview');
        setLiveAnnouncement(`已打开 ${displayPath(linkedDocument.path)}`);
      }
      setSessionReady(true);
      if (linkedDocument) {
        workbenchRef.current?.focus({ preventScroll: true });
      } else if (!window.location.hash && window.scrollY < 80 && document.activeElement === document.body && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        focusInput();
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [focusInput]);

  useEffect(() => {
    if (!sessionReady) return;
    const snapshot: PersistedTerminalSession = {
      version: 1,
      lines: lines.slice(-300).map(line => ({
        type: line.type,
        content: line.content,
        timestamp: line.timestamp && !Number.isNaN(line.timestamp.getTime())
          ? line.timestamp.toISOString()
          : undefined,
      })),
      history: history.slice(-100),
      cwd,
      previousCwd,
      previewPath,
      terminalView,
      mobilePane,
      archiveStoryIds,
    };
    try {
      window.sessionStorage.setItem(TERMINAL_SESSION_STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // A blocked session store should not degrade the live terminal.
    }
  }, [archiveStoryIds, cwd, history, lines, mobilePane, previewPath, previousCwd, sessionReady, terminalView]);

  const handleCommand = useCallback(async (commandText: string) => {
    const trimmedCommand = commandText.trim();
    setLiveAnnouncement('');
    setTerminalView('shell');
    setCompletionSession(null);
    setCompletionIndex(-1);
    setSuggestionsDismissed(false);
    historyDraftRef.current = '';

    if (!trimmedCommand) {
      setLines(previousLines => [...previousLines, {
        type: 'input',
        content: currentPrompt,
        timestamp: new Date(),
      }]);
      setHistoryIndex(-1);
      focusInput();
      return;
    }

    setLines(previousLines => [...previousLines, {
      type: 'input',
      content: `${currentPrompt} ${trimmedCommand}`,
      timestamp: new Date(),
    }]);
    const nextHistory = [...history, trimmedCommand];
    setHistory(nextHistory);
    setHistoryIndex(-1);

    const parsed = parseCommandLine(trimmedCommand);
    if (parsed.error) {
      writeLine(parsed.error, 'error');
      focusInput();
      return;
    }

    const [commandName, ...args] = parsed.tokens;
    const shellResult = executeShellCommand(commandName, args, {
      cwd,
      previousCwd,
      history: nextHistory,
      siteCommands: commands.map(({ name, description }) => ({ name, description })),
      theme,
    });

    if (shellResult.clear) {
      setLines([]);
      onCommand?.(trimmedCommand);
      focusInput();
      return;
    }

    if (shellResult.handled) {
      if (shellResult.nextCwd) {
        setPreviousCwd(cwd);
        setCwd(shellResult.nextCwd);
      }
      if (shellResult.previewPath) setPreviewPath(shellResult.previewPath);
      if (shellResult.nextTheme) {
        changeTheme(shellResult.nextTheme, { animate: false });
      }
      if (shellResult.openCommandPalette) setPaletteOpen(true);
      if (shellResult.output !== undefined) {
        writeLine(shellResult.output, shellResult.outputType ?? 'output');
      }
    } else {
      const siteCommand = commands.find(command => command.name === commandName);
      if (siteCommand) {
        try {
          const result = await siteCommand.fn(args);
          if (result !== undefined && result !== '') writeLine(result);
        } catch (error) {
          writeLine(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        }
      } else {
        writeLine(`bash: ${commandName}: command not found`, 'error');
      }
    }

    onCommand?.(trimmedCommand);
    focusInput();
  }, [changeTheme, commands, currentPrompt, cwd, focusInput, history, onCommand, previousCwd, theme, writeLine]);

  const runCommand = useCallback((command: string) => {
    setMobilePane('terminal');
    void handleCommand(command);
  }, [handleCommand]);

  const applyCompletion = (option: CompletionOption) => {
    replaceInput(completeToken(option));
    setCompletionSession(null);
    setCompletionIndex(-1);
    setSuggestionsDismissed(false);
    setHistoryIndex(-1);
    focusInput();
  };

  const cycleCompletion = (direction: number) => {
    if (!completionSession) return;
    const nextIndex = completionIndex < 0
      ? (direction > 0 ? 0 : completionOptions.length - 1)
      : (completionIndex + direction + completionOptions.length) % completionOptions.length;
    setCompletionIndex(nextIndex);
    replaceInput(completionOptions[nextIndex].value);
  };

  const requestCompletion = (backward = false) => {
    if (completionSession) {
      cycleCompletion(backward ? -1 : 1);
      return;
    }
    setSuggestionsDismissed(false);
    if (suggestedCompletions.length === 1) {
      applyCompletion(suggestedCompletions[0]);
    } else if (suggestedCompletions.length > 1) {
      const prefix = getCommonPrefix(suggestedCompletions);
      setCompletionSession({ options: suggestedCompletions, originalInput: input });
      setCompletionIndex(-1);
      if (prefix.length > input.length) replaceInput(prefix);
    } else {
      setLiveAnnouncement('没有匹配的补全项。');
    }
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (composingRef.current || event.nativeEvent.isComposing || event.keyCode === 229) return;
    const element = event.currentTarget;
    const atEnd = element.selectionStart === input.length && element.selectionEnd === input.length;
    const plainKey = !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey;

    if (event.key === 'Enter') {
      event.preventDefault();
      if (activeCompletion) {
        applyCompletion(activeCompletion);
        return;
      }
      void handleCommand(input);
      replaceInput('');
    } else if ((event.key === 'ArrowRight' || event.key === 'End') && plainKey && atEnd && autosuggestion) {
      event.preventDefault();
      replaceInput(autosuggestion);
      setHistoryIndex(-1);
    } else if ((event.key === 'ArrowUp' || event.key === 'ArrowDown') && plainKey) {
      event.preventDefault();
      const direction = event.key === 'ArrowUp' ? -1 : 1;
      if (completionSession) {
        cycleCompletion(direction);
      } else if (history.length > 0) {
        if (historyIndex === -1) {
          if (direction > 0) return;
          historyDraftRef.current = input;
        }
        const nextIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex + direction);
        if (nextIndex >= history.length) {
          setHistoryIndex(-1);
          replaceInput(historyDraftRef.current);
        } else {
          setHistoryIndex(nextIndex);
          replaceInput(history[nextIndex]);
        }
        setSuggestionsDismissed(false);
      }
    } else if (event.key === 'Tab' && !event.ctrlKey && !event.metaKey && !event.altKey) {
      // Empty input, Shift+Tab, or Esc then Tab keep normal page navigation available.
      if (!completionSession && (event.shiftKey || !input || suggestionsDismissed || !atEnd)) return;
      event.preventDefault();
      requestCompletion(event.shiftKey);
    } else if (event.key.toLowerCase() === 'l' && event.ctrlKey) {
      event.preventDefault();
      setLines([]);
      setCompletionSession(null);
      setCompletionIndex(-1);
    } else if (event.key.toLowerCase() === 'c' && event.ctrlKey) {
      event.preventDefault();
      setLines(previousLines => [...previousLines, {
        type: 'input',
        content: `${currentPrompt}${input ? ` ${input}` : ''}^C`,
        timestamp: new Date(),
      }]);
      replaceInput('');
      setHistoryIndex(-1);
      setCompletionSession(null);
      setCompletionIndex(-1);
      setSuggestionsDismissed(false);
    } else if (event.key.toLowerCase() === 'u' && event.ctrlKey) {
      event.preventDefault();
      replaceInput('');
      setHistoryIndex(-1);
      setCompletionSession(null);
      setCompletionIndex(-1);
      setSuggestionsDismissed(false);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      if (completionSession) replaceInput(completionSession.originalInput);
      setCompletionSession(null);
      setCompletionIndex(-1);
      setSuggestionsDismissed(true);
    } else if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      // Cursor movement commits the current menu value and resumes native editing.
      setCompletionSession(null);
      setCompletionIndex(-1);
    }
  };

  const handleInputChange = (value: string) => {
    pendingInputRef.current = null;
    setInput(value);
    setCompletionSession(null);
    setCompletionIndex(-1);
    setSuggestionsDismissed(false);
    setHistoryIndex(-1);
    syncInputPosition();
  };

  const selectPreview = (path: string) => {
    setPreviewPath(path);
    setMobilePane('preview');
  };

  useImperativeHandle(ref, () => ({
    openDocument(path: string) {
      if (!getPreviewDocument(path)) return;
      setPreviewPath(path);
      setMobilePane('preview');
      setLiveAnnouncement(`已打开 ${displayPath(path)}`);
      workbenchRef.current?.focus({ preventScroll: true });
    },
  }), []);

  const openSection = (sectionId: string) => {
    scrollToHomeSection(sectionId);
  };

  return (
    <section
      ref={workbenchRef}
      className={styles.workbench}
      data-theme={theme}
      role="region"
      aria-label={`${SITE_CONFIG.domain} 终端工作台`}
      tabIndex={-1}
    >
      <header className={styles.topbar}>
        <div className={styles.tabs} role="tablist" aria-label="终端视图">
          <button
            type="button"
            role="tab"
            id="workbench-terminal-tab"
            aria-controls="workbench-terminal-panel"
            aria-selected={terminalView === 'shell'}
            className={styles.tab}
            data-active={terminalView === 'shell'}
            onClick={() => {
              setTerminalView('shell');
              setMobilePane('terminal');
              focusInput();
            }}
          >
            <TerminalSquare size={15} aria-hidden="true" /> shell
          </button>
          <button
            type="button"
            role="tab"
            id="workbench-docs-tab"
            aria-controls="workbench-docs-panel"
            aria-selected={terminalView === 'docs'}
            className={styles.tab}
            data-active={terminalView === 'docs'}
            onClick={() => {
              setTerminalView('docs');
              setMobilePane('terminal');
            }}
          >
            <BookOpen size={14} aria-hidden="true" /> docs
          </button>
        </div>
        <div className={styles.topbarActions}>
          <button type="button" className={styles.paletteTrigger} onClick={() => setPaletteOpen(true)}>
            <CommandIcon size={14} aria-hidden="true" />
            <span>Command palette</span>
            <span className={`${styles.kbd} ${styles.paletteKbd}`}>{paletteShortcut}</span>
          </button>
        </div>
      </header>

      <div className={styles.layout}>
        <div className={`${styles.panel} ${styles.terminalPanel}`} data-mobile-active={mobilePane === 'terminal'}>
          {terminalView === 'shell' ? (
            <div
              ref={outputRef}
              id="workbench-terminal-panel"
              className={styles.transcript}
              role="tabpanel"
              aria-labelledby="workbench-terminal-tab"
              onClick={focusInput}
            >
              {lines.map((line, index) => (
                <div key={`${line.timestamp?.getTime() ?? 0}-${index}`} className={getLineClass(line.type)}>
                  {line.content}
                </div>
              ))}
              <div className={styles.promptRow}>
                <span className={styles.prompt}>{currentPrompt}</span>
                <div className={styles.inputArea}>
                  <div ref={ghostRef} className={styles.inputGhost} aria-hidden="true">
                    <span className={styles.ghostPrefix}>{input}</span>
                    <span>{autosuggestion.slice(input.length)}</span>
                  </div>
                  <input
                    ref={inputRef}
                    className={styles.terminalInput}
                    type="text"
                    role="combobox"
                    value={input}
                    onChange={event => handleInputChange(event.target.value)}
                    onKeyDown={handleInputKeyDown}
                    onKeyUp={syncInputPosition}
                    onSelect={syncInputPosition}
                    onScroll={syncInputPosition}
                    onFocus={() => {
                      setInputFocused(true);
                      syncInputPosition();
                    }}
                    onBlur={() => {
                      setInputFocused(false);
                      setCompletionSession(null);
                      setCompletionIndex(-1);
                    }}
                    onCompositionStart={() => {
                      composingRef.current = true;
                      setComposing(true);
                      setCompletionSession(null);
                      setCompletionIndex(-1);
                    }}
                    onCompositionEnd={() => {
                      composingRef.current = false;
                      setComposing(false);
                      syncInputPosition();
                    }}
                    aria-label="输入终端命令"
                    aria-autocomplete="both"
                    aria-describedby="terminal-input-help terminal-autosuggestion"
                    aria-controls={completionOptions.length > 0 ? 'terminal-completions' : undefined}
                    aria-expanded={completionOptions.length > 0}
                    aria-activedescendant={activeCompletion ? `completion-${activeCompletion.id}` : undefined}
                    autoCapitalize="none"
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
                <button
                  type="button"
                  className={styles.touchComplete}
                  aria-label="补全命令"
                  disabled={!input || composing}
                  onMouseDown={event => event.preventDefault()}
                  onClick={() => {
                    requestCompletion();
                    focusInput();
                  }}
                >⇥</button>
              </div>
              <span id="terminal-input-help" className="sr-only">
                右方向键在行尾接受建议，Tab 补全，补全列表中 Tab 或方向键切换、Enter 确认。
                上下方向键浏览历史。Esc 关闭提示，再按 Tab 可离开输入框。
              </span>
              <span id="terminal-autosuggestion" className="sr-only">
                {autosuggestion ? `建议：${autosuggestion}` : ''}
              </span>
              {handoffActionsVisible ? (
                <div className={styles.handoffActions} role="group" aria-label="档案室交接建议">
                  <span>Archive handoff ready</span>
                  <div>
                    {ARCHIVE_HANDOFF_ACTIONS.map(action => (
                      <button
                        key={action}
                        type="button"
                        onClick={() => {
                          setHandoffActionsVisible(false);
                          runCommand(action);
                        }}
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              {completionOptions.length > 0 ? (
                <div
                  id="terminal-completions"
                  className={styles.completionList}
                  data-commands={completionOptions[0]?.kind === 'command'}
                  role="listbox"
                  aria-label="命令补全候选"
                >
                  {completionOptions.map((option, index) => (
                    <button
                      key={option.id}
                      id={`completion-${option.id}`}
                      type="button"
                      tabIndex={-1}
                      role="option"
                      aria-selected={index === completionIndex}
                      className={styles.completionOption}
                      data-active={index === completionIndex}
                      onMouseDown={event => event.preventDefault()}
                      onClick={() => applyCompletion(option)}
                    >
                      <span className={styles.completionName} data-kind={option.kind}>{option.label}</span>
                      {option.kind === 'command' ? <span className={styles.completionDetail}> — {option.detail}</span> : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <div
              id="workbench-docs-panel"
              className={styles.docsPanel}
              role="tabpanel"
              aria-labelledby="workbench-docs-tab"
            >
              <p className={styles.docsIntro}>
                Suggestions appear after the cursor. Press → to accept, Tab to complete, or ↑/↓ to recall history.
                Use Esc to dismiss suggestions without clearing your command,
                or press <span className={styles.kbd}>{paletteShortcut}</span> anywhere to search actions.
              </p>
              <div className={styles.commandList}>
                {QUICK_COMMANDS.map(item => (
                  <button key={item.command} type="button" className={styles.quickCommand} onClick={() => runCommand(item.command)}>
                    <code>{item.command}</code>
                    <span>{item.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className={`${styles.panel} ${styles.treePanel}`} data-mobile-active={mobilePane === 'files'} aria-label="工作区文件">
          <WorkspaceTree selectedPath={previewPath} onSelect={selectPreview} />
        </aside>

        <article className={`${styles.panel} ${styles.previewPanel}`} data-mobile-active={mobilePane === 'preview'} aria-label="文件预览">
          <PreviewPane path={previewPath} onRunCommand={runCommand} onOpenSection={openSection} />
        </article>
      </div>

      <footer className={styles.statusbar}>
        <div className={styles.keyHints}>
          <span><span className={styles.kbd}>→</span> Accept</span>
          <span><span className={styles.kbd}>Tab</span> Complete</span>
          <span><span className={styles.kbd}>↑↓</span> History</span>
          <span><span className={styles.kbd}>Enter</span> Run</span>
          <span><span className={styles.kbd}>Ctrl L</span> Clear</span>
          <span className={styles.paletteHint}><span className={styles.kbd}>{paletteShortcut}</span> Palette</span>
        </div>
        <div className={styles.statusItems}>
          <span className={styles.statusOnline}>
            <Circle size={6} fill="currentColor" aria-hidden="true" /> online
          </span>
          <span>{displayPath(cwd)}</span>
          <span>{theme}</span>
        </div>
      </footer>

      <nav className={styles.mobileNav} aria-label="移动端工作台视图">
        <button type="button" className={styles.mobileTab} data-active={mobilePane === 'terminal'} onClick={() => setMobilePane('terminal')}>
          <TerminalSquare size={14} aria-hidden="true" /> Shell
        </button>
        <button type="button" className={styles.mobileTab} data-active={mobilePane === 'files'} onClick={() => setMobilePane('files')}>
          <Files size={14} aria-hidden="true" /> Files
        </button>
        <button type="button" className={styles.mobileTab} data-active={mobilePane === 'preview'} onClick={() => setMobilePane('preview')}>
          <PanelRight size={14} aria-hidden="true" /> Preview
        </button>
      </nav>

      {paletteOpen ? (
        <CommandPalette
          actions={PALETTE_ACTIONS}
          onClose={() => {
            setPaletteOpen(false);
            focusInput();
          }}
          onRun={runCommand}
        />
      ) : null}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {liveAnnouncement || latestSpokenLine}
      </div>
    </section>
  );
}
