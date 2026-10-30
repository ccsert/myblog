'use client';

// Adapted from React Bits Click Spark. See THIRD_PARTY_NOTICES.md.
// One fixed canvas for the whole page; it only animates while sparks are
// alive, and skips text fields and reduced-motion visitors.
import { useEffect, useRef } from 'react';

interface Spark { x: number; y: number; angle: number; start: number }

const COUNT = 8;
const DURATION = 420;
const RADIUS = 22;
const LENGTH = 9;

export default function ClickSpark() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let sparks: Spark[] = [];
    let frame = 0;
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
    };
    const draw = (now: number) => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      sparks = sparks.filter(spark => now - spark.start < DURATION);
      context.strokeStyle = getComputedStyle(canvas).color;
      context.lineWidth = 1.5 * dpr;
      context.lineCap = 'round';
      for (const spark of sparks) {
        const t = (now - spark.start) / DURATION;
        const eased = t * (2 - t);
        const distance = eased * RADIUS * dpr;
        const length = LENGTH * (1 - eased) * dpr;
        const cos = Math.cos(spark.angle);
        const sin = Math.sin(spark.angle);
        context.globalAlpha = 1 - t;
        context.beginPath();
        context.moveTo(spark.x + distance * cos, spark.y + distance * sin);
        context.lineTo(spark.x + (distance + length) * cos, spark.y + (distance + length) * sin);
        context.stroke();
      }
      frame = sparks.length ? requestAnimationFrame(draw) : 0;
    };
    const onPointerDown = (event: PointerEvent) => {
      if (motion.matches || event.button !== 0) return;
      if ((event.target as Element | null)?.closest('input, textarea, select, [contenteditable="true"]')) return;
      const now = performance.now();
      const offset = Math.random() * Math.PI;
      for (let i = 0; i < COUNT; i++) {
        sparks.push({ x: event.clientX * dpr, y: event.clientY * dpr, angle: offset + (2 * Math.PI * i) / COUNT, start: now });
      }
      if (!frame) frame = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointerdown', onPointerDown);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: 80, pointerEvents: 'none', color: 'var(--color-accent)' }} />;
}
