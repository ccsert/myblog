import { ReactNode } from 'react';
import { Circle } from 'lucide-react';
import styles from './MissionLog.module.css';

interface MissionSectionProps {
  id: string;
  number: string;
  railTitle: string;
  railSubtitle: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  headerAside?: ReactNode;
  children: ReactNode;
}

export default function MissionSection({
  id,
  number,
  railTitle,
  railSubtitle,
  eyebrow,
  title,
  subtitle,
  headerAside,
  children,
}: MissionSectionProps) {
  const headingId = `${id}-mission-heading`;

  return (
    <section id={id} className={styles.section} aria-labelledby={headingId} data-mission-section tabIndex={-1}>
      <aside className={styles.chapterRail} aria-hidden="true">
        <Circle className={styles.chapterMarker} size={18} />
        <span className={styles.chapterNumber}>{number}</span>
        <strong>{railTitle}</strong>
        <span>{railSubtitle}</span>
      </aside>

      <div className={styles.panel}>
        <span className={styles.panelNumber} aria-hidden="true">{number}</span>
        <header className={styles.sectionHeader} data-reveal>
          <div>
            <div className={styles.eyebrow}>{eyebrow}</div>
            <h2 id={headingId} className={styles.sectionTitle}>
              {title}<Circle size={7} fill="currentColor" aria-hidden="true" />
            </h2>
            <p className={styles.sectionSubtitle}>{subtitle}</p>
          </div>
          {headerAside ? <div className={styles.headerAside}>{headerAside}</div> : null}
        </header>
        {children}
      </div>
    </section>
  );
}
