// Adapted from Magic UI Ripple (MIT). See THIRD_PARTY_NOTICES.md.
// Concentric rings spread from a corner and breathe while the nearest
// `data-ripple-host` ancestor is hovered or focused. CSS only; hidden for
// touch and reduced motion.
import type { CSSProperties } from 'react';
import styles from './Ripple.module.css';

export default function Ripple({ rings = 6, className }: { rings?: number; className?: string }) {
  return (
    <span className={`${styles.ripple} ${className ?? ''}`} aria-hidden="true">
      {Array.from({ length: rings }, (_, index) => <span key={index} style={{ '--n': index } as CSSProperties} />)}
    </span>
  );
}
