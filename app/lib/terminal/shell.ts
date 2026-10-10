import { isSiteTheme, SiteTheme } from '@/app/lib/theme';
import {
  FIRST_ROOM_AMBIENT_INTERACTIONS,
  FIRST_ROOM_CORE_NODES,
  FIRST_ROOM_HIDDEN_ECHOES,
} from '@/app/lib/archive/content';
import {
  CAPABILITY_GROUPS,
  KNOWLEDGE_SIGNALS,
  PORTFOLIO_PROFILE,
  PORTFOLIO_PROJECTS,
  PUBLIC_EVIDENCE_CHECKED_AT,
  SITE_CONFIG,
} from '@/app/lib/content/portfolio';

export const HOME_DIRECTORY = '/home/visitor';
export const ARCHIVE_SESSION_PATH = `${HOME_DIRECTORY}/archive/session.log`;

export const BUILTIN_COMMAND_NAMES = [
  'help',
  'pwd',
  'ls',
  'cd',
  'cat',
  'open',
  'search',
  'tree',
  'find',
  'grep',
  'head',
  'tail',
  'echo',
  'history',
  'date',
  'uname',
  'whoami',
  'hostname',
  'status',
  'neofetch',
  'theme',
  'docs',
  'clear',
] as const;

export const BUILTIN_COMMAND_DESCRIPTIONS: Record<(typeof BUILTIN_COMMAND_NAMES)[number], string> = {
  help: 'Show every command and keyboard shortcut',
  pwd: 'Show your current workspace location',
  ls: 'List files in the current folder',
  cd: 'Move into another folder',
  cat: 'Read a text file in the terminal',
  open: 'Open a file in the visual preview',
  search: 'Search file names and contents',
  tree: 'Map the whole virtual workspace',
  find: 'Find files by name',
  grep: 'Search inside files',
  head: 'Read the beginning of a file',
  tail: 'Read the end of a file',
  echo: 'Print text or environment values',
  history: 'Review commands from this session',
  date: 'Show the local date and time',
  uname: 'Show virtual system information',
  whoami: 'Show the current visitor identity',
  hostname: 'Show the virtual host name',
  status: 'Inspect workbench health',
  neofetch: 'Meet the builder and current focus',
  theme: 'Switch the entire site theme',
  docs: 'Open the command reference',
  clear: 'Clear the terminal transcript',
};

export type TerminalTheme = SiteTheme;

export type VirtualEntry =
  | { type: 'directory' }
  | { type: 'file'; content: string };

export interface WorkspaceNode {
  name: string;
  path: string;
  type: VirtualEntry['type'];
  children?: WorkspaceNode[];
}

export interface PreviewDocument {
  path: string;
  title: string;
  description: string;
  status: string;
  stage: string;
  updated: string;
  stack: readonly string[];
  overview: string;
  evidence?: readonly { label: string; value: string }[];
  href?: string;
  sectionId?: string;
}

// Open the same project the hero features, so the first screen tells one story.
export const DEFAULT_PREVIEW_PATH = `${HOME_DIRECTORY}/projects/artifact-gateway.md`;

const PROJECT_FILE_ENTRIES = Object.fromEntries(PORTFOLIO_PROJECTS.map(project => [
  `${HOME_DIRECTORY}/projects/${project.slug}.md`,
  {
    type: 'file',
    content: [
      `# ${project.title}`,
      '',
      project.description,
      '',
      `Repository: ${project.repositoryUrl}`,
      `Status: ${project.status}`,
      `Stage: ${project.stage}`,
      `Updated: ${project.updated}`,
      `Stack: ${project.stack.join(' · ')}`,
      '',
      'Evidence:',
      ...project.evidence.map(item => `- ${item.label}: ${item.value}`),
      '',
      'Capabilities:',
      ...project.capabilities.map(capability => `- ${capability}`),
    ].join('\n'),
  },
])) as Record<string, VirtualEntry>;

const KNOWLEDGE_FILE_ENTRIES = Object.fromEntries(KNOWLEDGE_SIGNALS.map(signal => [
  `${HOME_DIRECTORY}/knowledge/${signal.slug}.md`,
  {
    type: 'file',
    content: [
      `# ${signal.title}`,
      '',
      signal.excerpt,
      '',
      `Open question: ${signal.openQuestion}`,
      `Indexed: ${signal.indexed}`,
      `Source: ${signal.sourceLabel} · ${signal.sourceUrl}`,
      `Boundary: ${signal.boundary}`,
    ].join('\n'),
  },
])) as Record<string, VirtualEntry>;

const VIRTUAL_FILE_SYSTEM: Record<string, VirtualEntry> = {
  '/': { type: 'directory' },
  '/home': { type: 'directory' },
  [HOME_DIRECTORY]: { type: 'directory' },
  [`${HOME_DIRECTORY}/.profile`]: {
    type: 'file',
    content: 'export USER=visitor\nexport SHELL=/bin/bash\nexport LANG=en_US.UTF-8',
  },
  [`${HOME_DIRECTORY}/README.md`]: {
    type: 'file',
    content: [
      `# ${SITE_CONFIG.domain}`,
      '',
      PORTFOLIO_PROFILE.headline,
      '',
      `${PORTFOLIO_PROJECTS.length} public systems · ${KNOWLEDGE_SIGNALS.length} public-safe knowledge signals`,
      '',
      'Try `open projects/artifact-gateway.md`, `cd knowledge`, `search protocol`, or `help`.',
    ].join('\n'),
  },
  [`${HOME_DIRECTORY}/about.txt`]: {
    type: 'file',
    content: [
      PORTFOLIO_PROFILE.domains.join(' · '),
      '',
      PORTFOLIO_PROFILE.headline,
      '',
      PORTFOLIO_PROFILE.throughLine.en,
    ].join('\n'),
  },
  [`${HOME_DIRECTORY}/contact.txt`]: {
    type: 'file',
    content: `Email:  ${SITE_CONFIG.email}\nGitHub: https://github.com/ccsert`,
  },
  [`${HOME_DIRECTORY}/projects`]: { type: 'directory' },
  ...PROJECT_FILE_ENTRIES,
  [`${HOME_DIRECTORY}/skills`]: { type: 'directory' },
  [`${HOME_DIRECTORY}/skills/stack.txt`]: {
    type: 'file',
    content: CAPABILITY_GROUPS.map(group => `${group.category}: ${group.items.join(', ')}`).join('\n'),
  },
  [`${HOME_DIRECTORY}/knowledge`]: { type: 'directory' },
  ...KNOWLEDGE_FILE_ENTRIES,
  [`${HOME_DIRECTORY}/docs`]: { type: 'directory' },
  [`${HOME_DIRECTORY}/docs/commands.md`]: {
    type: 'file',
    content: 'Command Reference\nUse help for the complete list. Try open, search, tree, grep, status, neofetch, and theme.',
  },
  [`${HOME_DIRECTORY}/docs/architecture.md`]: {
    type: 'file',
    content: 'Workbench Architecture\nA safe in-browser shell drives a virtual workspace and contextual preview pane.',
  },
  [`${HOME_DIRECTORY}/docs/content-policy.md`]: {
    type: 'file',
    content: [
      'Content Evidence Policy',
      '',
      `Public repository facts checked: ${PUBLIC_EVIDENCE_CHECKED_AT}`,
      'Private Wiki material is reduced to public-safe themes and source boundaries.',
      'Draft conversations, secrets, temporary addresses, and unverified outcomes stay private.',
    ].join('\n'),
  },
};

const PROJECT_PREVIEWS = Object.fromEntries(PORTFOLIO_PROJECTS.map(project => {
  const path = `${HOME_DIRECTORY}/projects/${project.slug}.md`;
  return [path, {
    path,
    title: project.title,
    description: project.description,
    status: project.status === 'released' ? 'Released' : 'Active',
    stage: project.stage,
    updated: project.updated,
    stack: project.stack,
    overview: project.overview,
    evidence: project.evidence,
    href: project.repositoryUrl,
    sectionId: 'projects',
  }];
})) as Record<string, PreviewDocument>;

const KNOWLEDGE_PREVIEWS = Object.fromEntries(KNOWLEDGE_SIGNALS.map(signal => {
  const path = `${HOME_DIRECTORY}/knowledge/${signal.slug}.md`;
  return [path, {
    path,
    title: signal.title,
    description: signal.excerpt,
    status: 'Indexed',
    stage: signal.state === 'system' ? 'Knowledge system' : 'Research map',
    updated: signal.indexed,
    stack: signal.tags,
    overview: `${signal.openQuestion} ${signal.boundary}`,
    evidence: [
      { label: 'Source', value: signal.sourceLabel },
      { label: 'Visibility', value: 'Public-safe summary' },
      { label: 'State', value: signal.state },
    ],
    href: signal.sourceUrl,
    sectionId: 'blog',
  }];
})) as Record<string, PreviewDocument>;

const PREVIEW_DOCUMENTS: Record<string, PreviewDocument> = {
  ...PROJECT_PREVIEWS,
  ...KNOWLEDGE_PREVIEWS,
  [`${HOME_DIRECTORY}/skills/stack.txt`]: {
    path: `${HOME_DIRECTORY}/skills/stack.txt`,
    title: 'Technical Stack',
    description: 'The tools I use to ship reliable products and platforms.',
    status: 'Current',
    stage: 'Toolkit',
    updated: PUBLIC_EVIDENCE_CHECKED_AT,
    stack: ['Go', 'Rust', 'TypeScript', 'Python', 'React', 'Docker', 'PostgreSQL', 'Kubernetes', 'Linux'],
    overview: 'Capabilities are grouped by public builds, the core toolbox visible on the GitHub profile, and active knowledge-map research. They are not proficiency scores.',
    sectionId: 'skills',
  },
  [`${HOME_DIRECTORY}/about.txt`]: {
    path: `${HOME_DIRECTORY}/about.txt`,
    title: 'About ccsert',
    description: PORTFOLIO_PROFILE.domains.join(' · '),
    status: 'Online',
    stage: 'Profile',
    updated: PUBLIC_EVIDENCE_CHECKED_AT,
    stack: ['Developer Tools', 'AI-assisted Engineering', 'Self-hosted Infrastructure'],
    overview: `${PORTFOLIO_PROFILE.headline} ${PORTFOLIO_PROFILE.throughLine.en}`,
    sectionId: 'about',
  },
  [`${HOME_DIRECTORY}/docs/commands.md`]: {
    path: `${HOME_DIRECTORY}/docs/commands.md`,
    title: 'CLI Reference',
    description: `Keyboard-first ways to explore ${SITE_CONFIG.domain}.`,
    status: 'Ready',
    stage: 'Docs',
    updated: PUBLIC_EVIDENCE_CHECKED_AT,
    stack: ['Shell', 'Keyboard', 'Search'],
    overview: 'Use help for all commands, Ctrl+K for the command palette, Tab for completion, and open <path> to drive this preview.',
  },
  [`${HOME_DIRECTORY}/docs/architecture.md`]: {
    path: `${HOME_DIRECTORY}/docs/architecture.md`,
    title: 'Workbench Architecture',
    description: 'How the interactive homepage terminal is organized.',
    status: 'Ready',
    stage: 'Docs',
    updated: PUBLIC_EVIDENCE_CHECKED_AT,
    stack: ['Next.js', 'React', 'Virtual FS'],
    overview: 'A client-side virtual shell owns commands and paths while the workbench renders navigation and contextual previews without executing system commands.',
  },
};

export function registerArchiveSession(signalIds: readonly string[]): number {
  const discoveredIds = new Set(signalIds);
  const recoveredRecords = [
    ...FIRST_ROOM_CORE_NODES.map(node => ({ id: node.id, title: node.title.zh, body: node.storyReveal.zh })),
    ...FIRST_ROOM_AMBIENT_INTERACTIONS.map(node => ({ id: node.id, title: node.title.zh, body: node.feedback.zh })),
    ...FIRST_ROOM_HIDDEN_ECHOES.map(node => ({ id: node.id, title: node.title.zh, body: node.reveal.zh })),
  ].filter(record => discoveredIds.has(record.id));
  const recoveryLines = recoveredRecords.length > 0
    ? recoveredRecords.map(record => `- ${record.title}: ${record.body}`)
    : ['- 本地节点已上线；本次交接没有附加故事记录。'];
  const content = [
    'Signal Archive · Recovered session',
    '',
    `Recovered signals: ${recoveredRecords.length}`,
    ...recoveryLines,
  ].join('\n');

  VIRTUAL_FILE_SYSTEM[`${HOME_DIRECTORY}/archive`] = { type: 'directory' };
  VIRTUAL_FILE_SYSTEM[ARCHIVE_SESSION_PATH] = { type: 'file', content };
  PREVIEW_DOCUMENTS[ARCHIVE_SESSION_PATH] = {
    path: ARCHIVE_SESSION_PATH,
    title: 'Signal Archive Recovery Log',
    description: `${recoveredRecords.length} 条已发现的首房记录已从游戏会话交接。`,
    status: 'Online',
    stage: 'Archive',
    updated: 'Current session',
    stack: [],
    overview: recoveryLines.join(' '),
  };
  return recoveredRecords.length;
}

export interface SiteCommandSummary {
  name: string;
  description: string;
}

export interface ShellContext {
  cwd: string;
  previousCwd: string;
  history: string[];
  siteCommands: SiteCommandSummary[];
  theme: TerminalTheme;
  now?: Date;
}

export interface ShellResult {
  handled: boolean;
  output?: string;
  outputType?: 'output' | 'error' | 'info' | 'success';
  nextCwd?: string;
  clear?: boolean;
  previewPath?: string;
  nextTheme?: TerminalTheme;
  openCommandPalette?: boolean;
}

export interface ParsedCommandLine {
  tokens: string[];
  error?: string;
}

export function parseCommandLine(line: string): ParsedCommandLine {
  const tokens: string[] = [];
  let current = '';
  let quote: '"' | "'" | null = null;
  let escaping = false;
  let tokenStarted = false;

  for (const character of line) {
    if (escaping) {
      current += character;
      escaping = false;
      tokenStarted = true;
      continue;
    }

    if (character === '\\' && quote !== "'") {
      escaping = true;
      tokenStarted = true;
      continue;
    }

    if (quote) {
      if (character === quote) {
        quote = null;
      } else {
        current += character;
      }
      tokenStarted = true;
      continue;
    }

    if (character === '"' || character === "'") {
      quote = character;
      tokenStarted = true;
      continue;
    }

    if (/\s/.test(character)) {
      if (tokenStarted) {
        tokens.push(current);
        current = '';
        tokenStarted = false;
      }
      continue;
    }

    current += character;
    tokenStarted = true;
  }

  if (escaping) current += '\\';
  if (quote) return { tokens: [], error: `bash: unexpected EOF while looking for matching ${quote}` };
  if (tokenStarted) tokens.push(current);

  return { tokens };
}

export function displayPath(path: string): string {
  if (path === HOME_DIRECTORY) return '~';
  if (path.startsWith(`${HOME_DIRECTORY}/`)) return `~${path.slice(HOME_DIRECTORY.length)}`;
  return path;
}

export function resolvePath(path: string, cwd: string): string {
  const expanded = path === '~'
    ? HOME_DIRECTORY
    : path.startsWith('~/')
      ? `${HOME_DIRECTORY}/${path.slice(2)}`
      : path;
  const source = expanded.startsWith('/') ? expanded : `${cwd}/${expanded}`;
  const segments: string[] = [];

  for (const segment of source.split('/')) {
    if (!segment || segment === '.') continue;
    if (segment === '..') {
      segments.pop();
    } else {
      segments.push(segment);
    }
  }

  return `/${segments.join('/')}`;
}

function basename(path: string): string {
  return path === '/' ? '/' : path.slice(path.lastIndexOf('/') + 1);
}

function listChildren(path: string): Array<{ name: string; path: string; entry: VirtualEntry }> {
  const prefix = path === '/' ? '/' : `${path}/`;

  return Object.entries(VIRTUAL_FILE_SYSTEM)
    .filter(([candidate]) => {
      if (!candidate.startsWith(prefix) || candidate === path) return false;
      return !candidate.slice(prefix.length).includes('/');
    })
    .map(([candidate, entry]) => ({ name: basename(candidate), path: candidate, entry }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

function relativeToHome(path: string): string {
  if (path === HOME_DIRECTORY) return '~';
  if (path.startsWith(`${HOME_DIRECTORY}/`)) return path.slice(HOME_DIRECTORY.length + 1);
  return path;
}

function descendants(path: string): Array<{ path: string; entry: VirtualEntry }> {
  const prefix = path === '/' ? '/' : `${path}/`;
  return Object.entries(VIRTUAL_FILE_SYSTEM)
    .filter(([candidate]) => candidate !== path && candidate.startsWith(prefix))
    .map(([candidate, entry]) => ({ path: candidate, entry }))
    .sort((left, right) => left.path.localeCompare(right.path));
}

export function getWorkspaceTree(): WorkspaceNode[] {
  const workspaceOrder = ['archive', 'projects', 'knowledge', 'docs', 'skills', 'about.txt', 'contact.txt', 'README.md'];
  const buildNode = (path: string, entry: VirtualEntry): WorkspaceNode => ({
    name: basename(path),
    path,
    type: entry.type,
    children: entry.type === 'directory'
      ? listChildren(path)
          .filter(child => !child.name.startsWith('.'))
          .map(child => buildNode(child.path, child.entry))
      : undefined,
  });

  return listChildren(HOME_DIRECTORY)
    .filter(({ name }) => workspaceOrder.includes(name))
    .sort((left, right) => workspaceOrder.indexOf(left.name) - workspaceOrder.indexOf(right.name))
    .map(({ path, entry }) => buildNode(path, entry));
}

export function getPreviewDocument(path: string): PreviewDocument | undefined {
  const normalizedPath = resolvePath(path, HOME_DIRECTORY);
  const explicitPreview = PREVIEW_DOCUMENTS[normalizedPath];
  if (explicitPreview) return explicitPreview;

  const entry = VIRTUAL_FILE_SYSTEM[normalizedPath];
  if (!entry || entry.type === 'directory') return undefined;
  const [titleLine, ...contentLines] = entry.content.split('\n');
  return {
    path: normalizedPath,
    title: titleLine.replace(/^#\s*/, '') || basename(normalizedPath),
    description: contentLines.find(line => line.trim()) ?? 'Workspace document',
    status: 'Ready',
    stage: 'File',
    updated: PUBLIC_EVIDENCE_CHECKED_AT,
    stack: [],
    overview: contentLines.slice(1).join(' ').trim() || entry.content,
  };
}

export function getWorkspaceEntry(path: string): VirtualEntry | undefined {
  return VIRTUAL_FILE_SYSTEM[resolvePath(path, HOME_DIRECTORY)];
}

export function getWorkspaceFileContent(path: string): string | undefined {
  const entry = getWorkspaceEntry(path);
  return entry?.type === 'file' ? entry.content : undefined;
}

export function searchWorkspace(query: string, rootPath = HOME_DIRECTORY): Array<{ path: string; score: number }> {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];

  return descendants(rootPath)
    .filter(({ path, entry }) => {
      if (entry.type !== 'file') return false;
      return `${path}\n${entry.content}`.toLowerCase().includes(normalizedQuery);
    })
    .sort((left, right) => {
      const leftNameIndex = basename(left.path).toLowerCase().indexOf(normalizedQuery);
      const rightNameIndex = basename(right.path).toLowerCase().indexOf(normalizedQuery);
      const leftPathMatch = leftNameIndex >= 0;
      const rightPathMatch = rightNameIndex >= 0;
      if (leftPathMatch !== rightPathMatch) return leftPathMatch ? -1 : 1;
      if (leftPathMatch && rightPathMatch && leftNameIndex !== rightNameIndex) {
        return leftNameIndex - rightNameIndex;
      }
      return left.path.localeCompare(right.path);
    })
    .map(({ path }, index) => ({ path, score: Math.max(0.51, 0.98 - index * 0.11) }))
    .slice(0, 8);
}

function openInPreview(args: string[], cwd: string): ShellResult {
  if (args.length === 0) {
    return { handled: true, output: 'open: missing file operand', outputType: 'error' };
  }
  if (args.length > 1) {
    return { handled: true, output: 'open: too many arguments', outputType: 'error' };
  }

  const requestedPath = args[0];
  const absolutePath = resolvePath(requestedPath, cwd);
  const entry = VIRTUAL_FILE_SYSTEM[absolutePath];
  if (!entry) {
    return { handled: true, output: `open: ${requestedPath}: No such file or directory`, outputType: 'error' };
  }
  if (entry.type === 'directory') {
    const firstFile = descendants(absolutePath).find(candidate => candidate.entry.type === 'file');
    if (!firstFile) return { handled: true, output: `open: ${requestedPath}: Directory is empty`, outputType: 'error' };
    return {
      handled: true,
      output: `Opened ${relativeToHome(firstFile.path)} in preview →`,
      outputType: 'info',
      previewPath: firstFile.path,
    };
  }

  return {
    handled: true,
    output: `Opened ${relativeToHome(absolutePath)} in preview →`,
    outputType: 'info',
    previewPath: absolutePath,
  };
}

function searchFiles(args: string[], cwd: string): ShellResult {
  const query = args.join(' ').trim();
  if (!query) return { handled: true, output: 'search: missing query', outputType: 'error' };

  const results = searchWorkspace(query, cwd);
  if (results.length === 0) return { handled: true, output: `No results for "${query}".`, outputType: 'info' };

  return {
    handled: true,
    output: [
      `Search results for "${query}":`,
      ...results.map(result => `${result.score.toFixed(2)}  ${relativeToHome(result.path)}`),
      '',
      `Tip: open ${relativeToHome(results[0].path)}`,
    ].join('\n'),
  };
}

function printTree(args: string[], cwd: string): ShellResult {
  if (args.length > 1) return { handled: true, output: 'tree: too many arguments', outputType: 'error' };
  const requestedPath = args[0] ?? '.';
  const absolutePath = resolvePath(requestedPath, cwd);
  const rootEntry = VIRTUAL_FILE_SYSTEM[absolutePath];
  if (!rootEntry) return { handled: true, output: `tree: ${requestedPath}: No such file or directory`, outputType: 'error' };
  if (rootEntry.type === 'file') return { handled: true, output: basename(absolutePath) };

  const lines = [basename(absolutePath)];
  const walk = (path: string, prefix: string) => {
    const children = listChildren(path).filter(child => !child.name.startsWith('.'));
    children.forEach((child, index) => {
      const isLast = index === children.length - 1;
      lines.push(`${prefix}${isLast ? '└──' : '├──'} ${child.name}${child.entry.type === 'directory' ? '/' : ''}`);
      if (child.entry.type === 'directory') walk(child.path, `${prefix}${isLast ? '    ' : '│   '}`);
    });
  };
  walk(absolutePath, '');
  return { handled: true, output: lines.join('\n') };
}

function findFiles(args: string[], cwd: string): ShellResult {
  let rootPath = cwd;
  let query = '';

  if (args[0]) {
    const candidateRoot = resolvePath(args[0], cwd);
    if (VIRTUAL_FILE_SYSTEM[candidateRoot]?.type === 'directory') {
      rootPath = candidateRoot;
      query = args.slice(1).join(' ').toLowerCase();
    } else {
      query = args.join(' ').toLowerCase();
    }
  }

  const matches = descendants(rootPath)
    .filter(({ path, entry }) => entry.type === 'file' && (!query || basename(path).toLowerCase().includes(query)))
    .map(({ path }) => relativeToHome(path));
  return { handled: true, output: matches.length > 0 ? matches.join('\n') : 'find: no matching files' };
}

function grepFiles(args: string[], cwd: string): ShellResult {
  if (args.length === 0) return { handled: true, output: 'grep: missing search pattern', outputType: 'error' };
  const [pattern, requestedPath = '.'] = args;
  const rootPath = resolvePath(requestedPath, cwd);
  const entry = VIRTUAL_FILE_SYSTEM[rootPath];
  if (!entry) return { handled: true, output: `grep: ${requestedPath}: No such file or directory`, outputType: 'error' };

  const candidates = entry.type === 'file' ? [{ path: rootPath, entry }] : descendants(rootPath);
  const needle = pattern.toLowerCase();
  const matches = candidates.flatMap(candidate => {
    if (candidate.entry.type !== 'file') return [];
    return candidate.entry.content.split('\n').flatMap((line, index) =>
      line.toLowerCase().includes(needle)
        ? [`${relativeToHome(candidate.path)}:${index + 1}: ${line}`]
        : [],
    );
  });
  return { handled: true, output: matches.length > 0 ? matches.join('\n') : `grep: no matches for "${pattern}"` };
}

function readFileSlice(command: 'head' | 'tail', args: string[], cwd: string): ShellResult {
  let lineCount = 5;
  let requestedPath: string | undefined;
  if (args[0] === '-n') {
    lineCount = Number.parseInt(args[1] ?? '', 10);
    requestedPath = args[2];
  } else {
    requestedPath = args[0];
  }
  if (!Number.isFinite(lineCount) || lineCount < 1) {
    return { handled: true, output: `${command}: invalid number of lines`, outputType: 'error' };
  }
  if (!requestedPath) return { handled: true, output: `${command}: missing file operand`, outputType: 'error' };

  const absolutePath = resolvePath(requestedPath, cwd);
  const entry = VIRTUAL_FILE_SYSTEM[absolutePath];
  if (!entry) return { handled: true, output: `${command}: ${requestedPath}: No such file or directory`, outputType: 'error' };
  if (entry.type === 'directory') return { handled: true, output: `${command}: ${requestedPath}: Is a directory`, outputType: 'error' };

  const lines = entry.content.split('\n');
  return { handled: true, output: (command === 'head' ? lines.slice(0, lineCount) : lines.slice(-lineCount)).join('\n') };
}

function listDirectory(args: string[], cwd: string): ShellResult {
  let showHidden = false;
  let longFormat = false;
  const targets: string[] = [];

  for (const arg of args) {
    if (arg.startsWith('-') && arg !== '-') {
      for (const option of arg.slice(1)) {
        if (option === 'a') showHidden = true;
        else if (option === 'l') longFormat = true;
        else return { handled: true, output: `ls: invalid option -- '${option}'`, outputType: 'error' };
      }
    } else {
      targets.push(arg);
    }
  }

  if (targets.length > 1) {
    return { handled: true, output: 'ls: multiple paths are not supported in this demo shell', outputType: 'error' };
  }

  const requestedPath = targets[0] ?? '.';
  const absolutePath = resolvePath(requestedPath, cwd);
  const entry = VIRTUAL_FILE_SYSTEM[absolutePath];

  if (!entry) {
    return { handled: true, output: `ls: cannot access '${requestedPath}': No such file or directory`, outputType: 'error' };
  }

  if (entry.type === 'file') return { handled: true, output: basename(absolutePath) };

  const children = listChildren(absolutePath).filter(child => showHidden || !child.name.startsWith('.'));
  const visibleEntries = showHidden
    ? [
        { name: '.', entry: { type: 'directory' } as VirtualEntry },
        { name: '..', entry: { type: 'directory' } as VirtualEntry },
        ...children,
      ]
    : children;

  if (longFormat) {
    return {
      handled: true,
      output: visibleEntries.map(({ name, entry: childEntry }) => {
        const isDirectory = childEntry.type === 'directory';
        const permissions = isDirectory ? 'drwxr-xr-x' : '-rw-r--r--';
        const size = isDirectory ? 64 : childEntry.content.length;
        return `${permissions}  1 visitor staff ${String(size).padStart(4)} Aug 29 06:29 ${name}${isDirectory && !['.', '..'].includes(name) ? '/' : ''}`;
      }).join('\n'),
    };
  }

  return {
    handled: true,
    output: visibleEntries
      .map(({ name, entry: childEntry }) => `${name}${childEntry.type === 'directory' && !['.', '..'].includes(name) ? '/' : ''}`)
      .join('  '),
  };
}

function changeDirectory(args: string[], context: ShellContext): ShellResult {
  if (args.length > 1) return { handled: true, output: 'bash: cd: too many arguments', outputType: 'error' };

  const requestedPath = args[0] ?? '~';
  const targetPath = requestedPath === '-' ? context.previousCwd : resolvePath(requestedPath, context.cwd);
  const entry = VIRTUAL_FILE_SYSTEM[targetPath];

  if (!entry) {
    return { handled: true, output: `bash: cd: ${requestedPath}: No such file or directory`, outputType: 'error' };
  }
  if (entry.type !== 'directory') {
    return { handled: true, output: `bash: cd: ${requestedPath}: Not a directory`, outputType: 'error' };
  }

  return {
    handled: true,
    nextCwd: targetPath,
    output: requestedPath === '-' ? targetPath : undefined,
  };
}

function readFiles(args: string[], cwd: string): ShellResult {
  if (args.length === 0) return { handled: true, output: 'cat: missing operand', outputType: 'error' };

  const contents: string[] = [];
  for (const requestedPath of args) {
    const absolutePath = resolvePath(requestedPath, cwd);
    const entry = VIRTUAL_FILE_SYSTEM[absolutePath];
    if (!entry) {
      return { handled: true, output: `cat: ${requestedPath}: No such file or directory`, outputType: 'error' };
    }
    if (entry.type === 'directory') {
      return { handled: true, output: `cat: ${requestedPath}: Is a directory`, outputType: 'error' };
    }
    contents.push(entry.content);
  }

  return { handled: true, output: contents.join('\n') };
}

function formatHelp(siteCommands: SiteCommandSummary[]): string {
  const shellCommands = [
    ['pwd', 'print current directory'],
    ['ls [-la] [path]', 'list files'],
    ['cd [path]', 'change directory'],
    ['cat <file>', 'print file contents'],
    ['open <path>', 'open a file in preview'],
    ['search <query>', 'search paths and contents'],
    ['tree [path]', 'show workspace tree'],
    ['find [path] [name]', 'find files by name'],
    ['grep <text> [path]', 'search inside files'],
    ['head/tail <file>', 'read part of a file'],
    ['echo <text>', 'print text'],
    ['history', 'show command history'],
    ['date', 'show local date and time'],
    ['uname [-a]', 'show system information'],
    ['whoami', 'print current user'],
    ['hostname', 'print host name'],
    ['status', 'show workbench health'],
    ['neofetch', 'show profile information'],
    ['theme <name>', 'set the whole site to green, cyan, amber, or light'],
    ['docs', 'open command reference'],
    ['clear', 'clear the terminal'],
  ];
  const rows = shellCommands.map(([name, description]) => `  ${name.padEnd(18)} ${description}`);

  if (siteCommands.length > 0) {
    rows.push('', 'Site shortcuts:');
    rows.push(...siteCommands.map(command => `  ${command.name.padEnd(18)} ${command.description}`));
  }

  rows.push(
    '',
    'Keyboard: → accept suggestion · Tab complete / cycle · ↑/↓ history · Esc dismiss',
    '          Ctrl+K palette · Ctrl+L clear · Ctrl+C cancel · Ctrl+U clear input',
  );
  return `Shell commands:\n${rows.join('\n')}`;
}

function expandEnvironmentValue(value: string, context: ShellContext): string {
  return value.replace(/\$(HOME|PWD|USER|SHELL)\b/g, (_, variable: string) => ({
    HOME: HOME_DIRECTORY,
    PWD: context.cwd,
    USER: 'visitor',
    SHELL: '/bin/bash',
  })[variable] ?? '');
}

export function executeShellCommand(commandName: string, args: string[], context: ShellContext): ShellResult {
  switch (commandName) {
    case 'help':
      return { handled: true, output: formatHelp(context.siteCommands) };
    case 'pwd':
      return { handled: true, output: context.cwd };
    case 'ls':
      return listDirectory(args, context.cwd);
    case 'cd':
      return changeDirectory(args, context);
    case 'cat':
      return readFiles(args, context.cwd);
    case 'open':
      return openInPreview(args, context.cwd);
    case 'search':
      return searchFiles(args, context.cwd);
    case 'tree':
      return printTree(args, context.cwd);
    case 'find':
      return findFiles(args, context.cwd);
    case 'grep':
      return grepFiles(args, context.cwd);
    case 'head':
    case 'tail':
      return readFileSlice(commandName, args, context.cwd);
    case 'echo':
      return { handled: true, output: args.map(arg => expandEnvironmentValue(arg, context)).join(' ') };
    case 'history':
      return {
        handled: true,
        output: context.history.map((command, index) => `${String(index + 1).padStart(4)}  ${command}`).join('\n'),
      };
    case 'date':
      return {
        handled: true,
        output: new Intl.DateTimeFormat('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
          timeZone: 'Asia/Shanghai',
          timeZoneName: 'short',
        }).format(context.now ?? new Date()),
      };
    case 'uname':
      if (args.length === 0) return { handled: true, output: 'Linux' };
      if (args.length === 1 && args[0] === '-a') {
        return { handled: true, output: `Linux ${SITE_CONFIG.domain} 6.8.0-virtual #1 SMP x86_64 GNU/Linux` };
      }
      return { handled: true, output: `uname: invalid option -- '${args.join(' ')}'`, outputType: 'error' };
    case 'whoami':
      return { handled: true, output: 'visitor' };
    case 'hostname':
      return { handled: true, output: SITE_CONFIG.domain };
    case 'status':
      return {
        handled: true,
        output: [
          `${SITE_CONFIG.domain} workbench`,
          'status    online',
          'runtime   Next.js · React',
          'shell     virtual · sandboxed',
          `workspace ${Object.values(VIRTUAL_FILE_SYSTEM).filter(entry => entry.type === 'file').length} documents indexed`,
          `projects  ${PORTFOLIO_PROJECTS.length} public repositories`,
          `knowledge ${KNOWLEDGE_SIGNALS.length} public-safe signals`,
          `evidence  checked ${PUBLIC_EVIDENCE_CHECKED_AT}`,
        ].join('\n'),
        outputType: 'info',
      };
    case 'neofetch':
      return {
        handled: true,
        output: [
          `visitor@${SITE_CONFIG.domain}`,
          '──────────────────',
          'Builds:   developer tools · self-hosted systems',
          'Focus:    AI-assisted engineering · visible state',
          'Stack:    Go · Rust · TypeScript · Python · Linux',
          'Shell:    /bin/bash (virtual)',
          `Theme:    ${context.theme}`,
          `Evidence: public GitHub · ${PUBLIC_EVIDENCE_CHECKED_AT}`,
        ].join('\n'),
      };
    case 'theme': {
      const requestedTheme = args[0]?.toLowerCase();
      if (!requestedTheme) {
        return { handled: true, output: `Current theme: ${context.theme}\nAvailable: green, cyan, amber, light` };
      }
      if (!isSiteTheme(requestedTheme)) {
        return { handled: true, output: `theme: unknown theme '${requestedTheme}'`, outputType: 'error' };
      }
      return {
        handled: true,
        output: `Theme changed to ${requestedTheme}.`,
        outputType: 'success',
        nextTheme: requestedTheme,
      };
    }
    case 'docs':
      return {
        handled: true,
        output: 'Opened docs/commands.md in preview →',
        outputType: 'info',
        previewPath: `${HOME_DIRECTORY}/docs/commands.md`,
      };
    case 'clear':
      return { handled: true, clear: true };
    default:
      return { handled: false };
  }
}

export function getPathCompletions(fragment: string, cwd: string, directoriesOnly = false): string[] {
  const slashIndex = fragment.lastIndexOf('/');
  const parentFragment = slashIndex >= 0 ? fragment.slice(0, slashIndex + 1) : '';
  const nameFragment = slashIndex >= 0 ? fragment.slice(slashIndex + 1) : fragment;
  const parentPath = parentFragment ? resolvePath(parentFragment, cwd) : cwd;
  const parentEntry = VIRTUAL_FILE_SYSTEM[parentPath];

  if (!parentEntry || parentEntry.type !== 'directory') return [];

  return listChildren(parentPath)
    .filter(({ name, entry }) => {
      if (!name.startsWith(nameFragment)) return false;
      if (!nameFragment.startsWith('.') && name.startsWith('.')) return false;
      return !directoriesOnly || entry.type === 'directory';
    })
    .map(({ name, entry }) => `${parentFragment}${name}${entry.type === 'directory' ? '/' : ''}`);
}
