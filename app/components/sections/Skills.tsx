import { Circle } from 'lucide-react';
import MissionSection from '@/app/components/sections/mission/MissionSection';
import styles from '@/app/components/sections/mission/MissionLog.module.css';

type SkillState = 'healthy' | 'stable' | 'learning';

const SKILL_GROUPS: Array<{
  category: string;
  items: Array<{ name: string; state: SkillState }>;
}> = [
  {
    category: 'Frontend',
    items: [
      { name: 'React', state: 'healthy' },
      { name: 'TypeScript', state: 'healthy' },
      { name: 'Next.js', state: 'healthy' },
      { name: 'Tailwind CSS', state: 'stable' },
    ],
  },
  {
    category: 'Backend',
    items: [
      { name: 'Node.js', state: 'healthy' },
      { name: 'Go', state: 'stable' },
      { name: 'PostgreSQL', state: 'healthy' },
      { name: 'Redis', state: 'stable' },
    ],
  },
  {
    category: 'DevOps',
    items: [
      { name: 'Docker', state: 'healthy' },
      { name: 'Kubernetes', state: 'healthy' },
      { name: 'CI/CD', state: 'healthy' },
      { name: 'Terraform', state: 'stable' },
    ],
  },
  {
    category: 'AI/ML',
    items: [
      { name: 'LLM', state: 'stable' },
      { name: 'Agent', state: 'healthy' },
      { name: 'Prompt Engineering', state: 'stable' },
      { name: 'RAG', state: 'learning' },
    ],
  },
];

export default function Skills() {
  return (
    <MissionSection
      id="skills"
      number="04"
      railTitle="Skills"
      railSubtitle="Capability matrix"
      eyebrow="// Capability matrix"
      title="Skills"
      subtitle="Technical stack and operating confidence"
      headerAside={(
        <div className={styles.legend} aria-label="能力状态图例">
          <span><Circle size={7} fill="currentColor" data-state="healthy" aria-hidden="true" />Healthy</span>
          <span><Circle size={7} fill="currentColor" data-state="stable" aria-hidden="true" />Stable</span>
          <span><Circle size={7} fill="currentColor" data-state="learning" aria-hidden="true" />Learning</span>
        </div>
      )}
    >
      <div className={styles.skillGrid}>
        {SKILL_GROUPS.map(group => (
          <article className={styles.skillGroup} key={group.category}>
            <h3>{group.category}</h3>
            <ul>
              {group.items.map(skill => (
                <li key={skill.name}>
                  <span>{skill.name}</span>
                  <span className={styles.skillState} title={skill.state}>
                    <Circle size={7} fill="currentColor" data-state={skill.state} aria-hidden="true" />
                    <span className="sr-only">{skill.state}</span>
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
