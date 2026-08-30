/**
 * Signal Archive 首房内容定义。
 *
 * 作者相关文案只采用公开 GitHub 事实和 LLM Wiki 的 public-safe 高层索引。
 * 私有原文、待复核会话和未经证明的指标不会进入游戏内容。
 */

import type { ArchiveBootService, ArchiveFacts } from './types';

export interface LocalizedText {
  zh: string;
  en: string;
}

export type ArchiveFactKey = keyof ArchiveFacts;

export const FIRST_ROOM_SOURCE_REFERENCES = {
  githubProfile: {
    kind: 'github',
    target: 'https://github.com/ccsert/ccsert',
    note: '公开 GitHub Profile 的项目主线与工程原则',
  },
  githubOpenCodeReview: {
    kind: 'github',
    target: 'https://github.com/ccsert/opencode-review-gitea',
    note: 'Gitea / Forgejo AI PR 审查项目的公开 README',
  },
  githubArtifactGateway: {
    kind: 'github',
    target: 'https://github.com/ccsert/artifact-gateway',
    note: 'Artifact Gateway 的公开 README 与 v0.1.0 状态',
  },
  githubDocBabel: {
    kind: 'github',
    target: 'https://github.com/ccsert/DocBabel',
    note: 'DocBabel 的公开 README 与 v0.1.0 状态',
  },
  githubOmzPm: {
    kind: 'github',
    target: 'https://github.com/ccsert/omz-pm',
    note: 'omz-pm 的公开 README 与 v0.3.0 状态',
  },
  knowledgeIndex: {
    kind: 'public-safe-index',
    target: '#blog',
    note: '私有 LLM Wiki 只读查询后形成的可公开知识主题与证据边界',
  },
  terminalAbout: {
    kind: 'terminal-file',
    target: '/home/visitor/about.txt',
    note: '终端中的现有个人简介',
  },
  terminalOpenCodeReview: {
    kind: 'terminal-file',
    target: '/home/visitor/projects/opencode-review-gitea.md',
    note: 'OpenCode Gitea Review 的终端公开摘要',
  },
  terminalArtifactGateway: {
    kind: 'terminal-file',
    target: '/home/visitor/projects/artifact-gateway.md',
    note: 'Artifact Gateway 的终端公开摘要',
  },
  terminalDocBabel: {
    kind: 'terminal-file',
    target: '/home/visitor/projects/DocBabel.md',
    note: 'DocBabel 的终端公开摘要',
  },
  terminalOmzPm: {
    kind: 'terminal-file',
    target: '/home/visitor/projects/omz-pm.md',
    note: 'omz-pm 的终端公开摘要',
  },
  terminalKnowledgeSystem: {
    kind: 'terminal-file',
    target: '/home/visitor/knowledge/github-first-llm-wiki.md',
    note: 'GitHub-first LLM Wiki 的 public-safe 终端摘要',
  },
  terminalArchitecture: {
    kind: 'terminal-file',
    target: '/home/visitor/docs/architecture.md',
    note: '浏览器虚拟终端的现有架构说明',
  },
} as const;

export type FirstRoomSourceReferenceId = keyof typeof FIRST_ROOM_SOURCE_REFERENCES;

interface ReplaceableEditorialCopy {
  status: 'public-source-derived' | 'knowledge-index-derived' | 'ambient-only';
  replaceable: true;
  slotId: string;
  guidance: LocalizedText;
}

interface FirstRoomContentBase {
  id: string;
  title: LocalizedText;
  sourceRefs: readonly FirstRoomSourceReferenceId[];
  editorial: ReplaceableEditorialCopy;
}

export interface FirstRoomCoreNode extends FirstRoomContentBase {
  kind: 'core';
  prompt: LocalizedText;
  primaryAction: LocalizedText;
  resolvedFeedback: LocalizedText;
  storyReveal: LocalizedText;
  discoveredClueId?: string;
  setsFacts: readonly ArchiveFactKey[];
  relatedTerminalPath?: string;
}

export interface FirstRoomRepairLoop extends FirstRoomContentBase {
  kind: 'repair';
  fault: LocalizedText;
  objective: LocalizedText;
  resolvedFeedback: LocalizedText;
  requiredFacts: readonly ArchiveFactKey[];
  clueNodeIds: readonly string[];
  sequence?: readonly {
    id: ArchiveBootService;
    label: LocalizedText;
  }[];
}

export interface FirstRoomAmbientInteraction extends FirstRoomContentBase {
  kind: 'ambient';
  primaryAction: LocalizedText;
  feedback: LocalizedText;
  blocksBoot: false;
}

export interface FirstRoomHiddenEcho extends FirstRoomContentBase {
  kind: 'hidden-echo';
  requiredClueIds: readonly string[];
  requiredSignalIds: readonly string[];
  requiresServerOnline: boolean;
  reveal: LocalizedText;
  blocksBoot: false;
}

export const FIRST_ROOM_BOOT_SEQUENCE = [
  { id: 'build', label: { zh: '构建', en: 'Build' } },
  { id: 'test', label: { zh: '验证', en: 'Verify' } },
  { id: 'deploy', label: { zh: '交付', en: 'Ship' } },
] as const satisfies readonly {
  id: ArchiveBootService;
  label: LocalizedText;
}[];

export const FIRST_ROOM_CORE_NODES = [
  {
    id: 'core.engineering-console',
    kind: 'core',
    title: { zh: '工程控制台', en: 'Engineering Console' },
    prompt: {
      zh: '三条信号在服务器前中断。先把问题拆开来看。',
      en: 'Three signals break before reaching the server. Separate the problem first.',
    },
    primaryAction: { zh: '扫描信号', en: 'Scan signals' },
    resolvedFeedback: {
      zh: '拓扑已展开：电源、健康循环与启动顺序。',
      en: 'Topology mapped: power, health loop, and boot order.',
    },
    storyReveal: {
      zh: '四个公开项目表面不同，却共享同一条标准：缩小操作面、贴近原生协议、让状态可见，并区分“构建成功”和“交付已验证”。',
      en: 'Four public projects look different but share one standard: small operational surfaces, native boundaries, visible state, and a clear line between a successful build and a verified release.',
    },
    discoveredClueId: 'clue.system-topology',
    setsFacts: ['serverDiagnosed'],
    relatedTerminalPath: '/home/visitor/about.txt',
    sourceRefs: ['githubProfile', 'terminalAbout'],
    editorial: {
      status: 'public-source-derived',
      replaceable: true,
      slotId: 'FIRST_ROOM_ENGINEERING_STORY',
      guidance: {
        zh: '只有在公开资料更新或作者确认后，才增加具体经历、规模与结果。',
        en: 'Add specific experience, scale, or outcomes only after the public source changes or the owner confirms them.',
      },
    },
  },
  {
    id: 'core.agent-workstation',
    kind: 'core',
    title: { zh: 'Agent 工作站', en: 'Agent Workstation' },
    prompt: {
      zh: '探针尚未运行，当前读数不能说明系统健康。',
      en: 'The probe is idle, so the current reading cannot establish system health.',
    },
    primaryAction: { zh: '启动健康探针', en: 'Arm health probe' },
    resolvedFeedback: {
      zh: '探针已就绪；等待有效气流形成可信基线。',
      en: 'Probe armed; waiting for valid airflow to establish a trusted baseline.',
    },
    storyReveal: {
      zh: 'OpenCode Gitea Review 把 AI 审查放回代码所在的 forge：由 Gitea Actions 触发，读取增量 diff，再提交行级评论与结构化结论。',
      en: 'OpenCode Gitea Review keeps AI review inside the forge: Gitea Actions trigger it, incremental diffs scope it, and line comments plus structured decisions carry the result.',
    },
    discoveredClueId: 'clue.agent-observability',
    setsFacts: ['healthProbeArmed'],
    relatedTerminalPath: '/home/visitor/projects/opencode-review-gitea.md',
    sourceRefs: ['githubOpenCodeReview', 'terminalOpenCodeReview'],
    editorial: {
      status: 'public-source-derived',
      replaceable: true,
      slotId: 'FIRST_ROOM_AGENT_STORY',
      guidance: {
        zh: '若加入实际审查效果，必须同时给出公开版本、范围和验证方式。',
        en: 'Any claimed review outcome must name the public version, scope, and verification method.',
      },
    },
  },
  {
    id: 'core.product-blueprint',
    kind: 'core',
    title: { zh: '产品蓝图桌', en: 'Product Blueprint' },
    prompt: {
      zh: '蓝图把构建、验证和交付画成有方向的依赖。',
      en: 'The blueprint draws build, verify, and ship as directed dependencies.',
    },
    primaryAction: { zh: '查看依赖', en: 'Inspect dependencies' },
    resolvedFeedback: {
      zh: '顺序线索已记录：先构建，再验证，最后交付。',
      en: 'Sequence recorded: build first, verify next, ship last.',
    },
    storyReveal: {
      zh: 'Artifact Gateway 把 PostgreSQL 控制面与 S3 字节面分开：同一 Gateway 可单机运行或拆分角色，客户端仍沿用各自的原生包管理协议。',
      en: 'Artifact Gateway separates a PostgreSQL control plane from an S3 byte plane: one Gateway can stay compact or split roles while clients keep their native package protocols.',
    },
    discoveredClueId: 'clue.boot-dependency',
    setsFacts: [],
    relatedTerminalPath: '/home/visitor/projects/artifact-gateway.md',
    sourceRefs: [
      'githubArtifactGateway',
      'terminalArtifactGateway',
    ],
    editorial: {
      status: 'public-source-derived',
      replaceable: true,
      slotId: 'FIRST_ROOM_PRODUCT_DECISION',
      guidance: {
        zh: '继续保留 early release 边界，不把预览能力或路线图写成正式支持。',
        en: 'Preserve the early-release boundary and never promote preview or roadmap items to supported capability.',
      },
    },
  },
  {
    id: 'core.field-notes',
    kind: 'core',
    title: { zh: '现场笔记与收音机', en: 'Field Notes & Radio' },
    prompt: {
      zh: '纸页与广播各保留了一半恢复语境。',
      en: 'The paper trail and radio each preserve half of the recovery context.',
    },
    primaryAction: { zh: '对齐记录', en: 'Align records' },
    resolvedFeedback: {
      zh: '恢复原则已对齐：保持简单，写清关系，再推进下一步。',
      en: 'Recovery principle aligned: keep it simple, write down the relationship, then advance.',
    },
    storyReveal: {
      zh: '知识系统把 raw source 视为证据，把 Wiki 视为可演进综合层：事实要能回到来源，推断要标明，公开发布则需要单独批准。',
      en: 'The knowledge system treats raw sources as evidence and the Wiki as an evolvable synthesis layer: claims trace back, inferences stay labeled, and publication requires separate approval.',
    },
    discoveredClueId: 'clue.recovery-context',
    setsFacts: [],
    relatedTerminalPath: '/home/visitor/knowledge/github-first-llm-wiki.md',
    sourceRefs: ['knowledgeIndex', 'terminalKnowledgeSystem'],
    editorial: {
      status: 'knowledge-index-derived',
      replaceable: true,
      slotId: 'FIRST_ROOM_FIELD_NOTE',
      guidance: {
        zh: '只扩展 public-safe 摘要，不复制私有来源、日志或待复核会话。',
        en: 'Extend only the public-safe summary; never copy private sources, logs, or unreviewed conversations.',
      },
    },
  },
  {
    id: 'core.server-node',
    kind: 'core',
    title: { zh: '服务器节点', en: 'Server Node' },
    prompt: {
      zh: '节点会承认已经完成的修复，并明确显示仍缺少的条件。',
      en: 'The node recognizes completed repairs and shows exactly what remains.',
    },
    primaryAction: { zh: '检查节点', en: 'Inspect node' },
    resolvedFeedback: {
      zh: '本地档案节点在线。显示器已准备交接到终端。',
      en: 'Local archive node online. The display is ready to hand off to the terminal.',
    },
    storyReveal: {
      zh: '这台终端是浏览器中的安全虚拟工作区：它能浏览内容并驱动预览，但不会执行真实系统命令。',
      en: 'This terminal is a safe virtual workspace in the browser: it can browse content and drive previews without executing real system commands.',
    },
    discoveredClueId: 'clue.safe-terminal',
    setsFacts: [],
    relatedTerminalPath: '/home/visitor/docs/architecture.md',
    sourceRefs: ['terminalArchitecture'],
    editorial: {
      status: 'public-source-derived',
      replaceable: true,
      slotId: 'FIRST_ROOM_TERMINAL_HANDOFF',
      guidance: {
        zh: '未来可替换为经确认的终端世界观说明，但不能暗示它会执行真实系统命令。',
        en: 'May be replaced with confirmed terminal-world copy, but must never imply real system command execution.',
      },
    },
  },
] as const satisfies readonly FirstRoomCoreNode[];

export const FIRST_ROOM_REPAIR_LOOPS = [
  {
    id: 'repair.power-link',
    kind: 'repair',
    title: { zh: '电源链路', en: 'Power Link' },
    fault: {
      zh: '机架与供电端之间没有完整路径。',
      en: 'There is no complete path between the rack and its power source.',
    },
    objective: {
      zh: '选择两个匹配端点，重新连接线路。',
      en: 'Select the two matching endpoints and reconnect the line.',
    },
    resolvedFeedback: {
      zh: '电源稳定；第一排机架灯已经亮起。',
      en: 'Power stable; the first row of rack lights is awake.',
    },
    requiredFacts: ['powerLinkConnected'],
    clueNodeIds: ['core.engineering-console', 'core.server-node'],
    sourceRefs: [],
    editorial: {
      status: 'ambient-only',
      replaceable: true,
      slotId: 'FIRST_ROOM_POWER_REPAIR',
      guidance: {
        zh: '这是纯玩法文案；可替换为更贴合最终资产的操作说明，不应附会个人经历。',
        en: 'Gameplay-only copy; replace to match final assets without attaching an invented personal story.',
      },
    },
  },
  {
    id: 'repair.health-loop',
    kind: 'repair',
    title: { zh: '健康循环', en: 'Health Loop' },
    fault: {
      zh: '气流受阻，探针也未运行；旧读数无法作为健康证明。',
      en: 'Airflow is blocked and the probe is idle; stale readings cannot establish health.',
    },
    objective: {
      zh: '清理滤网并启动探针，顺序不限。',
      en: 'Clear the filter and arm the probe in either order.',
    },
    resolvedFeedback: {
      zh: '气流与探针同时稳定，健康基线可信。',
      en: 'Airflow and probe are stable; the health baseline is trustworthy.',
    },
    requiredFacts: ['filterCleared', 'healthProbeArmed'],
    clueNodeIds: ['core.agent-workstation', 'core.server-node'],
    sourceRefs: ['githubArtifactGateway', 'terminalArtifactGateway'],
    editorial: {
      status: 'public-source-derived',
      replaceable: true,
      slotId: 'FIRST_ROOM_HEALTH_REPAIR',
      guidance: {
        zh: '只借用 readiness 需要有效证据这一原则，不附加未公开的健康指标。',
        en: 'Use only the principle that readiness needs valid evidence; do not attach unpublished health metrics.',
      },
    },
  },
  {
    id: 'repair.boot-order',
    kind: 'repair',
    title: { zh: '启动顺序', en: 'Boot Order' },
    fault: {
      zh: '三个阶段存在依赖，但当前顺序尚未确认。',
      en: 'Three stages have dependencies, but their order is unresolved.',
    },
    objective: {
      zh: '按照公开工程循环排列：构建、验证、交付。',
      en: 'Arrange the public engineering loop: build, verify, ship.',
    },
    resolvedFeedback: {
      zh: '依赖成立；启动门槛将重新计算。',
      en: 'Dependencies satisfied; the boot gate will be recalculated.',
    },
    requiredFacts: ['bootOrderResolved'],
    clueNodeIds: ['core.product-blueprint', 'core.field-notes'],
    sequence: FIRST_ROOM_BOOT_SEQUENCE,
    sourceRefs: ['githubProfile', 'githubArtifactGateway'],
    editorial: {
      status: 'public-source-derived',
      replaceable: true,
      slotId: 'FIRST_ROOM_BOOT_ORDER',
      guidance: {
        zh: '玩法动作保持三步；真实发布仍以各仓库的门禁和状态说明为准。',
        en: 'Keep the gameplay at three steps; real releases still follow each repository\'s own gates and status notes.',
      },
    },
  },
] as const satisfies readonly FirstRoomRepairLoop[];

export const FIRST_ROOM_AMBIENT_INTERACTIONS = [
  {
    id: 'ambient.task-lamp',
    kind: 'ambient',
    title: { zh: '任务灯', en: 'Task Lamp' },
    primaryAction: { zh: '打开灯', en: 'Switch on' },
    feedback: {
      zh: '光线照出页边的一句话：先缩小操作面，再让状态变得可见。',
      en: 'The light reveals a margin note: shrink the operational surface, then make state visible.',
    },
    blocksBoot: false,
    sourceRefs: ['githubProfile'],
    editorial: {
      status: 'public-source-derived',
      replaceable: true,
      slotId: 'FIRST_ROOM_VALUE_NOTE',
      guidance: {
        zh: '可替换为作者确认保留的一条工作原则。',
        en: 'Replace with one working principle the owner explicitly confirms.',
      },
    },
  },
  {
    id: 'ambient.work-drawer',
    kind: 'ambient',
    title: { zh: '工作抽屉', en: 'Work Drawer' },
    primaryAction: { zh: '拉开抽屉', en: 'Open drawer' },
    feedback: {
      zh: '一张工程循环卡片：BUILD → VERIFY → SHIP → IMPROVE。',
      en: 'An engineering loop card: BUILD → VERIFY → SHIP → IMPROVE.',
    },
    blocksBoot: false,
    sourceRefs: ['githubProfile'],
    editorial: {
      status: 'public-source-derived',
      replaceable: true,
      slotId: 'FIRST_ROOM_WORK_STYLE',
      guidance: {
        zh: '可替换为作者确认的真实工作习惯；避免把理想状态写成已经验证的事实。',
        en: 'Replace with owner-confirmed work habits; do not present an aspiration as a verified fact.',
      },
    },
  },
  {
    id: 'ambient.archive-box',
    kind: 'ambient',
    title: { zh: '档案箱', en: 'Archive Box' },
    primaryAction: { zh: '翻看索引', en: 'Browse index' },
    feedback: {
      zh: '公开索引里有四份可核验档案：OpenCode Gitea Review、Artifact Gateway v0.1.0、DocBabel v0.1.0 与 omz-pm v0.3.0。',
      en: 'The public index holds four verifiable files: OpenCode Gitea Review, Artifact Gateway v0.1.0, DocBabel v0.1.0, and omz-pm v0.3.0.',
    },
    blocksBoot: false,
    sourceRefs: [
      'githubOpenCodeReview',
      'githubArtifactGateway',
      'githubDocBabel',
      'githubOmzPm',
    ],
    editorial: {
      status: 'public-source-derived',
      replaceable: true,
      slotId: 'FIRST_ROOM_PROJECT_EVIDENCE',
      guidance: {
        zh: '替换为真实、可公开验证的项目证据或版本，不补写不存在的链接和指标。',
        en: 'Replace with real, publicly verifiable project evidence or versions without inventing links or metrics.',
      },
    },
  },
  {
    id: 'ambient.rain-window',
    kind: 'ambient',
    title: { zh: '雨窗', en: 'Rain Window' },
    primaryAction: { zh: '靠近听雨', en: 'Listen closer' },
    feedback: {
      zh: '雨声压低了房间底噪，工作台的信号反而更清楚。',
      en: 'Rain softens the room noise, leaving the workbench signals clearer.',
    },
    blocksBoot: false,
    sourceRefs: [],
    editorial: {
      status: 'ambient-only',
      replaceable: true,
      slotId: 'FIRST_ROOM_ENVIRONMENT_MEMORY',
      guidance: {
        zh: '当前只承担氛围；只有作者确认后，才可加入真实环境或情绪片段。',
        en: 'Atmosphere only; add a real environmental or emotional memory only after owner confirmation.',
      },
    },
  },
] as const satisfies readonly FirstRoomAmbientInteraction[];

export const FIRST_ROOM_HIDDEN_ECHOES = [
  {
    id: 'echo.systems-serve-people',
    kind: 'hidden-echo',
    title: { zh: '回响：保持可理解', en: 'Echo: Keep It Legible' },
    requiredClueIds: [],
    requiredSignalIds: [
      'ambient.task-lamp',
      'ambient.archive-box',
    ],
    requiresServerOnline: true,
    reveal: {
      zh: '维修记录与两条可选档案在同一点汇合：复杂工程最终应变成真正有人能使用的工具，而它的状态、边界与交付证据必须看得见。',
      en: 'The recovery record and two optional archives converge on one idea: complex engineering should become a tool people can actually use, with visible state, boundaries, and delivery evidence.',
    },
    blocksBoot: false,
    sourceRefs: ['githubProfile', 'terminalAbout', 'knowledgeIndex'],
    editorial: {
      status: 'public-source-derived',
      replaceable: true,
      slotId: 'FIRST_ROOM_HIDDEN_ECHO',
      guidance: {
        zh: '可替换为跨多个真实经历反复出现、且由作者确认的原则。',
        en: 'Replace with an owner-confirmed principle that genuinely recurs across multiple real experiences.',
      },
    },
  },
] as const satisfies readonly FirstRoomHiddenEcho[];

export const FIRST_ROOM_DISCOVERY_POLICY = {
  firstVisit: {
    showSignalIndex: false,
    showCompletionCounter: false,
    showHiddenEchoHint: false,
  },
  afterServerOnline: {
    showSignalIndex: true,
    showCompletionCounter: false,
    showHiddenEchoHint: true,
  },
} as const;

export const FIRST_ROOM_CONTENT = {
  roomId: 'first-room',
  contentVersion: 2,
  title: { zh: '失联节点', en: 'The Silent Node' },
  coreNodes: FIRST_ROOM_CORE_NODES,
  repairLoops: FIRST_ROOM_REPAIR_LOOPS,
  ambientInteractions: FIRST_ROOM_AMBIENT_INTERACTIONS,
  hiddenEchoes: FIRST_ROOM_HIDDEN_ECHOES,
  discoveryPolicy: FIRST_ROOM_DISCOVERY_POLICY,
} as const;
