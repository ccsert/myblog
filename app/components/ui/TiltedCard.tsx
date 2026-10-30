'use client';

// Adapted from React Bits Tilted Card. See THIRD_PARTY_NOTICES.md.
// The card leans toward a fine pointer in 3D with a moving glare, then
// springs flat on leave. Pointer position is written to CSS variables,
// so React never re-renders; touch and reduced-motion visitors get a flat card.
import { useEffect, useRef, type ReactNode } from 'react';
import styles from './TiltedCard.module.css';

interface TiltedCardProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
}

export default function TiltedCard({ children, className, maxTilt = 10, ...rest }: TiltedCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const enabled = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    let frame = 0;
    const onMove = (event: PointerEvent) => {
      if (!enabled.matches || event.pointerType !== 'mouse') return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = element.getBoundingClientRect();
        const x = (event.clientX - box.left) / box.width;
        const y = (event.clientY - box.top) / box.height;
        element.dataset.tilting = 'true';
        element.style.setProperty('--rx', `${((0.5 - y) * maxTilt * 2).toFixed(2)}deg`);
        element.style.setProperty('--ry', `${((x - 0.5) * maxTilt * 2).toFixed(2)}deg`);
        element.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`);
        element.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`);
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(frame);
      delete element.dataset.tilting;
      element.style.removeProperty('--rx');
      element.style.removeProperty('--ry');
    };
    element.addEventListener('pointermove', onMove);
    element.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(frame);
      element.removeEventListener('pointermove', onMove);
      element.removeEventListener('pointerleave', onLeave);
    };
  }, [maxTilt]);

  return (
    <div ref={ref} className={`${styles.card} ${className ?? ''}`} {...rest}>
      {children}
      <span className={styles.glare} aria-hidden="true" />
    </div>
  );
}
