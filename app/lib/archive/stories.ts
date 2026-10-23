/** Editorial explanations of the public capabilities in portfolio.ts, not execution reports. */
export interface ArchiveStory {
  takeaway: string;
  scene: string;
  sceneTitle: string;
  figureTitle: string;
  steps: readonly { title: string; detail: string }[];
  tradeoff: string;
  connections: Readonly<Record<string, string>>;
}

export const ARCHIVE_STORIES: Readonly<Record<string, ArchiveStory>> = {
  'omz-pm': {
    takeaway: '把选择、预览与真正的配置写入分开，让一次尝试有清楚的退路。',
    sceneTitle: '想换一套主题，先看它会改什么。',
    scene: '换终端主题看起来只是换个外观，其实会动到每天都在用的配置。omz-pm 把插件说明、主题试穿和写入前的 diff 放在一条路上，让“喜欢这个效果”和“决定保存”成为两次分开的选择。',
    figureTitle: '从试穿到写入，保留一个可以返回的起点。',
    steps: [
      { title: '理解与试穿', detail: '先读插件用法，再预览主题在终端里的样子。' },
      { title: '核对差异', detail: '写入之前展示 diff，确认配置会怎样变化。' },
      { title: '备份与写入', detail: '保留时间戳备份，再原子替换；需要时可以恢复。' },
    ],
    tradeoff: '多了一步确认，换来的是看得懂的变化和找得回的旧配置。主题再多，写配置的那一下本身也是体验的一部分。',
    connections: { 'artifact-gateway': '继续看另一个工具怎样保留用户熟悉的操作习惯。', 'github-first-llm-wiki': '从配置备份，继续看知识内容的来源与修改历史。' },
  },
  'DocBabel': {
    takeaway: '翻译是核心能力，围绕它的任务状态、术语和产物管理决定了工作流是否连贯。',
    sceneTitle: '一份 PDF 提交之后，还有一整段工作。',
    scene: '用户需要知道任务是在等待、处理中，还是已经可以下载；也需要维护专业术语、取消不再需要的任务。DocBabel 把这些环节和翻译能力连接起来，让文件从提交到交付都有可以追踪的位置。',
    figureTitle: '沿着一份文档，读懂工作台的职责。',
    steps: [
      { title: '准备任务', detail: '配置模型与术语，创建 PDF 翻译任务。' },
      { title: '管理过程', detail: '排队、追踪状态，并在需要时取消任务。' },
      { title: '保存产物', detail: '在文件库管理产物，下载结果并维护术语。' },
    ],
    tradeoff: '自托管意味着部署和资产也得自己管。单容器、Compose 和离线安装包对应不同环境；离线 profile 把“要准备哪些东西”变成一份可以检查的清单。',
    connections: { 'github-first-llm-wiki': '翻译产物如何继续进入有来源的知识积累。', 'artifact-gateway': '从离线资产，继续看制品内容怎样被保存和分发。' },
  },
  'artifact-gateway': {
    takeaway: '让客户端继续使用原生协议，把统一放在仓库状态与存储职责上。',
    sceneTitle: '同一套基础设施，接住不同工具的请求。',
    scene: '镜像、语言包与普通文件各有自己的客户端。Artifact Gateway 保留这些原生入口，通过 Hosted、Proxy 和 Group 表达仓库形态，再把状态协调和制品字节交给各自的存储层。',
    figureTitle: '入口汇合之后，状态与字节各有去处。',
    steps: [
      { title: '原生客户端', detail: 'OCI、Maven、npm、PyPI、Go、Conan、Cargo 与 Raw。' },
      { title: 'Gateway', detail: '承接仓库访问，组织 Hosted、Proxy 与 Group。' },
      { title: '职责分开', detail: 'PostgreSQL 协调状态；S3 兼容存储保存已校验字节。' },
    ],
    tradeoff: '保留原生协议，就得逐个处理各协议的细节。所以已经可用的、APT 与 NuGet 这样还在预览的、以及只在路线图上的，都会分开标注。单节点还是拆角色部署可以按需选，但真实环境的性能还得在真实环境里测。',
    connections: { 'linux-runtime': '从一个服务镜像，继续追踪它在运行时里的边界。', 'network-paths': '当请求经过网关，怎样验证它实际走过的路径。' },
  },
  'opencode-review-gitea': {
    takeaway: '让反馈回到 PR 与具体代码行，审查范围和结论都能被继续处理。',
    sceneTitle: '一句审查请求，最后应落到可以行动的位置。',
    scene: '在 PR 中用 /oc 或 /opencode 发起请求之后，工具需要确定读取哪些变更，再把结论送回协作现场。这个项目将完整或增量 diff、行级评论和 review decision 接入已有的 Gitea / Forgejo 流程。',
    figureTitle: '从触发到反馈，始终围绕同一次代码变更。',
    steps: [
      { title: 'PR 内触发', detail: '通过评论命令与 Gitea Actions 进入审查。' },
      { title: '确定范围', detail: '按需读取完整或增量 diff。' },
      { title: '提交反馈', detail: '返回行级评论和 approve、request_changes 或 comment 结论。' },
    ],
    tradeoff: '结构化的输出让每条反馈都有位置、有结论，团队可以逐条核对。部署用的是独立配置，不会碰你已有的 OpenCode 工作区。上面试玩里的 await 修改只是演示行级反馈长什么样。',
    connections: { 'voice-turns': '从代码反馈继续看实时语音怎样保持上下文一致。', 'github-first-llm-wiki': '让一次讨论留下可以追踪、继续维护的知识。' },
  },
  'github-first-llm-wiki': {
    takeaway: '一段结论能回到来源，也能看见后来怎样被修改，知识才有可追踪的上下文。',
    sceneTitle: '下次再读这条结论，还能找到当时的依据吗？',
    scene: '把来源、整理后的内容和检查结果分开阅读，会得到三个不同的问题：材料来自哪里，结论如何表达，结构是否通过检查。Git 为修改留下历史，Markdown 则让人和工具都能继续维护内容。',
    figureTitle: '把一条知识放回它的来源与演进过程。',
    steps: [
      { title: '保留来源', detail: '先保留可追溯的原始依据。' },
      { title: '维护内容', detail: '在 Markdown 中整理，用 Git 保存历史。' },
      { title: '执行检查', detail: '用 schema 和确定性检查维护结构。' },
    ],
    tradeoff: '结构检查只能告诉你内容合不合约定，理解和判断还得回到来源。读的时候可以顺着引用追问，也可以翻修改历史，看一条结论是怎么变过来的。',
    connections: { 'DocBabel': '看文档翻译与产物管理怎样组成一条工作流。', 'opencode-review-gitea': '看工具怎样把反馈留在可以核对的具体位置。' },
  },
  'network-paths': {
    takeaway: '把“请求成功”和“路径得到验证”分开记录，排障才有继续收敛的依据。',
    sceneTitle: '页面打开了，接下来究竟该验证什么？',
    scene: '连接成功是一个观察结果。继续判断路径时，还需要分别看底层连通性、去程与回程、NAT 和 overlay 连接方式。把这些层次列开，能避免用一个成功请求替代整条路径的解释。',
    figureTitle: '按层次追问，把观察结果和路径判断连起来。',
    steps: [
      { title: '底层条件', detail: '检查 underlay、路由与 NAT。' },
      { title: '连接方式', detail: '区分 direct、Peer Relay 与 DERP。' },
      { title: '现场证据', detail: '结合 status、netcheck 与双向抓包核对判断。' },
    ],
    tradeoff: '有用的排障记录，既写清已知，也写清未知。证据不够的判断先标成假设，后面的观察才能明确地支持或推翻它。',
    connections: { 'artifact-gateway': '把路径问题放回一个真实的制品访问入口。', 'linux-runtime': '继续拆分运行环境里不同层次的职责。' },
  },
  'voice-turns': {
    takeaway: '一次打断会同时影响播放、待播放音频和对话历史。',
    sceneTitle: '用户开口之后，系统要一起改变哪些状态？',
    scene: '检测到声音、判断一句话结束、决定轮到谁说话，是不同层次的工作。讨论打断时，可以沿着用户实际听到的内容，把播放、已经生成的音频和后续对话上下文放到一起检查。',
    figureTitle: '沿一次打断，检查三个需要对齐的位置。',
    steps: [
      { title: '当前播放', detail: '用户开始说话时，处理正在播放的回应。' },
      { title: '待播音频', detail: '同时处理已经生成但尚未听到的部分。' },
      { title: '对话历史', detail: '让后续上下文与用户实际听到的内容一致。' },
    ],
    tradeoff: '停顿容忍、响应速度和误打断恢复得一起考虑。最好从一次具体对话出发，逐个观察这几个状态，而不是只看声音停没停。',
    connections: { 'opencode-review-gitea': '换一个协作场景，看 AI 反馈怎样留在原有上下文。', 'network-paths': '继续看怎样把观察结果与根因判断分开。' },
  },
  'linux-runtime': {
    takeaway: '先辨认每个机制的职责，再理解它们怎样组合成一个运行环境。',
    sceneTitle: '沿着进程，逐层拆开“容器”这个词。',
    scene: '从 poll / epoll 的 I/O 等待，到 namespace 的视图、cgroup 的资源控制，再到 rootfs 与 OCI 配置，可以建立一条逐步深入的阅读路径。每一层都回答不同的问题。',
    figureTitle: '这是一张阅读地图，按职责进入不同层次。',
    steps: [
      { title: '等待 I/O', detail: '从 poll / epoll 理解进程如何等待就绪事件。' },
      { title: '组织环境', detail: '分别看 namespace、cgroup 与 rootfs。' },
      { title: '启动契约', detail: '沿 OCI 配置追踪运行时需要的约定。' },
    ],
    tradeoff: '这条路线给的是一张按职责划分的地图。真要研究具体实现，还得把规范、镜像层、文件系统和运行时分别对照，别拿一层的说明去解释整个系统。',
    connections: { 'artifact-gateway': '看一个服务怎样提供单节点与拆分角色两种组织方式。', 'DocBabel': '从运行环境继续看在线与离线部署的资产准备。' },
  },
};
