import { KNOWLEDGE_SIGNALS, PORTFOLIO_PROJECTS } from '../content/portfolio';

export type ArchiveKind = 'project' | 'note';
export type ArchiveFilter = 'all' | ArchiveKind;

export interface ArchiveEntry {
  slug: string;
  number: string;
  kind: ArchiveKind;
  title: string;
  question: string;
  summary: string;
  body: string;
  tags: readonly string[];
  source: string;
  sourceLabel: string;
  path: string;
  updated: string;
  points: readonly string[];
  perspective: string;
  nextQuestion: string;
  related: readonly string[];
  evidence: readonly { label: string; value: string }[];
}

const PROJECT_ANGLES: Record<string, { question: string; perspective: string; nextQuestion: string; related: string[] }> = {
  'omz-pm': {
    question: '怎样让一个命令行工具，值得放心尝试？',
    perspective: '预览让修改可见，备份让原点可达。把这两件事放在写入之前，试用一个插件或主题就有了清楚的起点与退路。界面带来的信任，最终要由写入路径兑现。',
    nextQuestion: '哪些操作应该先展示结果，再让用户决定是否应用？',
    related: ['artifact-gateway', 'github-first-llm-wiki'],
  },
  'opencode-review-gitea': {
    question: 'AI 读完代码之后，回答应该落在哪里？',
    perspective: '行级评论把反馈留在变更发生的地方。完整与增量 diff 则让审查范围成为明确的选择。由此可以讨论的，不只是模型能说什么，还有团队怎样理解、核对与处理它的回应。',
    nextQuestion: '当 AI 进入已有工具链，哪些工作习惯值得保留？',
    related: ['voice-turns', 'github-first-llm-wiki'],
  },
  'artifact-gateway': {
    question: '一个仓库入口，为什么不让大家统一换成一种上传方式？',
    perspective: '保留原生客户端，意味着用户能继续沿用熟悉的拉取、发布与依赖管理方式。复杂度由网关接住；控制面的状态协调与字节面的存储职责则分别交给 PostgreSQL 和 S3 兼容存储。',
    nextQuestion: '统一一个系统，应该统一接口，还是统一接口背后的职责？',
    related: ['linux-runtime', 'network-paths'],
  },
  'DocBabel': {
    question: '从一次 PDF 翻译，到一件产品，中间还缺什么？',
    perspective: '翻译能力之外，任务需要排队、取消与追踪，术语需要维护，产物需要保存和下载。把这些环节连接起来，才形成可持续使用的工作流；离线部署还需要可核验的资产集合。',
    nextQuestion: '当核心能力已经可用，哪一段流程最影响实际使用？',
    related: ['github-first-llm-wiki', 'artifact-gateway'],
  },
};

const NOTE_ANGLES: Record<string, { question: string; points: string[]; related: string[] }> = {
  'github-first-llm-wiki': {
    question: '如果知识也像代码一样，有来源、有检查、有历史？',
    points: ['保留不可变来源，让内容能够追溯。', '让 Markdown 持续演进，用 Git 保存修改历史。', '用 schema 与确定性检查维护知识层。'],
    related: ['DocBabel', 'opencode-review-gitea'],
  },
  'network-paths': {
    question: '“能连上”，究竟证明了什么？',
    points: ['先拆分 underlay、去程路由、回程路由与 NAT。', '区分 direct、Peer Relay 与 DERP 的连接路径。', '在拿到现场证据前，把未验证判断保留为假设。'],
    related: ['artifact-gateway', 'linux-runtime'],
  },
  'voice-turns': {
    question: '让 AI 停下来听你说，为什么不只是停掉声音？',
    points: ['区分 VAD、endpointing、turn detection 与 interruption。', '打断需要同时处理播放和已经生成的音频。', '对话历史需要与用户实际听到的内容保持一致。'],
    related: ['opencode-review-gitea', 'network-paths'],
  },
  'linux-runtime': {
    question: '容器的边界，究竟由什么组成？',
    points: ['从 poll / epoll 理解进程怎样等待 I/O。', '把 namespace、cgroup 与 rootfs 放回各自的职责。', '通过 OCI 配置继续追踪运行时的启动契约。'],
    related: ['artifact-gateway', 'DocBabel'],
  },
};

const projectOrder = ['omz-pm', 'DocBabel', 'artifact-gateway', 'opencode-review-gitea'];

export const ARCHIVE_ENTRIES: ArchiveEntry[] = [
  ...projectOrder.map(slug => {
    const project = PORTFOLIO_PROJECTS.find(item => item.slug === slug)!;
    const angle = PROJECT_ANGLES[slug];
    return {
      slug, kind: 'project' as const, title: project.title, question: angle.question,
      summary: project.description, body: project.overview, tags: project.stack,
      source: project.repositoryUrl, sourceLabel: '查看项目源码', path: `/home/visitor/projects/${slug}.md`,
      updated: project.updated, points: project.capabilities, perspective: angle.perspective,
      nextQuestion: angle.nextQuestion, related: angle.related, evidence: project.evidence,
    };
  }),
  ...KNOWLEDGE_SIGNALS.map(note => ({
    slug: note.slug, kind: 'note' as const, title: note.title, question: NOTE_ANGLES[note.slug].question,
    summary: note.excerpt, body: note.excerpt, tags: note.tags,
    source: note.sourceUrl, sourceLabel: note.sourceLabel, path: `/home/visitor/knowledge/${note.slug}.md`,
    updated: note.indexed, points: NOTE_ANGLES[note.slug].points, perspective: note.boundary,
    nextQuestion: note.openQuestion, related: NOTE_ANGLES[note.slug].related, evidence: [],
  })),
].map((entry, index) => ({ ...entry, number: String(index + 1).padStart(2, '0') }));

export function findArchiveEntry(slug: string | null | undefined) {
  return ARCHIVE_ENTRIES.find(entry => entry.slug === slug);
}

export function filterArchiveEntries(kind: ArchiveFilter, query: string) {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return ARCHIVE_ENTRIES.filter(entry => {
    if (kind !== 'all' && entry.kind !== kind) return false;
    const text = [entry.title, entry.question, entry.summary, entry.body, ...entry.tags].join(' ').toLocaleLowerCase();
    return terms.every(term => text.includes(term));
  });
}

export function archiveEntryHref(entry: ArchiveEntry) {
  return `#read=${encodeURIComponent(entry.slug)}`;
}

export function archiveEntryFromHash(hash: string) {
  try {
    return hash.startsWith('#read=') ? findArchiveEntry(decodeURIComponent(hash.slice(6))) : undefined;
  } catch { return undefined; }
}

export function archiveTerminalHref(entry: ArchiveEntry) {
  return `/?open=${encodeURIComponent(entry.path)}#workbench`;
}
