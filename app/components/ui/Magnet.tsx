'use client';

// Adapted from React Bits Magnet. See THIRD_PARTY_NOTICES.md.
// The child leans toward a nearby fine pointer and springs back on leave.
import { useEffect, useRef, type ReactNode } from 'react';
import styles from './Magnet.module.css';

export default function Magnet({ children, padding = 48, strength = 4 }: { children: ReactNode; padding?: number; strength?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const enabled = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    let frame = 0;
    let active = false;
    const onMove = (event: PointerEvent) => {
      if (!enabled.matches || frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const box = element.getBoundingClientRect();
        const cx = box.left + box.width / 2;
        const cy = box.top + box.height / 2;
        const near = Math.abs(event.clientX - cx) < box.width / 2 + padding && Math.abs(event.clientY - cy) < box.height / 2 + padding;
        if (near) {
          active = true;
          element.dataset.active = 'true';
          element.style.translate = `${(event.clientX - cx) / strength}px ${(event.clientY - cy) / strength}px`;
        } else if (active) {
          active = false;
          delete element.dataset.active;
          element.style.translate = '';
        }
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
    };
  }, [padding, strength]);

  return <span ref={ref} className={styles.magnet}>{children}</span>;
}
