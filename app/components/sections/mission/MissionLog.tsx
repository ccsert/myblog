'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { ChevronDown, CornerDownRight } from 'lucide-react';
import { scrollToHomeSection } from '@/app/lib/home-navigation';
import { PUBLIC_EVIDENCE_CHECKED_AT, SITE_CONFIG } from '@/app/lib/content/portfolio';
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
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const sections = Array.from(element.querySelectorAll<HTMLElement>('[data-mission-section]'));
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const compact = window.matchMedia('(max-width: 980px)');
    const animations = new Set<Animation>();
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
    const cancel = () => { animations.forEach(animation => animation.cancel()); animations.clear(); };
    const reveal = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        reveal.unobserve(entry.target);
        if (preference.matches || document.documentElement.dataset.homeInput === 'keyboard') return;
        const animation = entry.target.animate([{ opacity: .55, transform: 'translateY(14px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 280, easing: 'cubic-bezier(.22,.8,.2,1)' });
        animations.add(animation);
        animation.onfinish = () => animations.delete(animation);
      });
    }, { rootMargin: '0px 0px -24px 0px', threshold: .2 });
    element.querySelectorAll('[data-chapter-header]').forEach(header => reveal.observe(header));
    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', measure);
    window.addEventListener('keydown', cancel, true);
    preference.addEventListener('change', cancel);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      reveal.disconnect();
      cancel();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', measure);
      window.removeEventListener('keydown', cancel, true);
      preference.removeEventListener('change', cancel);
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
      <div><div className={styles.cueKicker}><ChevronDown size={13} aria-hidden="true" /> KEEP EXPLORING</div><p className={styles.cueDescription}>往下看看，想法怎样变成作品。</p></div>
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
    <footer className={styles.missionFooter}>
      <span><CornerDownRight size={12} aria-hidden="true" />保持好奇，继续动手。</span>
      <nav className={styles.footerLinks} aria-label="站点链接">
        <a href="https://github.com/ccsert" target="_blank" rel="noopener noreferrer">GitHub</a>
        <a href="https://github.com/ccsert/myblog" target="_blank" rel="noopener noreferrer">本站源码</a>
        <a href={`mailto:${SITE_CONFIG.email}`}>邮件</a>
        <span>内容核验于 {PUBLIC_EVIDENCE_CHECKED_AT}</span>
      </nav>
      <a href="#home">回到开头 ↑</a>
    </footer>
  </div>;
}
