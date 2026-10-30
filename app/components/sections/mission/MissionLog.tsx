'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { ArrowUp, ChevronDown, CornerDownRight } from 'lucide-react';
import { scrollToHomeSection } from '@/app/lib/home-navigation';
import DotGrid from '@/app/components/ui/DotGrid';
import CircularText from '@/app/components/ui/CircularText';
import Magnet from '@/app/components/ui/Magnet';
import { PORTFOLIO_PROFILE, SITE_CONFIG } from '@/app/lib/content/portfolio';
import styles from './MissionLog.module.css';

const CHAPTERS = [
  { id: 'projects', number: '02', label: '作品' },
  { id: 'about', number: '03', label: '关于' },
  { id: 'skills', number: '04', label: '工具' },
  { id: 'blog', number: '05', label: '手记' },
  { id: 'contact', number: '06', label: '联系' },
] as const;

export default function MissionLog({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const active = useRef(0);
  const line = useRef<HTMLSpanElement>(null);
  const progressLabel = useRef<HTMLSpanElement>(null);
  const closingTop = useRef<HTMLAnchorElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const sections = Array.from(element.querySelectorAll<HTMLElement>('[data-mission-section]'));
    const compact = window.matchMedia('(max-width: 980px)');
    let offsets: number[] = [];
    let end = 0;
    let frame = 0;
    let lastActive = -1;
    const update = () => {
      frame = 0;
      const y = window.scrollY + (compact.matches ? 148 : 104);
      let index = 0;
      offsets.forEach((top, i) => { if (top <= y) index = i; });
      if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4) index = sections.length - 1;
      active.current = index;
      if (index !== lastActive) {
        lastActive = index;
        sections.forEach((section, i) => { section.dataset.current = String(i === index); });
        buttons.current.forEach((button, i) => {
          if (i === index) button?.setAttribute('aria-current', 'location');
          else button?.removeAttribute('aria-current');
        });
      }
      const fraction = Math.max(0, Math.min(1, (y - offsets[0]) / Math.max(1, end - offsets[0])));
      if (line.current) line.current.style.transform = `scaleX(${fraction})`;
      if (progressLabel.current) progressLabel.current.textContent = `${Math.round(fraction * 100)}%`;
      // The ring sits below the chapters, where page progress is already
      // near 100%, so it closes over the last stretch: from the closing scene
      // entering the viewport to the end of the page.
      const closing = closingTop.current?.closest<HTMLElement>('[data-closing]');
      if (closing && closingTop.current) {
        const start = closing.getBoundingClientRect().top + window.scrollY - window.innerHeight;
        const finish = document.documentElement.scrollHeight - window.innerHeight;
        const arrival = (window.scrollY - start) / Math.max(1, finish - start);
        closingTop.current.style.setProperty('--read', Math.max(0, Math.min(1, arrival)).toFixed(3));
      }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const measure = () => {
      offsets = sections.map(section => section.getBoundingClientRect().top + window.scrollY);
      const last = sections.at(-1);
      end = last ? last.getBoundingClientRect().bottom + window.scrollY - window.innerHeight + (compact.matches ? 148 : 104) : 0;
      schedule();
    };
    const resize = new ResizeObserver(measure);
    sections.forEach(section => resize.observe(section));
    const hero = document.getElementById('home');
    if (hero) resize.observe(hero);
    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', measure);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', measure);
    };
  }, []);

  return <div ref={root} className={`${styles.root} blueprint-grid`} role="region" aria-label="继续探索" onKeyDown={event => {
    const target = event.target as Element;
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || target.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')) return;
    if (!['j', 'k'].includes(event.key)) return;
    const next = Math.max(0, Math.min(CHAPTERS.length - 1, active.current + (event.key === 'j' ? 1 : -1)));
    if (next === active.current) return;
    event.preventDefault();
    active.current = next;
    scrollToHomeSection(CHAPTERS[next].id, true);
  }}>
    <div className={styles.topCue}>
      <div><div className={styles.cueKicker}><ChevronDown size={13} aria-hidden="true" /> KEEP EXPLORING</div><p className={styles.cueDescription}>往下是作品、做事方式、常用工具和手记。</p></div>
      <div className={styles.keyboardHint} aria-label="使用 J 和 K 键切换章节"><kbd>J</kbd><kbd>K</kbd><span>切换章节</span></div>
    </div>
    <div className={styles.readingLayout}>
      <aside className={styles.chapterSidebar}>
        <nav className={styles.chapterNav} aria-label="首页章节">
          <span className={styles.navLabel}>本页目录</span>
          <div className={styles.chapterLinks}>{CHAPTERS.map((chapter, index) => <button ref={node => { buttons.current[index] = node; }} key={chapter.id} type="button" aria-controls={chapter.id} aria-current={index === 0 ? 'location' : undefined} onClick={event => scrollToHomeSection(chapter.id, event.detail === 0)}><span>{chapter.number}</span>{chapter.label}</button>)}</div>
          <div className={styles.readingProgress} aria-hidden="true"><span>阅读进度<span ref={progressLabel}>0%</span></span><span className={styles.chapterProgress}><span ref={line} /></span></div>
        </nav>
      </aside>
      <div className={styles.journey}>{children}</div>
    </div>
    <div className={styles.closing} data-closing>
      <DotGrid />
      <div className={styles.closingCopy}>
        <span className={styles.closingLabel}>~/{SITE_CONFIG.domain}</span>
        <p className={styles.closingLine}>把复杂的工程工作，<br />做成<span className={styles.aurora}>真正能用的工具</span>。</p>
        <span className={styles.closingSub}>{PORTFOLIO_PROFILE.headline}</span>
      </div>
      <Magnet padding={64} strength={5}><a ref={closingTop} className={styles.closingTop} href="#home" aria-label="回到开头"><CircularText size={128} text="BACK TO TOP · BACK TO TOP · "><span className={styles.closingMeter} aria-hidden="true" /><ArrowUp size={20} aria-hidden="true" /></CircularText></a></Magnet>
    </div>
    <footer className={styles.missionFooter}><span><CornerDownRight size={12} aria-hidden="true" />把复杂留给系统，把好奇心留给自己。</span><span>Developer tools · AI engineering · Self-hosted systems</span><span>{SITE_CONFIG.domain}</span></footer>
  </div>;
}
