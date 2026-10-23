import { Circle } from 'lucide-react';
import MissionSection from '@/app/components/sections/mission/MissionSection';
import { NOW, PORTFOLIO_PROFILE } from '@/app/lib/content/portfolio';
import styles from '@/app/components/sections/mission/MissionLog.module.css';

const VALUES = [
  '能省掉的步骤就省掉，少让使用者操心',
  '贴近原生协议和已有工作流，不另起炉灶',
  '让状态、权限和错误都能被看见、被检查',
  '写入、迁移和发布，都先留好预览与回滚',
  '构建通过、部署成功、用户能用，各要各的证据',
];

const INTERESTS = [
  '开发者工具与终端体验',
  'AI Agent 平台：工具调用、执行与恢复',
  '贴近原生协议的制品基础设施',
  '研发交付流水线与版本验证',
  '自托管、离线优先的产品',
];

export default function About() {
  return (
    <MissionSection
      id="about"
      number="03"
      railTitle="About"
      railSubtitle="Operator profile"
      eyebrow="// About"
      title="关于我"
      subtitle="项目各不相同，衡量的标准是同一套。"
    >
      <div className={styles.aboutIntro}>
        <div className={styles.aboutCopy}>
          <p>
            我是 ccsert，主要做开发者工具、AI 应用平台和自托管系统。公开的作品有多协议制品仓库、嵌在代码托管平台里的 AI 审查、自托管的 PDF 翻译工作台，和一个 Rust 写的终端工具；工作中也参与企业 Agent 平台、研发交付流水线和基础设施迁移的建设。
          </p>
          <p>
            我习惯把架构、协议、数据一致性和界面体验放进同一个问题里想：用的人怎样把事情做完，出错时能不能看懂发生了什么，系统又该怎样恢复。
          </p>
          <p>
            判断一件事有没有做完，我会回到真实页面、运行日志和精确版本。{PORTFOLIO_PROFILE.throughLine.zh}
          </p>
        </div>

        <div className={styles.operatorCard} aria-label="Operator profile summary" data-spotlight="card">
          <div className={styles.operatorRow}><span>Handle</span><strong>ccsert</strong></div>
          <div className={styles.operatorRow}><span>Builds</span><strong>Developer tools</strong></div>
          <div className={styles.operatorRow}><span>Focus</span><strong>AI platforms · Self-hosted</strong></div>
          <div className={styles.operatorRow}><span>Loop</span><strong data-accent="true">Build → Verify → Ship</strong></div>
        </div>
      </div>

      <section className={styles.nowStrip} aria-labelledby="now-heading" data-reveal>
        <h3 id="now-heading"><i aria-hidden="true" />最近在做<span>{NOW.updated.replace('-', ' 年 ')} 月</span></h3>
        <ul data-reveal-group>
          {NOW.items.map(item => <li key={item.text}><span>{item.kind}</span>{item.text}</li>)}
        </ul>
      </section>

      <div className={styles.aboutGrid} data-reveal-group>
        <div className={styles.subpanel} data-spotlight="card">
          <h3 className={styles.subpanelTitle}>做事原则</h3>
          <ul className={styles.detailList}>
            {VALUES.map((value, index) => <li key={value}><span className={styles.valueIndex} aria-hidden="true">0{index + 1}</span>{value}</li>)}
          </ul>
        </div>

        <div className={styles.subpanel} data-spotlight="card">
          <h3 className={styles.subpanelTitle}>关注方向</h3>
          <ul className={styles.detailList}>
            {INTERESTS.map(interest => <li key={interest}><Circle size={6} fill="currentColor" aria-hidden="true" />{interest}</li>)}
          </ul>
        </div>

        <div className={styles.subpanel} data-spotlight="card">
          <h3 className={styles.subpanelTitle}>{'// 工作方式'}</h3>
          <div className={styles.codeBlock} aria-label="工作方式代码片段">
            <div>{'{'}</div>
            <div className={styles.codeLine}><span>surface:</span><strong>&apos;keep it small&apos;</strong>,</div>
            <div className={styles.codeLine}><span>boundary:</span><strong>&apos;native protocols&apos;</strong>,</div>
            <div className={styles.codeLine}><span>state:</span><strong>&apos;make it visible&apos;</strong>,</div>
            <div className={styles.codeLine}><span>release:</span><strong>&apos;verify, then ship&apos;</strong>,</div>
            <div>{'}'}</div>
          </div>
        </div>
      </div>
    </MissionSection>
  );
}
