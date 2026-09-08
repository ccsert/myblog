'use client';

import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
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
import styles from './TerminalWorkbench.module.css';
import { scrollToHomeSection } from '@/app/lib/home-navigation';

type TerminalView = 'shell' | 'docs';
type MobilePane = 'terminal' | 'files' | 'preview';

interface CompletionOption {
  id: string;
  value: string;
  label: string;
  detail: string;
  kind: 'command' | 'file' | 'folder' | 'value';
}

interface CompletionSession {
  options: CompletionOption[];
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
      .slice(0, 7)
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
      .slice(0, 7)
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
  const [completionIndex, setCompletionIndex] = useState(0);
  const [completionSession, setCompletionSession] = useState<CompletionSession | null>(null);
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
  const completionOptions = completionSession?.options ?? suggestedCompletions;
  const activeCompletion = completionOptions[completionIndex] ?? completionOptions[0];
  const latestSpokenLine = useMemo(() => {
    for (let index = lines.length - 1; index >= 0; index -= 1) {
      if (lines[index].content.trim()) return lines[index].content;
    }
    return '';
  }, [lines]);

  const focusInput = useCallback(() => {
    window.requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
  }, []);

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
    setCompletionIndex(0);

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

  const moveFocusFromInput = useCallback((backward: boolean) => {
    const workbench = workbenchRef.current;
    const inputElement = inputRef.current;
    if (!workbench || !inputElement) return;

    const focusable = Array.from(workbench.querySelectorAll<HTMLElement>(
      'a[href], button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])',
    )).filter(element => (
      element.getClientRects().length > 0
      && window.getComputedStyle(element).visibility === 'visible'
    ));
    const currentIndex = focusable.indexOf(inputElement);
    if (currentIndex < 0 || focusable.length < 2) return;
    const nextIndex = (currentIndex + (backward ? -1 : 1) + focusable.length) % focusable.length;
    focusable[nextIndex]?.focus({ preventScroll: true });
  }, []);

  const handleInputKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void handleCommand(input);
      setInput('');
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (completionOptions.length > 0) {
        setCompletionIndex(index => (index - 1 + completionOptions.length) % completionOptions.length);
      } else if (history.length > 0) {
        const nextIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(nextIndex);
        setInput(history[nextIndex]);
        setCompletionSession(null);
      }
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (completionOptions.length > 0) {
        setCompletionIndex(index => (index + 1) % completionOptions.length);
      } else if (historyIndex !== -1) {
        const nextIndex = historyIndex + 1;
        if (nextIndex >= history.length) {
          setHistoryIndex(-1);
          setInput('');
        } else {
          setHistoryIndex(nextIndex);
          setInput(history[nextIndex]);
        }
        setCompletionSession(null);
      }
    } else if (event.key === 'Tab') {
      event.preventDefault();
      const shouldApplyCompletion = !event.shiftKey
        && completionOptions.length > 0
        && activeCompletion?.value !== input;
      if (!shouldApplyCompletion) {
        moveFocusFromInput(event.shiftKey);
        return;
      }
      const nextIndex = completionSession
        ? (completionIndex + 1) % completionOptions.length
        : completionIndex;
      const nextOption = completionOptions[nextIndex];
      const continueIntoFolder = completionOptions.length === 1 && nextOption.kind === 'folder';
      setCompletionSession(continueIntoFolder ? null : { options: completionOptions });
      setCompletionIndex(continueIntoFolder ? 0 : nextIndex);
      setInput(nextOption.value);
    } else if (event.key.toLowerCase() === 'l' && event.ctrlKey) {
      event.preventDefault();
      setLines([]);
    } else if (event.key.toLowerCase() === 'c' && event.ctrlKey) {
      event.preventDefault();
      setLines(previousLines => [...previousLines, {
        type: 'input',
        content: `${currentPrompt}${input ? ` ${input}` : ''}^C`,
        timestamp: new Date(),
      }]);
      setInput('');
      setHistoryIndex(-1);
      setCompletionSession(null);
      setCompletionIndex(0);
    } else if (event.key.toLowerCase() === 'u' && event.ctrlKey) {
      event.preventDefault();
      setInput('');
      setCompletionSession(null);
      setCompletionIndex(0);
    } else if (event.key === 'Escape') {
      setInput('');
      setHistoryIndex(-1);
      setCompletionSession(null);
      setCompletionIndex(0);
    }
  }, [activeCompletion?.value, completionIndex, completionOptions, completionSession, currentPrompt, handleCommand, history, historyIndex, input, moveFocusFromInput]);

  const handleInputChange = (value: string) => {
    setInput(value);
    setCompletionSession(null);
    setCompletionIndex(0);
    setHistoryIndex(-1);
  };

  const applyCompletion = (option: CompletionOption) => {
    setInput(option.value);
    setCompletionSession(null);
    setCompletionIndex(0);
    focusInput();
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
            <span className={styles.kbd}>⌘K</span>
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
                <input
                  ref={inputRef}
                  className={styles.terminalInput}
                  type="text"
                  role="combobox"
                  value={input}
                  onChange={event => handleInputChange(event.target.value)}
                  onKeyDown={handleInputKeyDown}
                  aria-label="输入终端命令"
                  aria-autocomplete="list"
                  aria-controls={completionOptions.length > 0 ? 'terminal-completions' : undefined}
                  aria-expanded={completionOptions.length > 0}
                  aria-activedescendant={activeCompletion ? `completion-${activeCompletion.id}` : undefined}
                  autoCapitalize="none"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
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
                <div id="terminal-completions" className={styles.completionPanel} role="listbox" aria-label="命令补全候选">
                  <div className={styles.completionHeader}>
                    <span>{completionOptions.length} suggestions</span>
                    <span><span className={styles.kbd}>↑↓</span> choose · <span className={styles.kbd}>Tab</span> complete</span>
                  </div>
                  <div className={styles.completionList}>
                    {completionOptions.map((option, index) => (
                      <button
                        key={option.id}
                        id={`completion-${option.id}`}
                        type="button"
                        role="option"
                        aria-selected={index === completionIndex}
                        className={styles.completionOption}
                        data-active={index === completionIndex}
                        onMouseDown={event => event.preventDefault()}
                        onClick={() => applyCompletion(option)}
                      >
                        <span className={styles.completionIdentity}>
                          <span className={styles.completionKind}>{option.kind}</span>
                          <code>{option.label}</code>
                        </span>
                        <span className={styles.completionDetail}>{option.detail}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : input ? (
                <div className={styles.completionEmpty} role="status">
                  No match yet. Keep typing or press <span className={styles.kbd}>⌘K</span> to browse every action.
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
                The workbench is keyboard-first. Run a command below, use Tab to inspect and complete matches,
                or press <span className={styles.kbd}>⌘K</span> anywhere to search actions.
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
          <span><span className={styles.kbd}>↑↓</span> History / choose</span>
          <span><span className={styles.kbd}>Tab</span> Suggest</span>
          <span><span className={styles.kbd}>Enter</span> Run</span>
          <span><span className={styles.kbd}>Ctrl L</span> Clear</span>
          <span><span className={styles.kbd}>⌘K</span> Palette</span>
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
