'use client';

// Adapted from Magic UI Hyper Text (MIT). See THIRD_PARTY_NOTICES.md.
// When the enclosing link is hovered or focused, the label scrambles and
// resolves left to right. Text stays in the DOM for assistive technology;
// reduced motion skips the effect.
import { useEffect, useRef } from 'react';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/<>_';

export default function HyperText({ text, duration = 420 }: { text: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = ref.current;
    const host = element?.closest('a, button');
    if (!element || !host) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    const play = () => {
      if (motion.matches || frame) return;
      const start = performance.now();
      const tick = (time: number) => {
        const progress = Math.min(1, (time - start) / duration);
        const settled = Math.floor(progress * text.length);
        element.textContent = Array.from(text, (char, index) => (index < settled || char === ' ' ? char : GLYPHS[Math.floor(Math.random() * GLYPHS.length)])).join('');
        frame = progress < 1 ? requestAnimationFrame(tick) : 0;
        if (!frame) element.textContent = text;
      };
      frame = requestAnimationFrame(tick);
    };
    host.addEventListener('pointerenter', play);
    host.addEventListener('focus', play);
    return () => {
      cancelAnimationFrame(frame);
      element.textContent = text;
      host.removeEventListener('pointerenter', play);
      host.removeEventListener('focus', play);
    };
  }, [text, duration]);

  return <span ref={ref}>{text}</span>;
}
