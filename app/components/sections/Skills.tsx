import { Circle } from 'lucide-react';
import MissionSection from '@/app/components/sections/mission/MissionSection';
import { CAPABILITY_GROUPS, ENGINEERING_PRACTICES } from '@/app/lib/content/portfolio';
import Marquee from '@/app/components/ui/Marquee';
import TrueFocus from '@/app/components/ui/TrueFocus';
import styles from '@/app/components/sections/mission/MissionLog.module.css';

export default function Skills() {
  return (
    <MissionSection
      id="skills"
      number="04"
      railTitle="Skills"
      railSubtitle="Evidence map"
      eyebrow="// Toolbox"
      title="常用工具"
      subtitle="按用在哪里来分组，不给自己打分。"
      headerAside={(
        <TrueFocus className={styles.legend} aria-label="能力状态图例">
          <span data-focus-item="public"><Circle size={7} fill="currentColor" data-state="public" aria-hidden="true" />公开作品里用过</span>
          <span data-focus-item="toolbox"><Circle size={7} fill="currentColor" data-state="toolbox" aria-hidden="true" />日常在用</span>
          <span data-focus-item="research"><Circle size={7} fill="currentColor" data-state="research" aria-hidden="true" />正在研究</span>
        </TrueFocus>
      )}
    >
      <div className={styles.stackTicker} data-reveal>
        {ENGINEERING_PRACTICES.map((row, index) => (
          <Marquee key={index} reverse={index === 1} duration={index ? 46 : 38}>
            {/* Rows repeat so even the shorter one spans wide screens. */}
            {[...row, ...row].map((item, position) => (
              <span className={styles.stackChip} data-kind={index ? 'delivery' : 'system'} key={position}><span aria-hidden="true">#</span>{item}</span>
            ))}
          </Marquee>
        ))}
      </div>
      <div className={styles.skillGrid} data-reveal-group>
        {CAPABILITY_GROUPS.map(group => (
          <article className={styles.skillGroup} key={group.category} data-state={group.state} data-spotlight="card">
            <h3><span>{group.category}</span><small aria-hidden="true">{String(group.items.length).padStart(2, '0')}</small></h3>
            <p className="sr-only">State: {group.state}</p>
            <ul data-reveal-group>
              {group.items.map(item => (
                <li key={item}>
                  <Circle size={6} fill="currentColor" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </MissionSection>
  );
}
