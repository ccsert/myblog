import { Circle } from 'lucide-react';
import MissionSection from '@/app/components/sections/mission/MissionSection';
import styles from '@/app/components/sections/mission/MissionLog.module.css';

const VALUES = [
  '技术应该服务于人，而不是相反',
  '简单优于复杂，清晰优于聪明',
  '持续学习，保持好奇',
  '代码是写给人看的，顺便能运行',
];

const INTERESTS = [
  'AI Agent 与多智能体系统',
  'DevOps 与云原生技术',
  '系统设计与架构',
  '开发者工具与体验',
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
      subtitle="Who am I?"
    >
      <div className={styles.aboutIntro}>
        <div className={styles.aboutCopy}>
          <p>
            我是一名全栈开发工程师，专注于构建可靠、可扩展的系统。我的工作跨越前端、后端和 DevOps，
            致力于将复杂的技术问题转化为清晰、可演进的解决方案。
          </p>
          <p>
            目前，我在探索 AI Agent 平台的设计与实现，思考如何让机器更好地理解人类意图，
            以及如何让复杂系统保持可观察、可验证和可交付。
          </p>
        </div>

        <div className={styles.operatorCard} aria-label="Operator profile summary">
          <div className={styles.operatorRow}><span>Operator ID</span><strong>ccsert.dev</strong></div>
          <div className={styles.operatorRow}><span>Role</span><strong>Full Stack Developer</strong></div>
          <div className={styles.operatorRow}><span>Focus</span><strong>DevOps · AI Agents</strong></div>
          <div className={styles.operatorRow}><span>Status</span><strong data-accent="true">Active</strong></div>
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
            <div className={styles.codeLine}><span>focus:</span><strong>&apos;deep work&apos;</strong>,</div>
            <div className={styles.codeLine}><span>communication:</span><strong>&apos;async-first&apos;</strong>,</div>
            <div className={styles.codeLine}><span>documentation:</span><strong>&apos;write it down&apos;</strong>,</div>
            <div className={styles.codeLine}><span>iteration:</span><strong>&apos;ship early&apos;</strong>,</div>
            <div>{'}'}</div>
          </div>
        </div>
      </div>
    </MissionSection>
  );
}
