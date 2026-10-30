'use client';

// Adapted from React Bits DecryptedText: sequential reveal, fixed-width cells,
// and a separate accessible text layer. See THIRD_PARTY_NOTICES.md.
import { useEffect, useRef } from 'react';
import styles from './DecryptedText.module.css';

export default function DecryptedText({ text, replay = 0, animate = true }: { text: string; replay?: number; animate?: boolean }) {
  const root = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const cells = Array.from(element.querySelectorAll<HTMLElement>('[data-glyph]'));
    const chars = Array.from(text);
    const alphabet = '01/<>_{}:+*';
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let timer: ReturnType<typeof setInterval> | undefined;
    let played = false;
    const restore = () => {
      clearInterval(timer);
      timer = undefined;
      cells.forEach((cell, index) => {
        cell.textContent = chars[index];
        cell.removeAttribute('data-encrypted');
      });
    };
    const start = () => {
      if (played || !animate || preference.matches || document.hidden) return;
      played = true;
      let iteration = 0;
      // This one-off decorative reveal lasts at most 720ms. The original
      // characters reserve their widths, so scrambling never shifts the title.
      const steps = Math.min(chars.length + 5, 16);
      timer = setInterval(() => {
        iteration += 1;
        const revealed = Math.floor(iteration / steps * chars.length);
        cells.forEach((cell, index) => {
          const encrypted = index >= revealed && !/[\s，。！？、,.!?]/u.test(chars[index]);
          cell.textContent = encrypted ? alphabet[Math.floor(Math.random() * alphabet.length)] : chars[index];
          cell.toggleAttribute('data-encrypted', encrypted);
        });
        if (iteration >= steps) restore();
      }, 45);
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) start();
      else if (played) restore();
    }, { threshold: .5 });
    observer.observe(element);
    const onVisibility = () => { if (document.hidden) restore(); };
    preference.addEventListener('change', restore);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('keydown', restore, true);
    return () => {
      restore();
      observer.disconnect();
      preference.removeEventListener('change', restore);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('keydown', restore, true);
    };
  }, [text, replay, animate]);

  return <span ref={root} className={styles.text}>
    <span className={styles.srOnly}>{text}</span>
    <span aria-hidden="true">{Array.from(text).map((char, index) => <span key={index} className={styles.cell}>
      <span className={styles.ghost}>{char}</span><span className={styles.glyph} data-glyph>{char}</span>
    </span>)}</span>
  </span>;
}
