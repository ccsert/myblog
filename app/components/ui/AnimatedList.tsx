'use client';

// Adapted from Magic UI Animated List (MIT). See THIRD_PARTY_NOTICES.md.
// When the list first scrolls into view, items drop in one after another
// with a springy pop, newest-feeling first. Items stay in server HTML; only
// lists that start below the fold are hidden before they play, and keyboard
// users or reduced-motion visitors see them immediately.
import { useEffect, useRef, type ReactNode } from 'react';
import styles from './AnimatedList.module.css';

interface AnimatedListProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  'aria-label'?: string;
}

export default function AnimatedList({ children, className, delay = 140, ...rest }: AnimatedListProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const skip = window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.homeInput === 'keyboard';
    if (skip || element.getBoundingClientRect().top < window.innerHeight) return;
    Array.from(element.children).forEach((child, index) => (child as HTMLElement).style.setProperty('--item-delay', `${index * delay}ms`));
    element.dataset.state = 'armed';
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      element.dataset.state = 'play';
      observer.disconnect();
    }, { threshold: 0.35 });
    observer.observe(element);
    return () => observer.disconnect();
  }, [delay]);

  return <div ref={ref} className={`${styles.list} ${className ?? ''}`} {...rest}>{children}</div>;
}
