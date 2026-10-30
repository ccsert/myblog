'use client';

// Adapted from React Bits Dot Grid. See THIRD_PARTY_NOTICES.md.
// Dots near a fine pointer swell, take the theme accent and get pushed
// away, then spring back. The loop only runs while something is moving;
// touch, keyboard-only and reduced-motion visitors see the still grid.
import { useEffect, useRef } from 'react';
import styles from './DotGrid.module.css';

interface DotGridProps {
  className?: string;
  gap?: number;
  radius?: number;
  reach?: number;
}

export default function DotGrid({ className, gap = 26, radius = 1.4, reach = 150 }: DotGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const interactive = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    let base = '128, 128, 128';
    let accent = '0, 255, 136';
    let dpr = 1;
    let width = 0;
    let height = 0;
    // Per dot: home x, home y, offset x, offset y, velocity x, velocity y.
    let dots = new Float32Array(0);
    let pointerX = -9999;
    let pointerY = -9999;
    let frame = 0;

    const readColors = () => {
      const style = getComputedStyle(canvas);
      base = style.color.match(/[\d.]+/g)?.slice(0, 3).join(', ') ?? base;
      accent = style.borderTopColor.match(/[\d.]+/g)?.slice(0, 3).join(', ') ?? accent;
    };
    const draw = () => {
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);
      for (let i = 0; i < dots.length; i += 6) {
        const x = dots[i] + dots[i + 2];
        const y = dots[i + 1] + dots[i + 3];
        const distance = Math.hypot(x - pointerX, y - pointerY);
        const heat = Math.max(0, 1 - distance / reach);
        context.beginPath();
        context.fillStyle = heat > 0 ? `rgba(${accent}, ${0.25 + heat * 0.75})` : `rgba(${base}, 0.32)`;
        context.arc(x, y, radius + heat * 2.2, 0, Math.PI * 2);
        context.fill();
      }
    };
    const step = () => {
      frame = 0;
      let moving = false;
      for (let i = 0; i < dots.length; i += 6) {
        const dx = dots[i] - pointerX;
        const dy = dots[i + 1] - pointerY;
        const distance = Math.hypot(dx, dy) || 1;
        const push = Math.max(0, 1 - distance / reach) * 14;
        const targetX = (dx / distance) * push;
        const targetY = (dy / distance) * push;
        // Spring toward the pushed target with damping.
        dots[i + 4] = (dots[i + 4] + (targetX - dots[i + 2]) * 0.16) * 0.72;
        dots[i + 5] = (dots[i + 5] + (targetY - dots[i + 3]) * 0.16) * 0.72;
        dots[i + 2] += dots[i + 4];
        dots[i + 3] += dots[i + 5];
        if (Math.abs(dots[i + 4]) + Math.abs(dots[i + 5]) > 0.02 || Math.abs(dots[i + 2] - targetX) > 0.05) moving = true;
      }
      draw();
      if (moving) frame = requestAnimationFrame(step);
    };
    const wake = () => { if (!frame) frame = requestAnimationFrame(step); };
    const resize = () => {
      const box = canvas.getBoundingClientRect();
      width = box.width;
      height = box.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      const columns = Math.floor(width / gap);
      const rows = Math.floor(height / gap);
      const offsetX = (width - (columns - 1) * gap) / 2;
      const offsetY = (height - (rows - 1) * gap) / 2;
      dots = new Float32Array(columns * rows * 6);
      let i = 0;
      for (let column = 0; column < columns; column++) {
        for (let row = 0; row < rows; row++, i += 6) {
          dots[i] = offsetX + column * gap;
          dots[i + 1] = offsetY + row * gap;
        }
      }
      draw();
    };
    const onMove = (event: PointerEvent) => {
      if (!interactive.matches || event.pointerType !== 'mouse') return;
      const box = canvas.getBoundingClientRect();
      pointerX = event.clientX - box.left;
      pointerY = event.clientY - box.top;
      wake();
    };
    const onLeave = () => { pointerX = -9999; pointerY = -9999; wake(); };

    readColors();
    const sizeObserver = new ResizeObserver(resize);
    sizeObserver.observe(canvas);
    const themeObserver = new MutationObserver(() => { readColors(); draw(); });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    const host = canvas.parentElement ?? canvas;
    host.addEventListener('pointermove', onMove);
    host.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(frame);
      sizeObserver.disconnect();
      themeObserver.disconnect();
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerleave', onLeave);
    };
  }, [gap, radius, reach]);

  return <canvas ref={canvasRef} className={`${styles.grid} ${className ?? ''}`} aria-hidden="true" />;
}
