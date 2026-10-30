// Adapted from Magic UI Marquee (MIT). See THIRD_PARTY_NOTICES.md.
// Decorative only: the track is duplicated once so a -50% translate loops
// seamlessly, and the whole strip is hidden from assistive technology.
import type { CSSProperties, ReactNode } from 'react';
import styles from './Marquee.module.css';

interface MarqueeProps {
  children: ReactNode;
  reverse?: boolean;
  duration?: number;
  className?: string;
}

export default function Marquee({ children, reverse = false, duration = 40, className }: MarqueeProps) {
  return (
    <div aria-hidden="true" className={`${styles.marquee} ${className ?? ''}`} data-reverse={reverse} data-motion style={{ '--marquee-duration': `${duration}s` } as CSSProperties}>
      <div className={styles.track}>
        <div className={styles.group}>{children}</div>
        <div className={styles.group}>{children}</div>
      </div>
    </div>
  );
}
