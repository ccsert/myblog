// Adapted from Magic UI Border Beam (MIT). See THIRD_PARTY_NOTICES.md.
// A CSS-only light that travels along the parent's border. The parent needs
// `position: relative` and supplies the radius through `border-radius`.
import type { CSSProperties } from 'react';
import styles from './BorderBeam.module.css';

interface BorderBeamProps {
  duration?: number;
  delay?: number;
  width?: number;
  color?: string;
}

export default function BorderBeam({ duration = 9, delay = 0, width = 1.5, color }: BorderBeamProps) {
  const style = {
    '--beam-duration': `${duration}s`,
    '--beam-delay': `${-delay}s`,
    '--beam-width': `${width}px`,
    ...(color ? { '--beam-color': color } : {}),
  } as CSSProperties;
  return <span aria-hidden="true" className={styles.beam} style={style} data-motion />;
}
