import type { Metadata } from 'next';
import Image from 'next/image';
import { SITE_CONFIG } from '@/app/lib/content/portfolio';
import styles from './page.module.css';

const pageTitle = `Artifact Gateway 案例：把制品仓库的控制面做小｜${SITE_CONFIG.domain}`;
const pageDescription =
  'Artifact Gateway 是一个公开的 Go 项目：PostgreSQL 管控制面，S3 兼容存储放字节，OCI、Maven、npm、PyPI、Go、Conan、Cargo、Raw 继续走原生协议。这篇案例记录它的约束、关键决策、实现难点和验证方式。';

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: '/work/artifact-gateway' },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: '/work/artifact-gateway',
    siteName: SITE_CONFIG.domain,
    locale: 'zh_CN',
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: pageTitle,
    description: pageDescription,
  },
};

const metaItems = [
  { label: 'Version', value: 'v0.9.0' },
  { label: 'Released', value: '2026-10-13' },
  { label: 'Licence', value: 'MIT' },
  { label: 'Status', value: 'early release' },
  { label: 'Checked', value: '2026-10-22' },
];

const stackItems = ['Go', 'PostgreSQL 16', 'S3 兼容存储', 'React Console'];

const tocItems = [
  { id: 'problem', label: '问题' },
  { id: 'constraints', label: '约束' },
  { id: 'decisions', label: '关键决策' },
  { id: 'implementation', label: '实现要点' },
  { id: 'verification', label: '怎么验证' },
  { id: 'status', label: '现在的状态与边界' },
  { id: 'links', label: '相关链接' },
];

const constraintItems = [
  {
    title: '一个二进制，按角色拆开',
    body: '同一份镜像用 GATEWAY_NODE_ROLES 切成 api、scheduler、worker 三种角色，也可以是 standalone，把三种职责放进同一个进程。规模上去以后换的是角色，不是中间件。',
  },
  {
    title: 'PostgreSQL 是唯一的协调与数据库依赖',
    body: '仓库状态、授权、生命周期任务、租约、锁、幂等键、审计记录、运行节点状态，都以 PostgreSQL 为准。通知只用来唤醒，持久表和租约才是权威。',
  },
  {
    title: '字节不进数据库',
    body: '校验过的不可变字节放在 S3 兼容对象存储里，本地栈用 RustFS。对象 key 由服务端按 digest 生成，不是客户端输入。',
  },
  {
    title: '客户端继续用原生协议',
    body: 'OCI 走 /v2/，Maven、npm、PyPI、Go、Raw 各自有自己的根路径。没有一个统一的「上传文件」接口要你去改。',
  },
  {
    title: '状态可见，可回溯',
    body: '发布幂等，删除是逻辑删除加延迟回收，晋级记录不可变快照，复制单独记录 checkpoint 和完整性校验。',
  },
];

const decisions = [
  {
    index: 'D1',
    title: '控制面只用 PostgreSQL',
    choice:
      '锁、队列、通知、任务去重、搜索，全部用数据库原生能力：会话与事务级 advisory lock、FOR UPDATE SKIP LOCKED、LISTEN/NOTIFY、ON CONFLICT 加唯一约束和 RETURNING、pg_trgm 与部分 GIN 索引。',
    gaveUp: 'Redis、Kafka、Elasticsearch、外部消息队列。',
    why: 'LISTEN/NOTIFY 只是唤醒提示，丢一条通知不等于丢工作，worker 会继续轮询持久任务表。搜索由投影视图加 trigram 索引完成，不需要第二套索引系统。代价是索引构建会和写入互相影响，所以 000145 迁移用的是普通 CREATE INDEX，要排维护窗口。',
    sources: ['docs/postgresql-capabilities.md'],
  },
  {
    index: 'D2',
    title: '先校验、后可见',
    choice:
      'object intent → 上传 digest 寻址的对象 → 校验大小与摘要 → 在 PostgreSQL 里提交引用，引用可见才算发布完成。',
    gaveUp: '上传即可见、先写库再补字节，或者把制品塞进数据库。',
    why: 'PostgreSQL 没法参与对象存储的事务，中间态必须显式建模。规则是：已上传未提交的对象不可达；已提交的坐标绝不指向未校验的对象。数据库连接断开会释放 advisory lock，受影响的并发操作必须 fail closed，不能改变持久事实。',
    sources: ['docs/native-hosted-contract.md'],
  },
  {
    index: 'D3',
    title: '保留原生协议和原生路径',
    choice:
      '每个生态走自己的客户端和根路径。Nexus 风格的 /repository/<name>/... 别名已经退役，老路径返回 404，需要改客户端 URL 并重新生成 lockfile。',
    gaveUp: '统一上传接口、自研 REST、完全兼容 Nexus API。',
    why: '迁移成本最低的一侧是客户端不用改。Maven Hosted 默认就是标准发布，mvn deploy 和 gradle publish 不需要额外一步；严格的坐标级提交是可选的开关，代价是多一次 Gateway 提交。',
    sources: ['docs/protocol-compatibility.md'],
  },
  {
    index: 'D4',
    title: '不可变坐标，逻辑删除，延迟回收',
    choice:
      '替换已发布坐标返回 409 coordinate_exists；删除写 tombstone 并把坐标移出解析；字节回收延后，回收前重新检查可见引用；晋级复用内容寻址的字节，不把快照版本改名成发布版本。',
    gaveUp: '就地覆盖、物理删除、复制时重新上传一份。',
    why: '内容寻址让同一份字节能被多个坐标引用，回收时才有依据判断能不能删。晋级和复制各自留下独立的记录：一份是源快照，一份是 checkpoint 加完整性校验。',
    sources: ['docs/artifact-lifecycle-contract.md', 'ARCHITECTURE.md'],
  },
  {
    index: 'D5',
    title: '预览和支持分开标注',
    choice:
      'APT Hosted、NuGet、NuGet Proxy/Group、Helm 都标成 preview 或默认关闭；agctl 的安装通道也写明还没打通。',
    gaveUp: '把能力清单写成「全都支持」。',
    why: '文档里写得很直接：preview 或者 research 不是公开的支持承诺。正式准入还在 issue 里排队，v0.9.0 的发行说明也明确说这次不宣传 go install 通道可用。',
    sources: ['docs/protocol-compatibility.md'],
  },
];

const implementations = [
  {
    index: '01',
    title: '并发首发同一个坐标',
    problem: '两个发布者同时推同一个坐标，或者同一个客户端重复提交。',
    approach:
      '首次 Maven、npm 发布用 session 或事务级 advisory lock 串行化；幂等发布用 ON CONFLICT 加唯一约束和 RETURNING，把「判断是否存在」「写入」「读回」压成一条并发安全的语句。Maven 的 Idempotency-Key 把 session 创建或坐标提交限定到认证 actor 和请求目标 24 小时，同一个 key 换一份 payload 返回 409 idempotency_conflict。已发布坐标不可替换，返回 409 coordinate_exists。',
    cost: '首发的写延迟更长。数据库连接断开会释放 advisory lock，受影响的并发操作必须 fail closed，不能悄悄改掉持久事实。',
    sources: [
      { label: 'postgresql-capabilities.md', href: 'https://github.com/ccsert/artifact-gateway/blob/main/docs/postgresql-capabilities.zh-CN.md' },
      { label: 'native-hosted-contract.md', href: 'https://github.com/ccsert/artifact-gateway/blob/main/docs/native-hosted-contract.zh-CN.md' },
    ],
  },
  {
    index: '02',
    title: '长复制过程中的租约与完成',
    problem: '复制和晋级是大任务，可能跑得比一次租约更长。',
    approach:
      'worker 用 FOR UPDATE SKIP LOCKED 领任务，拿到 lease token 当 fencing，旧 worker 的写入会被围栏挡住。续租失败要取消，不是继续往下写。LISTEN/NOTIFY 只负责唤醒，通知丢了靠轮询恢复。Raw Proxy 的同路径 single-flight 锁同样可续租，性能基线里有确定性测试专门把锁持有超过缩短后的租约，验证续期和续期失败时的取消。',
    cost: '任务完成必须和租约状态对齐。APT 目标签名分发的验证项里就明确列了 lease loss、checkpoint 恢复和 suite 幂等这三条。',
    sources: [
      { label: 'architecture-diagrams.md', href: 'https://github.com/ccsert/artifact-gateway/blob/main/docs/architecture-diagrams.zh-CN.md' },
      { label: 'apt-hosted-distribution.md', href: 'https://github.com/ccsert/artifact-gateway/blob/main/docs/apt-hosted-distribution.zh-CN.md' },
    ],
  },
  {
    index: '03',
    title: '响应丢了，怎么判断这次写入的结果',
    problem: '写请求发出去之后连接断了，重试就可能多出一个对象。',
    approach:
      'agctl 每次 create 都带 Idempotency-Key，重试复用同一个 key，所以响应丢失不会创建出第二个仓库。结果仍然未知时，命令会把 key 打印出来；用 --idempotency-key 重跑会重放原来的结果，同一个 key 换请求会被拒绝，退出码 7。更新和删除不自动重试，必须先读回状态。Maven snapshot import 的规则一样：响应丢失或部分失败后，用同一个 identity 和 key 重试。',
    cost: '客户端要能区分「失败」和「不知道」。没有幂等键的写不能安全重试，只能先读回再决定。',
    sources: [
      { label: 'cli.md', href: 'https://github.com/ccsert/artifact-gateway/blob/main/docs/cli.zh-CN.md' },
      { label: 'maven-snapshot-import.md', href: 'https://github.com/ccsert/artifact-gateway/blob/main/docs/maven-snapshot-import.zh-CN.md' },
    ],
  },
  {
    index: '04',
    title: '日志游标不能跳过还没落盘的记录',
    problem: '跟着一段日志读的时候，得知道自己读到哪了。',
    approach:
      '运行日志读的是当前 Gateway 进程的内存缓冲，GATEWAY_LOG_BUFFER_LINES 默认 1000。响应里标注 scope=local、instanceId 和 sessionId，请求别的实例返回 503，不拿本进程的结果冒充集群结果。游标绑定时间窗，改时间范围或任何一个筛选都会清掉游标、暂停跟随，再取新快照。落盘输出按完整行写进 active.ndjson，轮转用编号分段。历史游标必须带 source、session、segment、offset 和确定性的 tie-break，不能跨重启复用内存缓冲里的 sequence。',
    cost: '进程重启后内存缓冲消失，文件历史和跨节点查询还没有独立的读取器，属于待做的部分。',
    sources: [
      { label: 'runtime-logging.md', href: 'https://github.com/ccsert/artifact-gateway/blob/main/docs/runtime-logging.zh-CN.md' },
      { label: 'runtime-log-product-design.md', href: 'https://github.com/ccsert/artifact-gateway/blob/main/docs/runtime-log-product-design.zh-CN.md' },
    ],
  },
  {
    index: '05',
    title: '令牌不能跟着跳转走到别的服务',
    problem: 'Proxy 读上游时，上游可能返回 30x，甚至指向另一个域。',
    approach:
      'Gateway 自己的客户端认证不会被复制到上游。跨源跳转移除 Authorization、Cookie 和 Proxy-Authorization，链子绕回原始 origin 也不会恢复；给上游的请求禁用客户端 cookie jar，免得它把认证加回去。OCI 的 bearer 交换同样处理，跨源跳转会移除交换到的 token，token 请求本身走和内容请求一样的五跳出口检查，包括独立批准的 issuer 与 CDN 主机。',
    cost: '凭据只发给原本被授权的服务。每一跳都要重新检查 DNS、地址范围和 HTTPS，不能为了藏住失败而放宽策略。',
    sources: [
      { label: 'proxy-egress-design.md', href: 'https://github.com/ccsert/artifact-gateway/blob/main/docs/proxy-egress-design.zh-CN.md' },
    ],
  },
  {
    index: '06',
    title: '字节路径保持常量堆',
    problem: '大对象如果整块进内存，并发一上来就是几个副本的量。',
    approach:
      'Raw Proxy 的 cache miss 用固定 128 KiB 缓冲把上游内容哈希进临时文件，通过 PutVerifiedReader 发布缓存，命中时走 Stat、Open 和 OpenRange，这条路径上的测试会拒绝任何整对象 Get()。每个 Gateway 默认最多同时保留 4 个 Raw Proxy 暂存文件，饱和时返回 503 并带上 Retry-After: 1，同时累加 artifact_gateway_raw_spool_rejections_total。可恢复上传用不可变分块持久化，完成时只做一次有序的摘要校验。',
    cost: '用磁盘换堆压力。部署仍然需要单独的临时卷、空闲空间监控和明确的临时存储上限。',
    sources: [
      { label: 'project-quality-assessment.md', href: 'https://github.com/ccsert/artifact-gateway/blob/main/docs/project-quality-assessment.zh-CN.md' },
      { label: 'performance-baseline.md', href: 'https://github.com/ccsert/artifact-gateway/blob/main/docs/performance-baseline.zh-CN.md' },
    ],
  },
];

const metrics = [
  { label: 'Binary · linux/arm64', value: '28.88 MiB', note: 'amd64 是 31.83 MiB，gzip 快照 9.32 MiB。' },
  { label: 'Runtime image', value: '36.06 MiB', note: '未压缩的镜像内容，含 Gateway 与 healthcheck。' },
  { label: 'Quiet memory', value: '53.59 MiB', note: '静置后的 Gateway 平均值；全栈平均 382.08 MiB。' },
  { label: 'Peak · 128 clients', value: '104.40 MiB', note: '元数据读 32,562 req/s，p95 9 ms。' },
];

const gates = [
  { label: 'make test / make lint / make coverage', body: '共享行为与静态检查。' },
  { label: 'make openapi-check / make architecture-check / make docs-check', body: '契约、依赖方向与双语文档配对。' },
  { label: 'make native-oci-e2e / native-maven-e2e / native-npm-e2e / native-pypi-e2e / native-go-e2e / native-apt-e2e / conan-e2e / cargo-contract', body: '真实原生客户端的读写闸门，逐格式列在协议兼容基线里。' },
  { label: 'make performance-baseline', body: '可复现的本地基线，隔离的 Compose 项目与卷，结束后清理。' },
];

const boundaries = [
  '项目状态是 early release。README 的说明里写明 pre-1.0 的契约仍可能变化，也不包含生产支持承诺。',
  '最新发行版 v0.9.0 于 2026-10-13 发布，仓库最近一次推送在 2026-10-22。许可证 MIT。',
  'OCI、Raw、Maven、Conan 2、npm、PyPI、Go modules、Cargo 的 Hosted / Proxy / Group 都有。APT 只有 Proxy 和 Group，Hosted 仍是未公开宣传的预览，要等生产密钥托管、恢复、告警和运维证据齐了才算数。',
  'NuGet 是默认关闭的预览，Helm 也是默认关闭的预览，准入都在 issue 里排着。',
  'agctl 的源码骨架已经合入，v0.9.0 的发行资产里没有独立的 agctl 归档；go install 通道仍不可用，项目文档不宣传它。',
  '仓库 README 的安装章节还引用较早的 0.4.1，判断当前版本请以 Releases 页面为准。',
];

const linkGroups = [
  {
    title: '项目',
    links: [
      { label: 'GitHub 仓库', href: 'https://github.com/ccsert/artifact-gateway' },
      { label: 'Releases', href: 'https://github.com/ccsert/artifact-gateway/releases' },
      { label: '文档索引', href: 'https://github.com/ccsert/artifact-gateway/blob/main/docs/README.zh-CN.md' },
      { label: '架构说明', href: 'https://github.com/ccsert/artifact-gateway/blob/main/ARCHITECTURE.zh-CN.md' },
    ],
  },
  {
    title: '这份案例引用的文档',
    links: [
      { label: 'PostgreSQL 能力与边界', href: 'https://github.com/ccsert/artifact-gateway/blob/main/docs/postgresql-capabilities.zh-CN.md' },
      { label: 'Native Hosted 契约', href: 'https://github.com/ccsert/artifact-gateway/blob/main/docs/native-hosted-contract.zh-CN.md' },
      { label: '协议兼容基线', href: 'https://github.com/ccsert/artifact-gateway/blob/main/docs/protocol-compatibility.zh-CN.md' },
      { label: '本地性能基线', href: 'https://github.com/ccsert/artifact-gateway/blob/main/docs/performance-baseline.zh-CN.md' },
      { label: '代理出口设计', href: 'https://github.com/ccsert/artifact-gateway/blob/main/docs/proxy-egress-design.zh-CN.md' },
      { label: '运行日志', href: 'https://github.com/ccsert/artifact-gateway/blob/main/docs/runtime-logging.zh-CN.md' },
      { label: 'agctl CLI', href: 'https://github.com/ccsert/artifact-gateway/blob/main/docs/cli.zh-CN.md' },
      { label: '项目质量评估', href: 'https://github.com/ccsert/artifact-gateway/blob/main/docs/project-quality-assessment.zh-CN.md' },
    ],
  },
  {
    title: '本站',
    links: [
      { label: '首页项目区', href: '/#projects' },
      { label: '实验场动手试', href: '/archive#play=artifact-gateway' },
      { label: '实验场读设计思路', href: '/archive#read=artifact-gateway' },
    ],
  },
];

export default function ArtifactGatewayCaseStudyPage() {
  return (
    <article className={styles.page}>
      <header className={styles.header}>
        <div className={styles.shell}>
          <p className={styles.eyebrow}>{'// CASE STUDY · 公开项目'}</p>
          <h1 className={styles.title}>把制品仓库的控制面做小</h1>
          <p className={styles.lede}>
            Artifact Gateway 是一个公开的 Go 项目。它想解决的事很具体：把 OCI、Maven、npm、PyPI、Go、Conan、Cargo、Raw 这些制品入口收进一个网关，
            同时别为了这件事再养一套中间件。这篇案例记录它的约束、关键决策、几个真实工程难点，以及它怎么被验证。
          </p>

          <div className={styles.cover}>
            <Image
              src="/projects/artifact-gateway/cover.jpg"
              alt="Artifact Gateway 封面：抽象的深色背景，没有文字"
              width={1600}
              height={900}
              priority
              sizes="(max-width: 1400px) 100vw, 1340px"
              className={styles.coverImage}
            />
          </div>

          <dl className={styles.metaStrip}>
            {metaItems.map(item => (
              <div className={styles.metaItem} key={item.label}>
                <dt className={styles.metaLabel}>{item.label}</dt>
                <dd className={styles.metaValue}>{item.value}</dd>
              </div>
            ))}
          </dl>

          <ul className={styles.stackList}>
            {stackItems.map(item => (
              <li className={styles.stackTag} key={item}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </header>

      <div className={styles.shell}>
        <div className={styles.layout}>
          <div className={styles.content}>
            <section className={styles.section} id="problem">
              <header className={styles.sectionHead} data-reveal>
                <span className={styles.sectionIndex}>01</span>
                <h2 className={styles.sectionTitle}>问题</h2>
              </header>
              <div className={styles.prose} data-reveal>
                <p>
                  制品仓库的难点，通常不在协议数量，而在中间件数量。
                </p>
                <p>
                  一个仓库要同时提供 OCI、Maven、npm、PyPI、Go、Conan、Cargo、Raw 的原生入口，还要管权限、审计、保留策略、保留期清理、晋级和复制。
                  常见的做法是 Redis 负责缓存或队列，Kafka 或别的 MQ 负责事件，Elasticsearch 负责搜索，再加一套自己的消息总线。
                  每加一个组件，部署、回滚、排障、容量规划就都要多一份。
                </p>
                <p>
                  Artifact Gateway 的出发点不是「再做一个仓库管理」，而是把控制面压到最小。它在 README 里写得很直接：
                  PostgreSQL 是唯一的协调与数据库依赖，不需要 Redis、Kafka、Elasticsearch 或外部消息队列。
                  <a href="https://github.com/ccsert/artifact-gateway#why-artifact-gateway" target="_blank" rel="noopener noreferrer">
                    README · Why Artifact Gateway
                  </a>
                </p>
                <p>
                  那问题就变成：只留一个数据库，够不够撑起一个真正的仓库管理器。
                </p>
              </div>
            </section>

            <section className={styles.section} id="constraints">
              <header className={styles.sectionHead} data-reveal>
                <span className={styles.sectionIndex}>02</span>
                <h2 className={styles.sectionTitle}>约束</h2>
              </header>
              <div className={styles.prose} data-reveal>
                <p>动手之前先划了五条线，后面的决策都是围着它们转的。</p>
              </div>
              <ul className={styles.constraintList} data-reveal-group>
                {constraintItems.map(item => (
                  <li className={styles.constraintItem} key={item.title}>
                    <h3 className={styles.constraintTitle}>{item.title}</h3>
                    <p className={styles.constraintBody}>{item.body}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section className={styles.section} id="decisions">
              <header className={styles.sectionHead} data-reveal>
                <span className={styles.sectionIndex}>03</span>
                <h2 className={styles.sectionTitle}>关键决策</h2>
              </header>
              <div className={styles.prose} data-reveal>
                <p>
                  每张卡片写三件事：选了什么，放弃了什么，为什么。
                </p>
              </div>
              <div className={styles.decisionGrid} data-reveal-group>
                {decisions.map(decision => (
                  <article className={styles.decisionCard} key={decision.index}>
                    <header className={styles.decisionHead}>
                      <span className={styles.decisionIndex}>{decision.index}</span>
                      <h3 className={styles.decisionTitle}>{decision.title}</h3>
                    </header>
                    <dl className={styles.decisionRows}>
                      <div className={styles.decisionRow}>
                        <dt className={styles.decisionLabel}>选择</dt>
                        <dd className={styles.decisionValue}>{decision.choice}</dd>
                      </div>
                      <div className={styles.decisionRow}>
                        <dt className={styles.decisionLabel}>放弃了</dt>
                        <dd className={styles.decisionValue}>{decision.gaveUp}</dd>
                      </div>
                      <div className={styles.decisionRow}>
                        <dt className={styles.decisionLabel}>为什么</dt>
                        <dd className={styles.decisionValue}>{decision.why}</dd>
                      </div>
                    </dl>
                    <p className={styles.decisionSource}>
                      {decision.sources.map(source => (
                        <a key={source} href={`https://github.com/ccsert/artifact-gateway/blob/main/${source}`} target="_blank" rel="noopener noreferrer">
                          {source}
                        </a>
                      ))}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section className={styles.section} id="implementation">
              <header className={styles.sectionHead} data-reveal>
                <span className={styles.sectionIndex}>04</span>
                <h2 className={styles.sectionTitle}>实现要点</h2>
              </header>
              <div className={styles.prose} data-reveal>
                <p>
                  下面是几处真正难的实现，公开文档里有对应的描述。写之前先说清楚：这些是仓库文档记录的工程问题，不是本站推测出来的。
                </p>
              </div>
              <ol className={styles.implList} data-reveal-group>
                {implementations.map(item => (
                  <li className={styles.implItem} key={item.index}>
                    <div className={styles.implHead}>
                      <span className={styles.implIndex}>{item.index}</span>
                      <h3 className={styles.implTitle}>{item.title}</h3>
                    </div>
                    <p className={styles.implRow}>
                      <span className={styles.implLabel}>问题</span>
                      <span className={styles.implValue}>{item.problem}</span>
                    </p>
                    <p className={styles.implRow}>
                      <span className={styles.implLabel}>做法</span>
                      <span className={styles.implValue}>{item.approach}</span>
                    </p>
                    <p className={styles.implRow}>
                      <span className={styles.implLabel}>代价</span>
                      <span className={styles.implValue}>{item.cost}</span>
                    </p>
                    <p className={styles.implSources}>
                      {item.sources.map(source => (
                        <a key={source.label} href={source.href} target="_blank" rel="noopener noreferrer">
                          {source.label} ↗
                        </a>
                      ))}
                    </p>
                  </li>
                ))}
              </ol>
            </section>

            <section className={styles.section} id="verification">
              <header className={styles.sectionHead} data-reveal>
                <span className={styles.sectionIndex}>05</span>
                <h2 className={styles.sectionTitle}>怎么验证</h2>
              </header>
              <div className={styles.prose} data-reveal>
                <p>
                  性能数字来自仓库里的
                  <a href="https://github.com/ccsert/artifact-gateway/blob/main/docs/performance-baseline.zh-CN.md" target="_blank" rel="noopener noreferrer">
                    本地性能基线
                  </a>
                  。先说清楚它的口径：commit <code>7881539a</code>，2026-08-21，一台 arm64 MacBook 加 Docker Desktop 的 Linux arm64 虚拟机，
                  单副本，回环网络，没有 TLS 和 ingress，测的是热读。下面这些数字是一次本地基线，不是生产性能，也不是容量承诺。
                </p>
              </div>
              <div className={styles.metricGrid} data-reveal-group>
                {metrics.map(metric => (
                  <div className={styles.metric} key={metric.label}>
                    <span className={styles.metricLabel}>{metric.label}</span>
                    <strong className={styles.metricValue}>{metric.value}</strong>
                    <span className={styles.metricNote}>{metric.note}</span>
                  </div>
                ))}
              </div>
              <div className={styles.prose} data-reveal>
                <p>
                  同一份基线里，397,000 次测请求零失败，Gateway 没有 panic 或 fatal 日志。
                  复现命令是 <code>make performance-baseline</code>：它会分配空闲回环端口、起一个隔离的 Compose 项目和全新卷，跑完八个负载后写 CSV 证据并清理。
                </p>
                <p>
                  原文明确列了它没覆盖的东西：单台机器、一个副本、单一压测端、只测热读，没有远程延迟、混合读写、大对象、扫描器、签名器，也没有 30 到 60 分钟的 soak。
                  要把它当发布闸门，得先在受控的 Linux amd64 runner 上重做，加上资源上限、TLS 与 ingress。
                </p>
                <p>协议与发行这一侧，靠的是这些闸门：</p>
              </div>
              <ul className={styles.gateList} data-reveal-group>
                {gates.map(gate => (
                  <li className={styles.gateItem} key={gate.label}>
                    <code className={styles.gateCommand}>{gate.label}</code>
                    <span className={styles.gateBody}>{gate.body}</span>
                  </li>
                ))}
              </ul>
              <div className={styles.prose} data-reveal>
                <p>
                  升级路径本身也是证据链的一部分：先校验 <code>SHA256SUMS</code>，对齐 <code>VERSION.txt</code>、<code>gateway version</code> 和发行 commit，
                  核对完整的迁移 ledger 与 checksum，再看 <code>/livez</code> 和 <code>/readyz</code>，用已知制品字节、Group 读取和搜索做精确核验，最后才恢复写入。
                </p>
                <p>
                  有个具体的坑要记住：v0.9.0 新增的 <code>000145_artifact_contains_search_indexes.sql</code> 用普通 <code>CREATE INDEX</code>，
                  不是 <code>CONCURRENTLY</code>，并且在事务里执行，构建索引期间会阻塞相关表的写入。要先排空写入者、安排维护窗口，
                  不要改已经应用的迁移，也不要跳过 ledger 校验。
                </p>
              </div>
            </section>

            <section className={styles.section} id="status">
              <header className={styles.sectionHead} data-reveal>
                <span className={styles.sectionIndex}>06</span>
                <h2 className={styles.sectionTitle}>现在的状态与边界</h2>
              </header>
              <ul className={styles.boundaryList} data-reveal-group>
                {boundaries.map(item => (
                  <li className={styles.boundaryItem} key={item}>{item}</li>
                ))}
              </ul>
              <div className={styles.prose} data-reveal>
                <p>
                  还有两条本站不会替它说的话：没有用户数、没有生产采用的证据，也不会说它在生产里替换了 Nexus。
                  Nexus 的对比只是一条分析线
                  （<a href="https://github.com/ccsert/artifact-gateway/blob/main/docs/nexus-gap-analysis.zh-CN.md" target="_blank" rel="noopener noreferrer">nexus-gap-analysis.md</a>），
                  制品迁移、业务验收和生产切换是各自独立的工作。
                </p>
              </div>
            </section>

            <section className={styles.section} id="links">
              <header className={styles.sectionHead} data-reveal>
                <span className={styles.sectionIndex}>07</span>
                <h2 className={styles.sectionTitle}>相关链接</h2>
              </header>
              <div className={styles.linkGrid} data-reveal-group>
                {linkGroups.map(group => (
                  <section className={styles.linkGroup} key={group.title}>
                    <h3 className={styles.linkGroupTitle}>{group.title}</h3>
                    <ul className={styles.linkList}>
                      {group.links.map(link => (
                        <li key={link.href}>
                          <a href={link.href}>{link.label}</a>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </section>
          </div>

          <nav className={styles.toc} aria-label="本文目录">
            <p className={styles.tocTitle}>目录</p>
            <ol className={styles.tocList}>
              {tocItems.map(item => (
                <li key={item.id}>
                  <a href={`#${item.id}`}>{item.label}</a>
                </li>
              ))}
            </ol>
            <p className={styles.tocNote}>
              事实核对自公开仓库与 Release，记录于 2026-10-22。
            </p>
          </nav>
        </div>
      </div>

      <section className={styles.diagramSection} aria-labelledby="diagram-title">
        <div className={styles.shell}>
          <h2 className={styles.diagramTitle} id="diagram-title" data-reveal>
            一张图：控制面与字节面
          </h2>
          <div className={styles.diagram} data-reveal role="img" aria-label="客户端经由 Gateway 访问 PostgreSQL 控制面与 S3 兼容存储字节面">
            <div className={styles.diagramNode} data-kind="client">
              <span className={styles.diagramKind}>客户端</span>
              <strong className={styles.diagramName}>原生协议</strong>
              <span className={styles.diagramList}>OCI · Maven · npm · PyPI</span>
              <span className={styles.diagramList}>Go · Conan · Cargo · Raw</span>
              <span className={styles.diagramList}>Console</span>
            </div>
            <span className={styles.arrowHorizontal} aria-hidden="true" />
            <div className={styles.diagramNode} data-kind="gateway">
              <span className={styles.diagramKind}>单个 Go 二进制</span>
              <strong className={styles.diagramName}>Gateway</strong>
              <span className={styles.diagramList}>api · scheduler</span>
              <span className={styles.diagramList}>worker · standalone</span>
            </div>
            <span className={styles.arrowHorizontal} aria-hidden="true" />
            <div className={styles.diagramStack}>
              <div className={styles.diagramNode} data-kind="control">
                <span className={styles.diagramKind}>控制面</span>
                <strong className={styles.diagramName}>PostgreSQL 16</strong>
                <span className={styles.diagramList}>元数据 · 授权 · 审计</span>
                <span className={styles.diagramList}>任务 · 租约 · 锁 · 幂等键</span>
              </div>
              <div className={styles.diagramNode} data-kind="bytes">
                <span className={styles.diagramKind}>字节面</span>
                <strong className={styles.diagramName}>S3 兼容存储</strong>
                <span className={styles.diagramList}>不可变、已校验的字节</span>
                <span className={styles.diagramList}>本地栈：RustFS</span>
              </div>
            </div>
          </div>
          <p className={styles.diagramNote}>
            Gateway 不保存持久制品状态，只做连接：事务与协调走 PostgreSQL，内容寻址的对象走对象存储。
          </p>
        </div>
      </section>
    </article>
  );
}
