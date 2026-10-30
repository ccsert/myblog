'use client';

// Adapted from React Bits True Focus. See THIRD_PARTY_NOTICES.md.
// Direct children marked `data-focus-item` take turns being in focus while
// the rest soften, and a bracket frame glides to the focused one. The tour
// plays once when the legend first comes into view, then rests with every
// item sharp. Hovering an item focuses it and mirrors its key onto the
// enclosing section as `data-focus`, so sibling content can react in CSS.
// Reduced motion shows every item sharp and skips the frame.
import { useEffect, useRef, type ReactNode } from 'react';
import styles from './TrueFocus.module.css';

interface TrueFocusProps {
  children: ReactNode;
  className?: string;
  interval?: number;
  'aria-label'?: string;
}

export default function TrueFocus({ children, className, interval = 1800, ...rest }: TrueFocusProps) {
  const ref = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = ref.current;
    const frame = frameRef.current;
    if (!root || !frame) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const items = Array.from(root.querySelectorAll<HTMLElement>(':scope > [data-focus-item]'));
    const section = root.closest('section');
    let index = 0;
    let timer = 0;
    let visible = false;
    let hovering = false;
    // Steps left in the one-time tour; it ends back on the first item.
    let tour = items.length;

    const focus = (next: number) => {
      index = next;
      items.forEach((item, i) => { if (i === next) item.dataset.focused = 'true'; else delete item.dataset.focused; });
      const host = root.getBoundingClientRect();
      const box = items[next].getBoundingClientRect();
      frame.style.translate = `${box.left - host.left}px ${box.top - host.top}px`;
      frame.style.width = `${box.width}px`;
      frame.style.height = `${box.height}px`;
    };
    const rest = () => { root.dataset.running = 'false'; items.forEach(item => { delete item.dataset.focused; }); };
    const sync = () => {
      const running = tour > 0 && visible && !hovering && !document.hidden && !motion.matches;
      if (running && !timer) {
        root.dataset.running = 'true';
        timer = window.setInterval(() => {
          tour -= 1;
          if (tour > 0) focus((index + 1) % items.length);
          else { rest(); sync(); }
        }, interval);
      }
      if (!running && timer) { clearInterval(timer); timer = 0; }
    };
    const onEnter = (event: PointerEvent) => {
      const item = (event.target as Element).closest<HTMLElement>('[data-focus-item]');
      if (!item || motion.matches) return;
      hovering = true;
      root.dataset.running = 'true';
      focus(items.indexOf(item));
      section?.setAttribute('data-focus', item.dataset.focusItem ?? '');
      sync();
    };
    const onLeave = () => {
      hovering = false;
      section?.removeAttribute('data-focus');
      if (tour > 0) focus(index); else rest();
      sync();
    };

    focus(0);
    root.dataset.running = String(!motion.matches);
    const viewObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    viewObserver.observe(root);
    const sizeObserver = new ResizeObserver(() => focus(index));
    sizeObserver.observe(root);
    items.forEach(item => item.addEventListener('pointerenter', onEnter));
    root.addEventListener('pointerleave', onLeave);
    document.addEventListener('visibilitychange', sync);
    motion.addEventListener('change', sync);
    return () => {
      clearInterval(timer);
      viewObserver.disconnect();
      sizeObserver.disconnect();
      items.forEach(item => item.removeEventListener('pointerenter', onEnter));
      root.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', sync);
      motion.removeEventListener('change', sync);
      section?.removeAttribute('data-focus');
    };
  }, [interval]);

  return (
    <div ref={ref} className={`${styles.root} ${className ?? ''}`} {...rest}>
      {children}
      <span ref={frameRef} className={styles.frame} aria-hidden="true"><i /><i /><i /><i /></span>
    </div>
  );
}
