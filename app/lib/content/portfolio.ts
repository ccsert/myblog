/**
 * 站点可公开内容的单一事实源。
 *
 * GitHub 项目事实于 2026-08-30 从公开仓库与 README 核验；知识主题来自
 * 私有 LLM Wiki 的只读查询，只保留可公开的高层概念、证据边界与外部来源。
 */

export const PUBLIC_EVIDENCE_CHECKED_AT = '2026-08-30';

export const PORTFOLIO_PROFILE = {
  headline: 'Turning complex engineering work into tools people can actually use.',
  metadata: {
    title: 'ccsert.dev｜开发者工具、AI 辅助工程与自托管系统',
    description: 'ccsert 的交互式个人站：探索开发者工具、AI 辅助工程、自托管基础设施，以及可公开的技术知识脉络。',
  },
  domains: ['Developer tools', 'AI-assisted engineering', 'Self-hosted infrastructure'],
  throughLine: {
    zh: '缩小操作面，贴近原生协议，让状态可见，并把“构建成功”和“已验证交付”明确区分。',
    en: 'Keep the operational surface small, integrate at native boundaries, make state visible, and separate a successful build from a verified release.',
  },
  principles: [
    'Small operational surfaces',
    'Native protocol boundaries',
    'Visible, inspectable state',
    'Verifiable releases',
  ],
  workingLoop: ['BUILD', 'VERIFY', 'SHIP', 'IMPROVE'],
} as const;

export interface EvidenceItem {
  label: string;
  value: string;
}

export type PublicProjectStatus = 'active' | 'released';

export interface PortfolioProject {
  id: string;
  slug: string;
  title: string;
  repositoryUrl: string;
  description: string;
  overview: string;
  capabilities: readonly string[];
  status: PublicProjectStatus;
  stage: string;
  stack: readonly string[];
  updated: string;
  evidence: readonly EvidenceItem[];
}

export const PORTFOLIO_PROJECTS = [
  {
    id: 'PROJ-001',
    slug: 'opencode-review-gitea',
    title: 'OpenCode Gitea Review',
    repositoryUrl: 'https://github.com/ccsert/opencode-review-gitea',
    description: '把 AI 代码审查放进 Gitea / Forgejo 原生 PR 流程，而不是另造一个脱离代码现场的面板。',
    overview: '通过 Gitea Actions 监听 PR 与评论事件，按需获取完整或增量 diff，再提交带行级评论和 review decision 的结构化审查；Docker 与源码安装都使用隔离配置，不覆盖已有 OpenCode 工作区。',
    capabilities: [
      '用 /oc 或 /opencode 从 PR 评论触发审查',
      '增量读取新变更，并提交行级评论',
      '输出 approve、request_changes 或 comment 结论',
      '支持 Docker 快速安装与源码级自定义',
    ],
    status: 'active',
    stage: 'Public repository',
    stack: ['TypeScript', 'OpenCode', 'Gitea Actions', 'Docker'],
    updated: '2026-05-21',
    evidence: [
      { label: 'Trigger', value: '/oc · /opencode' },
      { label: 'Review', value: 'Incremental + inline' },
      { label: 'Install', value: 'Docker / source' },
    ],
  },
  {
    id: 'PROJ-002',
    slug: 'artifact-gateway',
    title: 'Artifact Gateway',
    repositoryUrl: 'https://github.com/ccsert/artifact-gateway',
    description: '以 PostgreSQL 协调控制面、S3 兼容存储承载字节面的轻量制品仓库。',
    overview: '同一个 Go Gateway 镜像既可作为单节点运行，也可拆分 API、scheduler 与 worker 角色；客户端继续使用 OCI、Maven、npm、PyPI、Go、Conan 与 Raw 等原生协议，而不是被迫改用通用上传接口。',
    capabilities: [
      'Hosted、Proxy 与 Group 三种仓库形态',
      'PostgreSQL 统一状态、锁、租约、审计与任务协调',
      'S3 兼容对象存储保存已校验的不可变字节',
      '明确区分可用协议、预览能力与路线图占位',
    ],
    status: 'released',
    stage: 'Early release · v0.1.0',
    stack: ['Go', 'PostgreSQL', 'S3', 'React'],
    updated: '2026-08-29',
    evidence: [
      { label: 'Release', value: 'v0.1.0' },
      { label: 'Protocols', value: '7 + APT preview' },
      { label: 'License', value: 'MIT' },
    ],
  },
  {
    id: 'PROJ-003',
    slug: 'DocBabel',
    title: 'DocBabel',
    repositoryUrl: 'https://github.com/ccsert/DocBabel',
    description: '围绕 BabelDOC 构建的自托管 PDF 翻译工作台，覆盖任务、术语、模型与离线资产。',
    overview: '把用户与权限、翻译队列、文件库、术语表、OpenAI-compatible 模型配置和管理后台组合成完整工作流，并提供单容器、多容器与离线安装包三种部署路径。',
    capabilities: [
      '创建、排队、取消、追踪和下载 PDF 翻译任务',
      '维护术语表，并保存任务自动提取的术语',
      '用 full / core / minimal profile 校验离线资产',
      '支持单容器、Compose 多容器和离线安装包',
    ],
    status: 'released',
    stage: 'Release · v0.1.0',
    stack: ['Python', 'FastAPI', 'React', 'PostgreSQL', 'Redis'],
    updated: '2026-05-08',
    evidence: [
      { label: 'Release', value: 'v0.1.0' },
      { label: 'Deploy', value: 'Online / offline' },
      { label: 'License', value: 'AGPL-3.0' },
    ],
  },
  {
    id: 'PROJ-004',
    slug: 'omz-pm',
    title: 'omz-pm',
    repositoryUrl: 'https://github.com/ccsert/omz-pm',
    description: '让 Oh My Zsh 的插件与主题从“会改配置”变成可搜索、可理解、可预览、可回滚的终端体验。',
    overview: 'Rust TUI 内置完整中文插件词典与 README 翻译，支持插件搜索、别名解释、主题试穿和启动耗时测量；任何配置写入都先展示 diff，再备份并原子替换。',
    capabilities: [
      '覆盖 359 个内置插件的中文摘要、用法与别名',
      '浏览 144 个内置主题并实时预览或试穿',
      '写入前 diff、时间戳备份与一键恢复',
      '提供 TUI 与可脚本化 CLI 两套入口',
    ],
    status: 'released',
    stage: 'Release · v0.3.0',
    stack: ['Rust', 'Ratatui', 'Zsh', 'Terminal UX'],
    updated: '2026-08-28',
    evidence: [
      { label: 'Release', value: 'v0.3.0' },
      { label: 'Dictionary', value: '359 / 359' },
      { label: 'Write path', value: 'Diff → backup → atomic' },
    ],
  },
] as const satisfies readonly PortfolioProject[];

export type KnowledgeSignalState = 'system' | 'research';

export interface KnowledgeSignal {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  openQuestion: string;
  indexed: string;
  state: KnowledgeSignalState;
  tags: readonly string[];
  sourceLabel: string;
  sourceUrl: string;
  boundary: string;
}

export const KNOWLEDGE_SIGNALS = [
  {
    id: 'NOTE-001',
    slug: 'github-first-llm-wiki',
    title: 'GitHub-first LLM Wiki',
    excerpt: '把不可变来源、可演进 Markdown、schema 与确定性 doctor 组合成长期知识层；Git 保存历史，Obsidian 提供人类界面，LLM 负责 ingest、query 与 lint。',
    openQuestion: '什么时候文本索引已经不够，值得引入更重的检索层？',
    indexed: '2026-08-22',
    state: 'system',
    tags: ['Knowledge Systems', 'Git', 'Provenance'],
    sourceLabel: 'Karpathy · LLM Wiki',
    sourceUrl: 'https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f',
    boundary: '这里只公开架构摘要；私有来源、日志与未批准页面不会随站点发布。',
  },
  {
    id: 'NOTE-002',
    slug: 'network-paths',
    title: '网络排障：可用不等于直连',
    excerpt: '先分离 underlay、去程与回程路由、NAT，再判断 overlay 处于 direct、Peer Relay 还是 DERP；“能连上”并不能证明路径质量或现场根因。',
    openQuestion: '在缺少 status、netcheck 与双向抓包前，哪些判断只能保留为假设？',
    indexed: '2026-08-22',
    state: 'research',
    tags: ['Networking', 'NAT', 'Tailscale'],
    sourceLabel: 'Tailscale · Device connectivity',
    sourceUrl: 'https://tailscale.com/docs/reference/device-connectivity',
    boundary: '不展示临时地址、密钥或未经复核的现场结论。',
  },
  {
    id: 'NOTE-003',
    slug: 'voice-turns',
    title: '实时语音：打断是状态机能力',
    excerpt: 'VAD、endpointing、turn detection 与 interruption 是不同层次；真正的“可打断”还要停止播放、处理已生成音频，并让对话历史与用户实际听到的内容一致。',
    openQuestion: '如何同时优化停顿容忍、响应速度和误打断恢复？',
    indexed: '2026-08-22',
    state: 'research',
    tags: ['Voice Agents', 'Turn Detection', 'Realtime'],
    sourceLabel: 'LiveKit · Turn handling',
    sourceUrl: 'https://docs.livekit.io/agents/logic/turns/',
    boundary: '框架文档支持工程模型，不代表所有语音 Agent 都必须采用同一算法。',
  },
  {
    id: 'NOTE-004',
    slug: 'linux-runtime',
    title: '从 fd readiness 到 OCI runtime',
    excerpt: '用 poll / epoll 理解进程怎样等待 I/O，再用 namespace、cgroup、rootfs 与 OCI 配置理解容器如何组合隔离视图、资源控制和启动契约。',
    openQuestion: '怎样继续补齐 image layer、snapshotter、VFS 与 runtime bundle 之间的证据链？',
    indexed: '2026-08-22',
    state: 'research',
    tags: ['Linux', 'epoll', 'Containers', 'OCI'],
    sourceLabel: 'OCI Runtime Specification',
    sourceUrl: 'https://github.com/opencontainers/runtime-spec/blob/main/config-linux.md',
    boundary: 'OCI 规范定义运行时契约，不等于 Docker、containerd 或 runc 的全部实现。',
  },
] as const satisfies readonly KnowledgeSignal[];

export const CAPABILITY_GROUPS = [
  {
    category: 'Public builds',
    items: ['Go', 'Rust', 'TypeScript', 'Python'],
    state: 'public',
  },
  {
    category: 'Product surfaces',
    items: ['React', 'FastAPI', 'PostgreSQL', 'S3 protocols'],
    state: 'public',
  },
  {
    category: 'Core toolbox',
    items: ['Docker', 'Kubernetes', 'Linux', 'Gitea Actions'],
    state: 'toolbox',
  },
  {
    category: 'Active research',
    items: ['Agent workflows', 'Model gateways', 'Knowledge systems', 'Voice agents'],
    state: 'research',
  },
] as const;

export function getPortfolioProject(slug: string): PortfolioProject | undefined {
  return PORTFOLIO_PROJECTS.find(project => project.slug === slug);
}

export function getKnowledgeSignal(slug: string): KnowledgeSignal | undefined {
  return KNOWLEDGE_SIGNALS.find(signal => signal.slug === slug);
}
