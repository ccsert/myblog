'use client';

import { ReactNode, useEffect, useState } from 'react';
import { ChevronDown, Circle, CornerDownRight } from 'lucide-react';
import styles from './MissionLog.module.css';

const CHAPTERS = [
  { id: 'projects', number: '02', label: 'Projects' },
  { id: 'about', number: '03', label: 'About' },
  { id: 'skills', number: '04', label: 'Skills' },
  { id: 'blog', number: '05', label: 'Notes' },
  { id: 'contact', number: '06', label: 'Contact' },
] as const;

interface MissionLogProps {
  children: ReactNode;
}

export default function MissionLog({ children }: MissionLogProps) {
  const [activeChapter, setActiveChapter] = useState('projects');

  const scrollToChapter = (chapterId: string) => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById(chapterId)?.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  useEffect(() => {
    const sections = CHAPTERS
      .map(chapter => document.getElementById(chapter.id))
      .filter((section): section is HTMLElement => Boolean(section));

    const observer = new IntersectionObserver(
      entries => {
        const visibleEntry = entries
          .filter(entry => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];
        if (visibleEntry) setActiveChapter(visibleEntry.target.id);
      },
      { rootMargin: '-24% 0px -56% 0px', threshold: [0, 0.15, 0.4, 0.7] },
    );

    sections.forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleChapterKeys = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches('input, textarea, select, [contenteditable="true"]')) return;
      if (!['j', 'k'].includes(event.key.toLowerCase())) return;

      const currentIndex = CHAPTERS.findIndex(chapter => chapter.id === activeChapter);
      const direction = event.key.toLowerCase() === 'j' ? 1 : -1;
      const nextIndex = Math.min(CHAPTERS.length - 1, Math.max(0, currentIndex + direction));
      if (nextIndex === currentIndex) return;

      event.preventDefault();
      scrollToChapter(CHAPTERS[nextIndex].id);
    };

    window.addEventListener('keydown', handleChapterKeys);
    return () => window.removeEventListener('keydown', handleChapterKeys);
  }, [activeChapter]);

  return (
    <div className={`${styles.root} blueprint-grid`} role="region" aria-label="Mission log">
      <div className={styles.topCue}>
        <div>
          <div className={styles.cueKicker}>
            <ChevronDown size={13} aria-hidden="true" />
            Continuing mission log
          </div>
          <p className={styles.cueDescription}>Scroll down to explore the full system.</p>
        </div>
        <div className={styles.keyboardHint} aria-label="使用 J 和 K 键切换章节">
          <kbd>J</kbd>
          <kbd>K</kbd>
          <span>Navigate sections</span>
        </div>
      </div>

      <nav className={styles.mobileNav} aria-label="Mission log chapters">
        {CHAPTERS.map(chapter => (
          <button
            key={chapter.id}
            type="button"
            data-active={activeChapter === chapter.id}
            onClick={() => scrollToChapter(chapter.id)}
          >
            <span>{chapter.number}</span>
            {chapter.label}
          </button>
        ))}
      </nav>

      <div className={styles.journey}>{children}</div>

      <footer className={styles.missionFooter}>
        <span><CornerDownRight size={12} aria-hidden="true" />Mission log complete</span>
        <span>Built with TypeScript, Next.js, and a lot of care.</span>
        <span className={styles.footerSignals} aria-label="End of public portfolio sections">
          <Circle size={6} fill="currentColor" aria-hidden="true" />
          <Circle size={6} fill="currentColor" aria-hidden="true" />
          <Circle size={6} fill="currentColor" aria-hidden="true" />
        </span>
      </footer>
    </div>
  );
}
