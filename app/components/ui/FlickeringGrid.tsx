'use client';

// Adapted from Magic UI Flickering Grid (MIT). See THIRD_PARTY_NOTICES.md.
// Squares take the live theme accent, the loop throttles to ~16fps and stops
// whenever the grid is off screen, the tab is hidden or motion is reduced.
import { useEffect, useRef } from 'react';
import styles from './FlickeringGrid.module.css';

interface FlickeringGridProps {
  className?: string;
  squareSize?: number;
  gap?: number;
  flickerChance?: number;
  maxOpacity?: number;
}

export default function FlickeringGrid({ className, squareSize = 3, gap = 7, flickerChance = 0.18, maxOpacity = 0.32 }: FlickeringGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let color = '0, 255, 136';
    let columns = 0;
    let rows = 0;
    let dpr = 1;
    let cells = new Float32Array(0);
    let frame = 0;
    let last = 0;
    let visible = false;

    const readColor = () => {
      const probe = getComputedStyle(canvas).color.match(/[\d.]+/g);
      if (probe) color = probe.slice(0, 3).join(', ');
    };
    const draw = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      const size = squareSize * dpr;
      const step = (squareSize + gap) * dpr;
      for (let x = 0; x < columns; x++) {
        for (let y = 0; y < rows; y++) {
          context.fillStyle = `rgba(${color}, ${cells[x * rows + y]})`;
          context.fillRect(x * step, y * step, size, size);
        }
      }
    };
    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      columns = Math.ceil(width / (squareSize + gap));
      rows = Math.ceil(height / (squareSize + gap));
      cells = new Float32Array(columns * rows).map(() => Math.random() * maxOpacity);
      draw();
    };
    const tick = (time: number) => {
      frame = requestAnimationFrame(tick);
      if (time - last < 60) return;
      const elapsed = Math.min(time - last, 250) / 1000;
      last = time;
      for (let i = 0; i < cells.length; i++) {
        if (Math.random() < flickerChance * elapsed) cells[i] = Math.random() * maxOpacity;
      }
      draw();
    };
    const sync = () => {
      const running = visible && !document.hidden && !motion.matches;
      if (running && !frame) { last = performance.now(); frame = requestAnimationFrame(tick); }
      if (!running && frame) { cancelAnimationFrame(frame); frame = 0; }
    };

    readColor();
    const sizeObserver = new ResizeObserver(resize);
    sizeObserver.observe(canvas);
    const viewObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    viewObserver.observe(canvas);
    // Theme switches rewrite the accent token on <html>.
    const themeObserver = new MutationObserver(() => { readColor(); draw(); });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    document.addEventListener('visibilitychange', sync);
    motion.addEventListener('change', sync);
    return () => {
      cancelAnimationFrame(frame);
      sizeObserver.disconnect();
      viewObserver.disconnect();
      themeObserver.disconnect();
      document.removeEventListener('visibilitychange', sync);
      motion.removeEventListener('change', sync);
    };
  }, [squareSize, gap, flickerChance, maxOpacity]);

  return <canvas ref={canvasRef} className={`${styles.grid} ${className ?? ''}`} aria-hidden="true" />;
}
