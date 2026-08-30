/**
 * Signal Archive 首房内容定义。
 *
 * 这里的作者相关文案只改写自站点现有公开内容。每一项都带有可替换插槽，
 * 后续只有在作者确认真实经历后，才应把它升级为更具体的故事。
 */

import type { ArchiveBootService, ArchiveFacts } from './types';

export interface LocalizedText {
  zh: string;
  en: string;
}

export type ArchiveFactKey = keyof ArchiveFacts;

export const FIRST_ROOM_SOURCE_REFERENCES = {
  about: {
    kind: 'section',
    target: '#about',
    note: 'About、Values、Interests 与工作方式的现有公开文案',
  },
  projects: {
    kind: 'section',
    target: '#projects',
    note: '四个现有项目条目及其能力摘要',
  },
  terminalAbout: {
    kind: 'terminal-file',
    target: '/home/visitor/about.txt',
    note: '终端中的现有个人简介',
  },
  terminalAgentPlatform: {
    kind: 'terminal-file',
    target: '/home/visitor/projects/agent-platform.md',
    note: 'Agent Platform 的现有公开摘要',
  },
  terminalDevopsPipeline: {
    kind: 'terminal-file',
    target: '/home/visitor/projects/devops-pipeline.md',
    note: 'DevOps Pipeline 的现有公开摘要',
  },
  terminalMonitoring: {
    kind: 'terminal-file',
    target: '/home/visitor/projects/monitoring-dashboard.md',
    note: 'Monitoring Dashboard 的现有公开摘要',
  },
  terminalMicroservices: {
    kind: 'terminal-file',
    target: '/home/visitor/projects/microservices-framework.md',
    note: 'Microservices Framework 的现有公开摘要',
  },
  terminalAgentNotes: {
    kind: 'terminal-file',
    target: '/home/visitor/notes/building-agents.md',
    note: 'Agent 工具边界、记忆、评估与可观察性的现有笔记摘要',
  },
  terminalSystemNotes: {
    kind: 'terminal-file',
    target: '/home/visitor/notes/system-designs.md',
    note: '系统边界、故障模式、可观察性与复杂度成本的现有笔记摘要',
  },
  terminalArchitecture: {
    kind: 'terminal-file',
    target: '/home/visitor/docs/architecture.md',
    note: '浏览器虚拟终端的现有架构说明',
  },
} as const;

export type FirstRoomSourceReferenceId = keyof typeof FIRST_ROOM_SOURCE_REFERENCES;

interface ReplaceableEditorialCopy {
  status: 'existing-site-derived' | 'ambient-only';
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
      zh: '公开档案反复强调一个方向：把复杂技术问题转化为清晰、可靠、可演进的系统。',
      en: 'The public profile returns to one goal: turning complex technical problems into clear, reliable, evolvable systems.',
    },
    discoveredClueId: 'clue.system-topology',
    setsFacts: ['serverDiagnosed'],
    relatedTerminalPath: '/home/visitor/about.txt',
    sourceRefs: ['about', 'terminalAbout', 'terminalSystemNotes'],
    editorial: {
      status: 'existing-site-derived',
      replaceable: true,
      slotId: 'FIRST_ROOM_ENGINEERING_STORY',
      guidance: {
        zh: '替换为一段经作者确认的工程经历：约束、选择、结果与复盘。',
        en: 'Replace with an owner-confirmed engineering story covering constraint, choice, result, and reflection.',
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
      zh: '当前公开方向聚焦 AI Agent 与多智能体系统，并持续关注工具边界、记忆、评估和可观察性。',
      en: 'The current public focus is AI agents and multi-agent systems, with continuing attention to tool boundaries, memory, evaluation, and observability.',
    },
    discoveredClueId: 'clue.agent-observability',
    setsFacts: ['healthProbeArmed'],
    relatedTerminalPath: '/home/visitor/notes/building-agents.md',
    sourceRefs: ['about', 'terminalAgentPlatform', 'terminalAgentNotes'],
    editorial: {
      status: 'existing-site-derived',
      replaceable: true,
      slotId: 'FIRST_ROOM_AGENT_STORY',
      guidance: {
        zh: '替换为一段经作者确认的 Agent 或自动化案例，不补写未经验证的规模与结果。',
        en: 'Replace with an owner-confirmed agent or automation case without inventing scale or outcomes.',
      },
    },
  },
  {
    id: 'core.product-blueprint',
    kind: 'core',
    title: { zh: '产品蓝图桌', en: 'Product Blueprint' },
    prompt: {
      zh: '蓝图把构建、测试和部署画成有方向的依赖。',
      en: 'The blueprint draws build, test, and deploy as directed dependencies.',
    },
    primaryAction: { zh: '查看依赖', en: 'Inspect dependencies' },
    resolvedFeedback: {
      zh: '顺序线索已记录：先构建，再测试，最后部署。',
      en: 'Sequence recorded: build first, test next, deploy last.',
    },
    storyReveal: {
      zh: '公开项目把 Agent 平台、可追溯交付、可观察性和服务韧性放在同一张系统图上。',
      en: 'The public project index connects agent platforms, traceable delivery, observability, and service resilience in one systems view.',
    },
    discoveredClueId: 'clue.boot-dependency',
    setsFacts: [],
    relatedTerminalPath: '/home/visitor/projects/devops-pipeline.md',
    sourceRefs: [
      'projects',
      'terminalAgentPlatform',
      'terminalDevopsPipeline',
      'terminalMonitoring',
      'terminalMicroservices',
    ],
    editorial: {
      status: 'existing-site-derived',
      replaceable: true,
      slotId: 'FIRST_ROOM_PRODUCT_DECISION',
      guidance: {
        zh: '替换为一个经确认的产品或架构判断，并保留真实依赖与权衡。',
        en: 'Replace with a confirmed product or architecture decision while preserving its real dependencies and trade-offs.',
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
      zh: '现有现场笔记围绕 Agent、DevOps 实践和架构权衡；公开原则是简单优于复杂，清晰优于聪明。',
      en: 'The existing field notes cover agents, DevOps practice, and architecture trade-offs; the published principle favors simplicity over complexity and clarity over cleverness.',
    },
    discoveredClueId: 'clue.recovery-context',
    setsFacts: [],
    relatedTerminalPath: '/home/visitor/notes/system-designs.md',
    sourceRefs: ['about', 'terminalAgentNotes', 'terminalSystemNotes'],
    editorial: {
      status: 'existing-site-derived',
      replaceable: true,
      slotId: 'FIRST_ROOM_FIELD_NOTE',
      guidance: {
        zh: '替换为作者确认过的原话、转折或仍在追问的问题。',
        en: 'Replace with an owner-confirmed quote, turning point, or open question.',
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
      status: 'existing-site-derived',
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
    sourceRefs: ['terminalMonitoring', 'terminalAgentNotes'],
    editorial: {
      status: 'existing-site-derived',
      replaceable: true,
      slotId: 'FIRST_ROOM_HEALTH_REPAIR',
      guidance: {
        zh: '可替换为真实可观察性案例，但必须由作者确认指标、故障和结果。',
        en: 'May be replaced with a real observability case only after the owner confirms its signals, failure, and outcome.',
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
      zh: '按照公开流水线语义排列：构建、测试、部署。',
      en: 'Arrange the published pipeline sequence: build, test, deploy.',
    },
    resolvedFeedback: {
      zh: '依赖成立；启动门槛将重新计算。',
      en: 'Dependencies satisfied; the boot gate will be recalculated.',
    },
    requiredFacts: ['bootOrderResolved'],
    clueNodeIds: ['core.product-blueprint', 'core.field-notes'],
    sequence: [
      { id: 'build', label: { zh: '构建', en: 'Build' } },
      { id: 'test', label: { zh: '测试', en: 'Test' } },
      { id: 'deploy', label: { zh: '部署', en: 'Deploy' } },
    ],
    sourceRefs: ['projects', 'terminalDevopsPipeline'],
    editorial: {
      status: 'existing-site-derived',
      replaceable: true,
      slotId: 'FIRST_ROOM_BOOT_ORDER',
      guidance: {
        zh: '可替换为真实交付路径，但不得添加站点现有内容中没有的门禁或成果。',
        en: 'May be replaced with a real delivery path without adding gates or outcomes absent from current site content.',
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
      zh: '光线照出页边的一句话：简单优于复杂，清晰优于聪明。',
      en: 'The light reveals a margin note: simplicity over complexity, clarity over cleverness.',
    },
    blocksBoot: false,
    sourceRefs: ['about'],
    editorial: {
      status: 'existing-site-derived',
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
      zh: '一张现有工作方式卡片：深度工作、异步优先、写下来、尽早迭代。',
      en: 'An existing work-mode card: deep work, async-first, write it down, ship early.',
    },
    blocksBoot: false,
    sourceRefs: ['about'],
    editorial: {
      status: 'existing-site-derived',
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
      zh: '公开索引列出四个主题：Agent Platform、DevOps Pipeline、Monitoring Dashboard、Microservices Framework。',
      en: 'The public index lists four themes: Agent Platform, DevOps Pipeline, Monitoring Dashboard, and Microservices Framework.',
    },
    blocksBoot: false,
    sourceRefs: [
      'projects',
      'terminalAgentPlatform',
      'terminalDevopsPipeline',
      'terminalMonitoring',
      'terminalMicroservices',
    ],
    editorial: {
      status: 'existing-site-derived',
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
      zh: '维修记录与两条可选档案在同一点汇合：技术应当服务于人，复杂系统则需要保持可观察、可验证和可交付。',
      en: 'The recovery record and two optional archives converge on one idea: technology should serve people, while complex systems should remain observable, verifiable, and deliverable.',
    },
    blocksBoot: false,
    sourceRefs: ['about', 'terminalAbout', 'terminalAgentNotes', 'terminalSystemNotes'],
    editorial: {
      status: 'existing-site-derived',
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
  contentVersion: 1,
  title: { zh: '失联节点', en: 'The Silent Node' },
  coreNodes: FIRST_ROOM_CORE_NODES,
  repairLoops: FIRST_ROOM_REPAIR_LOOPS,
  ambientInteractions: FIRST_ROOM_AMBIENT_INTERACTIONS,
  hiddenEchoes: FIRST_ROOM_HIDDEN_ECHOES,
  discoveryPolicy: FIRST_ROOM_DISCOVERY_POLICY,
} as const;
