// Adapted from React Bits Pixel Transition. See THIRD_PARTY_NOTICES.md.
// A grid of pixels covers the content and snaps away in a scattered order
// when `active` turns on, and snaps back when it turns off. The order is
// deterministic so server and client markup match; CSS only.
import type { CSSProperties } from 'react';
import styles from './PixelTransition.module.css';

export default function PixelTransition({ active, columns = 12, rows = 8, duration = 520 }: { active: boolean; columns?: number; rows?: number; duration?: number }) {
  const count = columns * rows;
  return (
    <span
      className={styles.pixels}
      data-active={active}
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)`, '--duration': `${duration}ms` } as CSSProperties}
      aria-hidden="true"
    >
      {Array.from({ length: count }, (_, index) => (
        // Multiplying by a prime coprime to `count` visits every slot once in a scattered order.
        <span key={index} style={{ '--order': ((index * 37) % count) / count } as CSSProperties} />
      ))}
    </span>
  );
}
