'use client';

// Adapted from React Bits Blur Text. See THIRD_PARTY_NOTICES.md.
// Characters stay visible in the server HTML. On mount, a title that is still
// below the fold is hidden and then blurs in, one character at a time, when it
// enters the viewport. Titles already on screen are left alone.
import { useEffect, useRef } from 'react';
import styles from './BlurText.module.css';

export default function BlurText({ text, stagger = 45 }: { text: string; stagger?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (element.getBoundingClientRect().top < window.innerHeight) return;
    element.dataset.state = 'waiting';
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      element.dataset.state = 'in';
      observer.disconnect();
    }, { rootMargin: '0px 0px -12% 0px' });
    observer.observe(element);
    return () => {
      observer.disconnect();
      delete element.dataset.state;
    };
  }, []);

  return <span ref={ref} className={styles.text}>
    {Array.from(text).map((char, index) => <span key={index} className={styles.char} style={{ animationDelay: `${index * stagger}ms` }}>{char}</span>)}
  </span>;
}
