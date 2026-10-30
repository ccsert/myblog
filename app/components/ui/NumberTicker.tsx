'use client';

// Adapted from Magic UI Number Ticker (MIT). See THIRD_PARTY_NOTICES.md.
// The server renders the final value; the count-up only replays it once the
// number scrolls into view, so no-JS and reduced-motion visitors see it as is.
import { useEffect, useRef } from 'react';

export default function NumberTicker({ value, pad = 2, duration = 900 }: { value: number; pad?: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const format = (n: number) => String(n).padStart(pad, '0');

  useEffect(() => {
    const element = ref.current;
    if (!element || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        element.textContent = format(Math.round(value * (1 - Math.pow(1 - t, 3))));
        if (t < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      element.textContent = format(value);
    };
  // format only depends on pad.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, pad, duration]);

  return <span ref={ref} style={{ fontVariantNumeric: 'tabular-nums' }}>{format(value)}</span>;
}
