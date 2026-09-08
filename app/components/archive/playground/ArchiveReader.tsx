'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, CornerDownRight, X } from 'lucide-react';
import { PUBLIC_EVIDENCE_CHECKED_AT } from '@/app/lib/content/portfolio';
import { ArchiveEntry, archiveEntryFromHash, archiveEntryHref, archiveTerminalHref, findArchiveEntry } from '@/app/lib/archive/catalog';
import { ARCHIVE_STORIES } from '@/app/lib/archive/stories';
import styles from './ArchiveReader.module.css';

const CHAPTERS = [
  { id: 'overview', label: '概览' },
  { id: 'process', label: '过程' },
  { id: 'decisions', label: '取舍' },
  { id: 'explore', label: '延伸' },
] as const;
const POSITION_KEY = 'archive-reading-positions-v1';
const EASE = 'cubic-bezier(.22,.8,.2,1)';

function EntryLink({ entry, reason }: { entry: ArchiveEntry; reason?: string }) {
  return <a href={archiveEntryHref(entry)} className={styles.relatedLink}>
    <span className={styles.entryNumber}>{entry.number}</span>
    <span className={styles.entryContent}><span className={styles.entryTitle}>{entry.title}</span><strong>{entry.question}</strong>{reason && <span className={styles.connection}>{reason}</span>}</span>
    <ArrowUpRight size={20} aria-hidden="true" />
  </a>;
}

export default function ArchiveReader() {
  const [reading, setReading] = useState<{ entry: ArchiveEntry; visit: number } | null>(null);
  const selected = reading?.entry;
  const story = selected ? ARCHIVE_STORIES[selected.slug] : null;
  const dialog = useRef<HTMLDialogElement>(null);
  const scrollArea = useRef<HTMLDivElement>(null);
  const progress = useRef<HTMLSpanElement>(null);
  const progressLabel = useRef<HTMLSpanElement>(null);
  const articleHeading = useRef<HTMLHeadingElement>(null);
  const resumeButton = useRef<HTMLButtonElement>(null);
  const navButtons = useRef<(HTMLButtonElement | null)[]>([]);
  const sectionNodes = useRef<(HTMLElement | null)[]>([]);
  const activeEntry = useRef<string | null>(null);
  const positions = useRef<Record<string, number>>({});
  const keyboard = useRef(true);
  const trigger = useRef<HTMLElement | null>(null);
  const motion = useRef<Animation | null>(null);
  const contentMotion = useRef<Animation | null>(null);
  const visit = useRef(0);

  const savePositions = useCallback(() => {
    try { window.sessionStorage.setItem(POSITION_KEY, JSON.stringify(positions.current)); } catch { /* Reading still works when storage is unavailable. */ }
  }, []);

  const cancelMotion = useCallback(() => {
    if (motion.current) { motion.current.onfinish = null; motion.current.cancel(); motion.current = null; }
    contentMotion.current?.cancel();
    contentMotion.current = null;
  }, []);

  const updateReading = useCallback(() => {
    const area = scrollArea.current;
    if (!area || !activeEntry.current) return;
    positions.current[activeEntry.current] = area.scrollTop;
    const distance = area.scrollHeight - area.clientHeight;
    const fraction = distance > 0 ? Math.min(1, Math.max(0, area.scrollTop / distance)) : 1;
    if (progress.current) progress.current.style.transform = `scaleX(${fraction})`;
    if (progressLabel.current) progressLabel.current.textContent = `${Math.round(fraction * 100)}%`;
    let chapter = 0;
    const top = area.getBoundingClientRect().top;
    sectionNodes.current.forEach((node, index) => { if (node && node.getBoundingClientRect().top - top <= 100) chapter = index; });
    if (distance > 0 && distance - area.scrollTop < 3) chapter = CHAPTERS.length - 1;
    navButtons.current.forEach((button, index) => {
      if (index === chapter) button?.setAttribute('aria-current', 'location');
      else button?.removeAttribute('aria-current');
    });
  }, []);

  const dismiss = useCallback(() => {
    const element = dialog.current;
    if (!element?.open) return;
    savePositions();
    const currentStyle = getComputedStyle(element);
    const from = { transform: currentStyle.transform, opacity: currentStyle.opacity };
    cancelMotion();
    const finish = () => {
      element.close();
      delete element.dataset.closing;
      activeEntry.current = null;
      setReading(null);
      trigger.current?.focus({ preventScroll: true });
      cancelMotion();
    };
    element.dataset.closing = 'true';
    if (keyboard.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { finish(); return; }
    const animation = element.animate([from, { transform: 'translateX(48px)', opacity: 0 }], { duration: 180, easing: EASE, fill: 'forwards' });
    motion.current = animation;
    animation.onfinish = finish;
  }, [cancelMotion, savePositions]);

  const closeReader = useCallback(() => {
    window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}`);
    dismiss();
  }, [dismiss]);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.sessionStorage.getItem(POSITION_KEY) || '{}');
      if (saved && typeof saved === 'object') Object.entries(saved).forEach(([slug, top]) => {
        if (findArchiveEntry(slug) && typeof top === 'number' && Number.isFinite(top) && top >= 0) positions.current[slug] = top;
      });
    } catch { /* Ignore invalid or unavailable session storage. */ }
    const pointer = () => { keyboard.current = false; if (dialog.current) dialog.current.dataset.keyboard = 'false'; };
    const key = () => {
      keyboard.current = true;
      if (dialog.current) dialog.current.dataset.keyboard = 'true';
      // Keyboard input immediately completes any in-flight transition.
      if (dialog.current?.dataset.closing === 'true') dismiss(); else cancelMotion();
    };
    const sync = () => {
      const entry = archiveEntryFromHash(window.location.hash);
      if (!entry) { dismiss(); return; }
      savePositions();
      if (!dialog.current?.open && document.activeElement instanceof HTMLElement) trigger.current = document.activeElement;
      cancelMotion();
      if (dialog.current) delete dialog.current.dataset.closing;
      setReading({ entry, visit: ++visit.current });
    };
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const preference = () => { if (reduced.matches) { if (dialog.current?.dataset.closing === 'true') dismiss(); else cancelMotion(); } };
    const frame = requestAnimationFrame(sync);
    window.addEventListener('hashchange', sync);
    window.addEventListener('pointerdown', pointer, true);
    window.addEventListener('keydown', key, true);
    window.addEventListener('pagehide', savePositions);
    reduced.addEventListener('change', preference);
    return () => {
      cancelAnimationFrame(frame);
      cancelMotion();
      savePositions();
      window.removeEventListener('hashchange', sync);
      window.removeEventListener('pointerdown', pointer, true);
      window.removeEventListener('keydown', key, true);
      window.removeEventListener('pagehide', savePositions);
      reduced.removeEventListener('change', preference);
    };
  }, [cancelMotion, dismiss, savePositions]);

  useLayoutEffect(() => {
    if (!reading || !dialog.current || !scrollArea.current) return;
    const element = dialog.current;
    const opening = !element.open;
    element.dataset.keyboard = String(keyboard.current);
    if (opening) element.showModal();
    activeEntry.current = reading.entry.slug;
    const top = positions.current[reading.entry.slug] ?? 0;
    if (resumeButton.current) resumeButton.current.hidden = top < 100;
    scrollArea.current.scrollTo({ top, behavior: 'instant' });
    (top >= 100 ? scrollArea.current : articleHeading.current)?.focus({ preventScroll: true });
    updateReading();
    if (!keyboard.current && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (opening) motion.current = element.animate([{ transform: 'translateX(64px)', opacity: 0 }, { transform: 'translateX(0)', opacity: 1 }], { duration: 260, easing: EASE });
      else contentMotion.current = scrollArea.current.animate([{ opacity: .4 }, { opacity: 1 }], { duration: 180, easing: EASE });
    }
    const observer = new ResizeObserver(updateReading);
    observer.observe(scrollArea.current);
    return () => observer.disconnect();
  }, [reading, updateReading]);

  const opened = Boolean(reading);
  useEffect(() => {
    if (!opened) return;
    const root = document.documentElement;
    const previous = { overflow: root.style.overflow, gutter: root.style.scrollbarGutter };
    root.style.scrollbarGutter = 'stable';
    root.style.overflow = 'hidden';
    return () => { root.style.overflow = previous.overflow; root.style.scrollbarGutter = previous.gutter; };
  }, [opened]);

  function goToChapter(index: number) {
    const area = scrollArea.current;
    const section = sectionNodes.current[index];
    if (!area || !section) return;
    area.scrollTo({ top: index === 0 ? 0 : area.scrollTop + section.getBoundingClientRect().top - area.getBoundingClientRect().top - 28, behavior: keyboard.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    if (keyboard.current) section.focus({ preventScroll: true });
    if (resumeButton.current) resumeButton.current.hidden = true;
  }

  function trapFocus(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== 'Tab') return;
    const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex="0"]')).filter(element => element.getClientRects().length > 0);
    const first = controls[0];
    const last = controls[controls.length - 1];
    const target = event.shiftKey && document.activeElement === first ? last : !event.shiftKey && document.activeElement === last ? first : null;
    if (target) { event.preventDefault(); target.focus(); }
  }

  return <dialog ref={dialog} className={styles.reader} data-entry={selected?.slug} data-kind={selected?.kind} aria-labelledby="reader-title" onKeyDown={trapFocus} onCancel={event => { event.preventDefault(); closeReader(); }} onClick={event => { if (event.target === event.currentTarget) closeReader(); }}>
    {selected && story && <>
      <header className={styles.readerHeader}>
        <span className={styles.readerIdentity}><i aria-hidden="true" /><span>{selected.title}</span><small>{selected.kind === 'project' ? 'BUILD' : 'NOTE'} {selected.number}</small></span>
        <button type="button" className={styles.closeButton} onClick={closeReader} aria-label="关闭档案"><span>返回实验场</span><X size={20} aria-hidden="true" /></button>
      </header>
      <div className={styles.progressTrack} aria-hidden="true"><span ref={progress} /></div>
      <div className={styles.readerBody}>
        <nav className={styles.contents} aria-label="文章章节">
          <span className={styles.contentsLabel}>IN THIS STORY</span>
          <div className={styles.chapterLinks}>{CHAPTERS.map((chapter, index) => <button ref={node => { navButtons.current[index] = node; }} key={chapter.id} type="button" aria-controls={`reader-${chapter.id}`} onClick={() => goToChapter(index)}><span>0{index + 1}</span>{chapter.label}</button>)}</div>
          <div className={styles.readingState}><span>阅读进度</span><span ref={progressLabel}>0%</span></div>
          <button ref={resumeButton} hidden type="button" className={styles.resumeButton} onClick={() => goToChapter(0)}>已恢复进度<br /><span>回到开头 ↑</span></button>
        </nav>
        <div ref={scrollArea} className={styles.readerScroll} tabIndex={0} role="region" aria-label="档案正文" onScroll={updateReading}>
          <article className={styles.article} key={selected.slug}>
            <section ref={node => { sectionNodes.current[0] = node; }} id="reader-overview" tabIndex={-1} className={styles.articleHero}>
              <div className={styles.articleMeta}><span>{selected.kind === 'project' ? 'PROJECT STUDY' : 'FIELD NOTE'} / {selected.number}</span><span>{selected.updated}</span></div>
              <h2 ref={articleHeading} tabIndex={-1} id="reader-title">{selected.question}</h2>
              <p className={styles.takeaway}>{story.takeaway}</p>
              <div className={styles.articleTags}>{selected.tags.map(tag => <span key={tag}>{tag}</span>)}</div>
            </section>
            <div className={styles.articleContent}>
              <p className={styles.articleLead}>{selected.body}</p>
              {selected.evidence.length > 0 && <dl className={styles.evidence}>{selected.evidence.map(item => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl>}
              <section ref={node => { sectionNodes.current[1] = node; }} id="reader-process" tabIndex={-1} className={styles.articleSection}>
                <span className={styles.sectionKicker}>02 / {selected.kind === 'project' ? 'HOW IT WORKS' : 'READING MAP'}</span>
                <h3>{story.sceneTitle}</h3><p>{story.scene}</p>
                <figure className={styles.processFigure}><figcaption>{story.figureTitle}</figcaption><ol>{story.steps.map((step, index) => <li key={step.title}><span className={styles.stepIndex}>0{index + 1}</span><div><strong>{step.title}</strong><p>{step.detail}</p></div>{index < story.steps.length - 1 && <ArrowRight size={18} aria-hidden="true" />}</li>)}</ol><small>{selected.kind === 'project' ? '流程解读 · 基于公开项目能力' : '阅读线索 · 根据本页主题整理'}</small></figure>
                <h4>{selected.kind === 'project' ? '可以进一步核对的能力' : '带着这几个问题继续读'}</h4>
                <ul className={styles.capabilities}>{selected.points.map(point => <li key={point}>{point}</li>)}</ul>
              </section>
              <section ref={node => { sectionNodes.current[2] = node; }} id="reader-decisions" tabIndex={-1} className={styles.articleSection}>
                <span className={styles.sectionKicker}>03 / DECISIONS & CONTEXT</span><h3>{selected.kind === 'project' ? '这个选择，意味着什么。' : '把结论放回它的边界。'}</h3>
                {selected.kind === 'project' && <p>{selected.perspective}</p>}<p>{story.tradeoff}</p>
                {selected.kind === 'note' && <p className={styles.boundary}>{selected.perspective}</p>}
              </section>
              <section ref={node => { sectionNodes.current[3] = node; }} id="reader-explore" tabIndex={-1} className={styles.articleSection}>
                <span className={styles.sectionKicker}>04 / KEEP EXPLORING</span>
                <div className={styles.openQuestion}><CornerDownRight size={22} aria-hidden="true" /><div><span>留一个问题，继续往下走。</span><h3>{selected.nextQuestion}</h3></div></div>
                <div className={styles.articleSources}><a href={selected.source} target="_blank" rel="noopener noreferrer">{selected.sourceLabel}<ArrowUpRight size={16} aria-hidden="true" /></a><Link href={archiveTerminalHref(selected)}>在终端中继续<ArrowRight size={16} aria-hidden="true" /></Link></div>
                <p className={styles.sourceDate}>公开资料快照 · {PUBLIC_EVIDENCE_CHECKED_AT}。能力、版本与细节以原始资料为准。</p>
                <div className={styles.related}><h4>顺着这条线索，再读一篇。</h4>{selected.related.map(slug => { const entry = findArchiveEntry(slug); return entry ? <EntryLink key={slug} entry={entry} reason={story.connections[slug]} /> : null; })}</div>
              </section>
              <footer className={styles.articleEnd}><span>END / {selected.number}</span><button type="button" onClick={() => goToChapter(0)}>回到开头 ↑</button></footer>
            </div>
          </article>
        </div>
      </div>
    </>}
  </dialog>;
}
