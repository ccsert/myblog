import { Circle } from 'lucide-react';
import MissionSection from '@/app/components/sections/mission/MissionSection';
import { CAPABILITY_GROUPS } from '@/app/lib/content/portfolio';
import styles from '@/app/components/sections/mission/MissionLog.module.css';

export default function Skills() {
  return (
    <MissionSection
      id="skills"
      number="04"
      railTitle="Skills"
      railSubtitle="Evidence map"
      eyebrow="// Capability evidence"
      title="Toolbox"
      subtitle="按公开构建、核心工具与研究方向组织，而不是给自己打分"
      headerAside={(
        <div className={styles.legend} aria-label="能力状态图例">
          <span><Circle size={7} fill="currentColor" data-state="public" aria-hidden="true" />Public build</span>
          <span><Circle size={7} fill="currentColor" data-state="toolbox" aria-hidden="true" />Core toolbox</span>
          <span><Circle size={7} fill="currentColor" data-state="research" aria-hidden="true" />Active research</span>
        </div>
      )}
    >
      <div className={styles.skillGrid}>
        {CAPABILITY_GROUPS.map(group => (
          <article className={styles.skillGroup} key={group.category}>
            <h3>{group.category}</h3>
            <ul>
              {group.items.map(item => (
                <li key={item}>
                  <span>{item}</span>
                  <span className={styles.skillState} title={group.state}>
                    <Circle size={7} fill="currentColor" data-state={group.state} aria-hidden="true" />
                    <span className="sr-only">{group.state}</span>
                  </span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </MissionSection>
  );
}
