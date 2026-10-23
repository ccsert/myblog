/**
 * 站点可公开内容的单一事实源。
 *
 * GitHub 项目事实于 2026-10-22 从公开仓库、Release 与 README 核验；知识主题来自
 * 私有 LLM Wiki 的只读查询，只保留可公开的高层概念、证据边界与外部来源。
 */

export const PUBLIC_EVIDENCE_CHECKED_AT = '2026-10-22';

export const SITE_CONFIG = {
  domain: 'me.ccsert.top',
  url: 'https://me.ccsert.top',
  email: 'ccsert@foxmail.com',
} as const;

export const PORTFOLIO_PROFILE = {
  headline: 'Turning complex engineering work into tools people can actually use.',
  tagline: '把复杂的工程工作，做成真正能用的工具。',
  metadata: {
    title: `${SITE_CONFIG.domain}｜开发者工具、AI 辅助工程与自托管系统`,
    description: 'ccsert 的个人站：开发者工具、AI 辅助工程与自托管系统。四个可以直接上手试的开源作品，以及几条还在追问的技术线索。',
  },
  domains: ['Developer tools', 'AI-assisted engineering', 'Self-hosted infrastructure'],
  throughLine: {
    zh: '少让使用者操心，尽量沿用原生协议，让状态看得见；构建通过和交付完成，是两回事。',
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
  /** Long-form write-up on this site, when one exists. */
  caseStudy?: string;
}

export const PORTFOLIO_PROJECTS = [
  {
    id: 'PROJ-001',
    slug: 'opencode-review-gitea',
    title: 'OpenCode Gitea Review',
    repositoryUrl: 'https://github.com/ccsert/opencode-review-gitea',
    description: '把 AI 代码审查直接放进 Gitea / Forgejo 的 PR 里，不用再切到另一个面板。',
    overview: '在 PR 里评论一句 /oc 或 /opencode，Gitea Actions 就会读取完整或增量的 diff，把行级评论和审查结论写回 PR。Docker 和源码两种安装方式都用独立配置，不会动到你已有的 OpenCode 工作区。',
    capabilities: [
      '在 PR 评论里输入 /oc 或 /opencode 就能发起审查',
      '只读新增的变更，评论落在具体代码行上',
      '给出 approve、request_changes 或 comment 结论',
      '用 Docker 几分钟装好，也能从源码按需定制',
    ],
    status: 'active',
    stage: 'Public repository',
    stack: ['TypeScript', 'OpenCode', 'Gitea Actions', 'Docker'],
    updated: '2026-09-19',
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
    description: '轻量的制品仓库：PostgreSQL 管状态，S3 兼容存储放文件，客户端照常走原生协议。',
    overview: '同一个 Go 程序既能单节点运行，也能拆成 API、scheduler 和 worker 三种角色；除了 PostgreSQL 和对象存储，不再需要 Redis 或消息队列。OCI、Maven、npm、PyPI、Go、Conan、Cargo 和 Raw 都走各自的原生协议，不必改用统一的上传接口。',
    capabilities: [
      '支持 Hosted、Proxy、Group 三种仓库形态',
      '锁、租约、审计和后台任务都交给 PostgreSQL 协调',
      '制品校验后写入 S3 兼容存储，写入后不再改变',
      '已支持、预览中和计划中的协议分开标注，不混着说',
    ],
    status: 'released',
    stage: 'Early release · v0.9.0',
    caseStudy: '/work/artifact-gateway',
    stack: ['Go', 'PostgreSQL', 'S3', 'React'],
    updated: '2026-10-22',
    evidence: [
      { label: 'Release', value: 'v0.9.0' },
      { label: 'Protocols', value: '8 + APT / NuGet preview' },
      { label: 'License', value: 'MIT' },
    ],
  },
  {
    id: 'PROJ-003',
    slug: 'DocBabel',
    title: 'DocBabel',
    repositoryUrl: 'https://github.com/ccsert/DocBabel',
    description: '基于 BabelDOC 的自托管 PDF 翻译工作台，把任务、术语、模型和离线部署都管起来。',
    overview: '翻译引擎来自 BabelDOC，DocBabel 补上它周围的那一整段工作：用户与权限、翻译队列、文件库、术语表、OpenAI 兼容的模型配置和管理后台。部署可以选单容器、Compose 多容器或离线安装包。',
    capabilities: [
      '创建、排队、取消和追踪 PDF 翻译任务，完成后直接下载',
      '维护术语表，任务里自动提取的术语也能存下来',
      '用 full / core / minimal 三档检查离线资产是否齐全',
      '单容器、Compose 多容器、离线安装包，按环境选',
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
    description: '让 Oh My Zsh 的插件和主题搜得到、看得懂、能先预览，改坏了也能退回去。',
    overview: '一个用 Rust 写的终端界面，内置覆盖全部 359 个插件的中文词典：搜插件、查别名、试穿主题、测启动耗时都在这里完成。每次修改配置前先给你看 diff，确认后再备份并原子替换。',
    capabilities: [
      '359 个内置插件都有中文摘要、用法和别名说明',
      '浏览 144 个内置主题，实时预览或直接试穿',
      '写入前看 diff，自动留时间戳备份，一键恢复',
      '既有 TUI，也有方便写进脚本的 CLI',
    ],
    status: 'released',
    stage: 'Release · v0.3.0',
    stack: ['Rust', 'Ratatui', 'Zsh', 'Terminal UX'],
    updated: '2026-09-05',
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
    excerpt: '原始资料保持不动，整理后的内容写成 Markdown，再用 schema 和确定性的 doctor 检查结构。Git 记录历史，Obsidian 给人阅读，LLM 负责导入、查询和检查。',
    openQuestion: '纯文本索引什么时候会不够用，值得引入更重的检索层？',
    indexed: '2026-08-22',
    state: 'system',
    tags: ['Knowledge Systems', 'Git', 'Provenance'],
    sourceLabel: 'Karpathy · LLM Wiki',
    sourceUrl: 'https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f',
    boundary: '这里只公开架构思路；私有资料、日志和没审过的页面不会出现在站点上。',
  },
  {
    id: 'NOTE-002',
    slug: 'network-paths',
    title: '网络排障：能连上，不等于直连',
    excerpt: '先把底层网络、去程和回程路由、NAT 分开看，再判断 overlay 走的是直连、Peer Relay 还是 DERP。能连上，既不代表路径好，也不代表找到了根因。',
    openQuestion: '还没拿到 status、netcheck 和双向抓包时，哪些判断只能先当作假设？',
    indexed: '2026-08-22',
    state: 'research',
    tags: ['Networking', 'NAT', 'Tailscale'],
    sourceLabel: 'Tailscale · Device connectivity',
    sourceUrl: 'https://tailscale.com/docs/reference/device-connectivity',
    boundary: '不展示临时地址和密钥，也不放没复核过的现场结论。',
  },
  {
    id: 'NOTE-003',
    slug: 'voice-turns',
    title: '实时语音：打断是一种状态管理',
    excerpt: '检测人声、判断一句话说完、决定轮到谁说、处理打断，是四件不同的事。真正能被打断，还得停掉正在播的声音、丢掉已生成但没播出的音频，并让对话历史和用户实际听到的内容对得上。',
    openQuestion: '停顿容忍、响应速度和误打断恢复，怎样一起调好？',
    indexed: '2026-08-22',
    state: 'research',
    tags: ['Voice Agents', 'Turn Detection', 'Realtime'],
    sourceLabel: 'LiveKit · Turn handling',
    sourceUrl: 'https://docs.livekit.io/agents/logic/turns/',
    boundary: '框架文档能支撑这套思路，但不是所有语音 Agent 都得用同一种算法。',
  },
  {
    id: 'NOTE-004',
    slug: 'linux-runtime',
    title: '从 fd readiness 到 OCI runtime',
    excerpt: '先从 poll / epoll 看进程怎样等待 I/O，再看 namespace、cgroup、rootfs 和 OCI 配置怎样拼出一个容器：隔离的视图、资源限制，加上一份启动约定。',
    openQuestion: '镜像层、snapshotter、VFS 和 runtime bundle 之间，还缺哪些环节没有串起来？',
    indexed: '2026-08-22',
    state: 'research',
    tags: ['Linux', 'epoll', 'Containers', 'OCI'],
    sourceLabel: 'OCI Runtime Specification',
    sourceUrl: 'https://github.com/opencontainers/runtime-spec/blob/main/config-linux.md',
    boundary: 'OCI 规范定义的是运行时约定，不等于 Docker、containerd 或 runc 的全部实现。',
  },
] as const satisfies readonly KnowledgeSignal[];

/**
 * “最近在做”。非公开工作只写方向，不写项目或单位名称；更新时同步修改月份。
 */
export const NOW = {
  updated: '2026-10',
  items: [
    { kind: '开源', text: 'Artifact Gateway 往 1.0 走：v0.9 加入了 Cargo，APT 和 NuGet 还在预览。' },
    { kind: '工作', text: '企业 Agent 平台：让任务可靠地执行和回调，中断之后还能接着跑。' },
    { kind: '工作', text: '研发交付流水线：多平台构建，用源码 SHA 和镜像摘要对上每一个版本。' },
  ],
} as const;

export const CAPABILITY_GROUPS = [
  {
    category: '公开作品',
    items: ['Go', 'Rust', 'TypeScript', 'Python'],
    state: 'public',
  },
  {
    category: '产品与服务',
    items: ['React', 'Next.js', 'FastAPI', 'PostgreSQL', 'S3 protocols'],
    state: 'public',
  },
  {
    category: '日常工具',
    items: ['Docker', 'Kubernetes', 'Linux', 'Jenkins', 'Gitea Actions'],
    state: 'toolbox',
  },
  {
    category: '正在研究',
    items: ['RAG & knowledge systems', 'Voice agents', 'Linux & OCI runtime', 'Model gateways'],
    state: 'research',
  },
] as const;

export function getPortfolioProject(slug: string): PortfolioProject | undefined {
  return PORTFOLIO_PROJECTS.find(project => project.slug === slug);
}

export function getKnowledgeSignal(slug: string): KnowledgeSignal | undefined {
  return KNOWLEDGE_SIGNALS.find(signal => signal.slug === slug);
}
