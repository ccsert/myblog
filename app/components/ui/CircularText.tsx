// Adapted from React Bits Circular Text. See THIRD_PARTY_NOTICES.md.
// Glyphs sit on a ring that spins slowly and speeds up on hover/focus,
// purely in CSS. The ring is decorative; the parent supplies the label.
import type { CSSProperties, ReactNode } from 'react';
import styles from './CircularText.module.css';

export default function CircularText({ text, children, size = 112 }: { text: string; children?: ReactNode; size?: number }) {
  const glyphs = Array.from(text);
  return (
    <span className={styles.root} style={{ '--size': `${size}px` } as CSSProperties}>
      <span className={styles.ring} aria-hidden="true" data-motion>
        {glyphs.map((glyph, index) => (
          <span key={index} className={styles.glyph} style={{ '--turn': `${(index / glyphs.length) * 360}deg` } as CSSProperties}>{glyph}</span>
        ))}
      </span>
      <span className={styles.center}>{children}</span>
    </span>
  );
}
