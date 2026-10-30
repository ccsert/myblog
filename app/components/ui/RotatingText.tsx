'use client';

// Adapted from React Bits Rotating Text. See THIRD_PARTY_NOTICES.md.
// Cycles through `words` while on screen; each word rises in character by
// character. Screen readers get the whole list once instead of the rotation.
import { useEffect, useRef, useState } from 'react';
import styles from './RotatingText.module.css';

export default function RotatingText({ words, interval = 2600 }: { words: string[]; interval?: number }) {
  const [index, setIndex] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    const stop = () => { clearInterval(timer); timer = undefined; };
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !timer) timer = setInterval(() => { if (!document.hidden) setIndex(value => (value + 1) % words.length); }, interval);
      else if (!entry.isIntersecting) stop();
    });
    observer.observe(element);
    return () => { stop(); observer.disconnect(); };
  }, [words.length, interval]);

  return (
    <span ref={ref} className={styles.root}>
      <span className={styles.srOnly}>{words.join(' · ')}</span>
      <span className={styles.word} key={index} aria-hidden="true">
        {Array.from(words[index]).map((char, i) => <span key={i} className={styles.char} style={{ animationDelay: `${i * 22}ms` }}>{char}</span>)}
      </span>
    </span>
  );
}
