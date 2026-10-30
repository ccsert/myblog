'use client';

// Adapted from Magic UI Animated Beam (MIT). See THIRD_PARTY_NOTICES.md.
import { useEffect, useId, useState, type RefObject } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import styles from './AnimatedBeam.module.css';

interface AnimatedBeamProps {
  containerRef: RefObject<HTMLElement | null>;
  fromRef: RefObject<HTMLElement | null>;
  toRef: RefObject<HTMLElement | null>;
  pulse: number;
  paused: boolean;
  onComplete: (pulse: number) => void;
}

export default function AnimatedBeam({ containerRef, fromRef, toRef, pulse, paused, onComplete }: AnimatedBeamProps) {
  const id = useId();
  const reduce = useReducedMotion();
  const [geometry, setGeometry] = useState({ width: 0, height: 0, path: '' });

  useEffect(() => {
    const container = containerRef.current;
    const from = fromRef.current;
    const to = toRef.current;
    if (!container || !from || !to) return;
    const update = () => {
      const box = container.getBoundingClientRect();
      const start = from.getBoundingClientRect();
      const end = to.getBoundingClientRect();
      const x1 = start.left - box.left + start.width / 2;
      const y1 = start.top - box.top + start.height / 2;
      const x2 = end.left - box.left + end.width / 2;
      const y2 = end.top - box.top - 5;
      setGeometry({ width: box.width, height: box.height, path: `M ${x1},${y1} Q ${(x1 + x2) / 2},${y2 - 24} ${x2},${y2}` });
    };
    const observer = new ResizeObserver(update);
    [container, from, to].forEach(element => observer.observe(element));
    update();
    return () => observer.disconnect();
  }, [containerRef, fromRef, toRef]);

  if (!geometry.width || !geometry.height) return null;
  const animate = pulse > 0 && !paused && !reduce;
  return (
    <svg className={styles.beam} aria-hidden="true" fill="none" viewBox={`0 0 ${geometry.width} ${geometry.height}`}>
      <path d={geometry.path} stroke="var(--color-accent)" strokeOpacity=".18" strokeWidth="1" strokeDasharray="2 5" />
      {animate && <motion.path key={pulse} d={geometry.path} stroke={`url(#${id})`} strokeWidth="2" strokeLinecap="round" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0] }} transition={{ duration: .8, times: [0, .1, .75, 1], ease: 'linear' }} onAnimationComplete={() => onComplete(pulse)} />}
      <defs>
        <motion.linearGradient key={pulse} id={id} gradientUnits="userSpaceOnUse" initial={{ x1: '-20%', x2: '0%', y1: '0%', y2: '0%' }} animate={animate ? { x1: '100%', x2: '120%' } : undefined} transition={{ duration: .8, ease: 'linear' }}>
          <stop stopColor="var(--color-accent)" stopOpacity="0" />
          <stop offset=".5" stopColor="var(--color-accent)" />
          <stop offset="1" stopColor="var(--color-accent)" stopOpacity="0" />
        </motion.linearGradient>
      </defs>
    </svg>
  );
}
