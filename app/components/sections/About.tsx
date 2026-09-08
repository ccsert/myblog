import { Circle } from 'lucide-react';
import MissionSection from '@/app/components/sections/mission/MissionSection';
import { PORTFOLIO_PROFILE, SITE_CONFIG } from '@/app/lib/content/portfolio';
import styles from '@/app/components/sections/mission/MissionLog.module.css';

const VALUES = [
  '缩小操作面，不制造不必要的中间层',
  '尊重原生协议，让用户沿用熟悉工具',
  '让状态、风险与失败路径可以被看见',
  '构建成功，不等于发布已经验证',
];

const INTERESTS = [
  'Developer tools 与 terminal UX',
  'AI-assisted engineering workflows',
  'Protocol-native artifact infrastructure',
  'Self-hosted 与 offline-first products',
];

export default function About() {
  return (
    <MissionSection
      id="about"
      number="03"
      railTitle="About"
      railSubtitle="Operator profile"
      eyebrow="// Operator profile"
      title="About"
      subtitle="The through-line behind the repositories"
    >
      <div className={styles.aboutIntro}>
        <div className={styles.aboutCopy}>
          <p>
            我关心的不是堆叠更多技术名词，而是把复杂工程工作变成真正有人愿意使用、也能放心操作的工具。
            公开项目横跨开发者工具、AI 辅助工程与自托管基础设施，但它们都在处理同一个问题：怎样让复杂度留在系统内部。
          </p>
          <p>
            {PORTFOLIO_PROFILE.throughLine.zh}
            这也解释了为什么项目会反复出现 diff 预览、可恢复写入、协议兼容、离线部署、来源追溯与显式质量门禁。
          </p>
        </div>

        <div className={styles.operatorCard} aria-label="Operator profile summary">
          <div className={styles.operatorRow}><span>Operator ID</span><strong>{SITE_CONFIG.domain}</strong></div>
          <div className={styles.operatorRow}><span>Builds</span><strong>Developer tools</strong></div>
          <div className={styles.operatorRow}><span>Focus</span><strong>AI · Self-hosted systems</strong></div>
          <div className={styles.operatorRow}><span>Loop</span><strong data-accent="true">Build → Verify → Ship</strong></div>
        </div>
      </div>

      <div className={styles.aboutGrid}>
        <div className={styles.subpanel}>
          <h3 className={styles.subpanelTitle}>Values</h3>
          <ul className={styles.detailList}>
            {VALUES.map(value => <li key={value}><Circle size={6} fill="currentColor" aria-hidden="true" />{value}</li>)}
          </ul>
        </div>

        <div className={styles.subpanel}>
          <h3 className={styles.subpanelTitle}>Interests</h3>
          <ul className={styles.detailList}>
            {INTERESTS.map(interest => <li key={interest}><Circle size={6} fill="currentColor" aria-hidden="true" />{interest}</li>)}
          </ul>
        </div>

        <div className={styles.subpanel}>
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
