'use client';

import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { ReturnHomeLink } from '@/app/components/ArchiveLink';
import { enterPlayground } from '@/app/lib/home-navigation';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import { ARCHIVE_ENTRIES, archiveEntryHref, findArchiveEntry } from '@/app/lib/archive/catalog';
import { PUBLIC_EVIDENCE_CHECKED_AT, SITE_CONFIG } from '@/app/lib/content/portfolio';
import ArchiveReader from './ArchiveReader';
import { DocumentDemo, DocumentTeaser, GatewayDemo, ProtocolTeaser, ReviewDemo, ReviewTeaser, TerminalDemo } from './ProjectDemos';
import styles from './Playground.module.css';

const PROJECTS = [
  { slug: 'omz-pm', name: 'omz-pm', category: 'DEVELOPER TOOLS', description: '先试一套，让终端有你的样子。', compactDescription: '', Demo: TerminalDemo, Teaser: null },
  { slug: 'DocBabel', name: 'DocBabel', category: '文档与翻译工具', description: '文字换一种语言，阅读保持连贯。', compactDescription: '让技术文档跨越语言。', Demo: DocumentDemo, Teaser: DocumentTeaser },
  { slug: 'artifact-gateway', name: 'Artifact Gateway', category: '包与制品网关', description: '一个入口，继续用你熟悉的命令。', compactDescription: '统一的制品访问层。', Demo: GatewayDemo, Teaser: ProtocolTeaser },
  { slug: 'opencode-review-gitea', name: 'OpenCode Review', category: '代码协作与评审', description: '好的反馈，就留在代码发生的地方。', compactDescription: '让评审回到代码本身。', Demo: ReviewDemo, Teaser: ReviewTeaser },
] as const;

const NOTES = ARCHIVE_ENTRIES.filter(entry => entry.kind === 'note');
const SHORT_NAMES = ['omz-pm', 'DocBabel', 'Gateway', 'Review'];

function HeadingText({ project }: { project: typeof PROJECTS[number] }) {
  return <><span className={styles.category}>{project.category}</span><span className={styles.projectTitle}>{project.name}</span></>;
}

export default function Playground() {
  const [active, setActive] = useState(0);
  const [keyboard, setKeyboard] = useState(false);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const mobileButtons = useRef<(HTMLButtonElement | null)[]>([]);
  const panels = useRef<(HTMLElement | null)[]>([]);
  const panelContents = useRef<(HTMLDivElement | null)[]>([]);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverTarget = useRef<number | null>(null);
  const lastPointer = useRef({ x: -1, y: -1 });
  const notes = useRef<HTMLDivElement>(null);

  const clearHover = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = null;
    hoverTarget.current = null;
  };

  useEffect(() => () => { if (hoverTimer.current) clearTimeout(hoverTimer.current); }, []);
  useLayoutEffect(enterPlayground, []);

  useEffect(() => {
    const syncProject = () => {
      const hash = window.location.hash;
      if (!hash.startsWith('#play=')) return;
      const index = PROJECTS.findIndex(project => `#play=${project.slug}` === hash);
      if (index >= 0) { clearHover(); setKeyboard(true); setActive(index); }
    };
    const frame = requestAnimationFrame(syncProject);
    window.addEventListener('hashchange', syncProject);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('hashchange', syncProject); };
  }, []);

  useEffect(() => {
    const links = notes.current?.querySelectorAll('a');
    if (!links) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const animations = new Set<Animation>();
    const cancel = () => { animations.forEach(animation => animation.cancel()); animations.clear(); };
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        if (preference.matches || notes.current?.closest('[data-keyboard="true"]')) return;
        const index = Array.from(links).indexOf(entry.target as HTMLAnchorElement);
        const animation = entry.target.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 280, delay: index * 40, easing: 'cubic-bezier(.22,.8,.2,1)', fill: 'backwards' });
        animations.add(animation);
        animation.onfinish = () => animations.delete(animation);
      });
    }, { threshold: .15 });
    links.forEach(link => observer.observe(link));
    preference.addEventListener('change', cancel);
    window.addEventListener('keydown', cancel, true);
    return () => { observer.disconnect(); cancel(); preference.removeEventListener('change', cancel); window.removeEventListener('keydown', cancel, true); };
  }, []);

  useLayoutEffect(() => {
    panelContents.current[active]?.scrollTo({ top: 0, behavior: 'instant' });
  }, [active]);

  function select(index: number, focus = false) {
    clearHover();
    setActive(index);
    if (focus) {
      const targets = window.matchMedia('(max-width: 1099px)').matches ? mobileButtons : buttons;
      targets.current[index]?.focus({ preventScroll: true });
    }
  }

  function preview(event: PointerEvent<HTMLElement>, index: number) {
    if (event.pointerType !== 'mouse' || event.buttons !== 0 || !window.matchMedia('(min-width: 1100px) and (hover: hover) and (pointer: fine)').matches) return;
    const position = { x: event.clientX, y: event.clientY };
    if (position.x === lastPointer.current.x && position.y === lastPointer.current.y) return;
    lastPointer.current = position;
    if (index === active || hoverTarget.current === index) return;
    // Do not collapse a focused control while somebody is using the keyboard.
    const focused = document.activeElement;
    if (focused instanceof HTMLElement && focused.matches(':focus-visible') && panels.current[active]?.contains(focused)) return;
    setKeyboard(false);
    clearHover();
    hoverTarget.current = index;
    hoverTimer.current = setTimeout(() => { setActive(index); hoverTarget.current = null; }, 180);
  }

  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const target = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? (index + 1) % PROJECTS.length
      : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? (index + PROJECTS.length - 1) % PROJECTS.length
        : event.key === 'Home' ? 0 : event.key === 'End' ? PROJECTS.length - 1 : null;
    if (target === null) return;
    event.preventDefault();
    setKeyboard(true);
    select(target, true);
  }

  return <main className={styles.playground} data-playground data-keyboard={keyboard} onKeyDownCapture={() => setKeyboard(true)} onPointerDownCapture={() => { clearHover(); setKeyboard(false); }}>
    <a href="#works" className={styles.skipLink}>跳到作品</a>
    <header className={styles.header}>
      <ReturnHomeLink className={styles.brand}>{SITE_CONFIG.domain}<span>/</span><span>个人实验场</span></ReturnHomeLink>
      <nav aria-label="实验场导航"><a href="#works">作品</a><span aria-hidden="true">/</span><a href="#notes">手记</a><ReturnHomeLink className={styles.backLink}>返回首页<ArrowUpRight size={19} aria-hidden="true" /></ReturnHomeLink></nav>
    </header>
    <section className={styles.intro} aria-labelledby="playground-heading"><h1 id="playground-heading">别只看，动手玩。</h1><p>选一件作品，试一下它的想法。</p></section>

    <section id="works" className={styles.stage} aria-label="可体验的作品">
      <nav className={styles.mobileTabs} aria-label="切换作品">
        {PROJECTS.map((project, index) => <button key={project.slug} ref={element => { mobileButtons.current[index] = element; }} type="button" aria-label={`体验 ${project.name}`} aria-pressed={active === index} aria-controls={`project-${project.slug}`} data-project={project.slug} onClick={() => select(index)} onKeyDown={event => navigate(event, index)}><span>0{index + 1}</span>{SHORT_NAMES[index]}</button>)}
      </nav>
      <div className={styles.showcase} data-active={active}>
      {PROJECTS.map((project, index) => {
        const entry = findArchiveEntry(project.slug)!;
        const expanded = active === index;
        return <article id={`project-${project.slug}`} key={project.slug} ref={element => { panels.current[index] = element; }} className={styles.panel} data-project={project.slug} data-active={expanded} onPointerMove={event => preview(event, index)} onPointerLeave={clearHover}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelHeading}>
              <button ref={element => { buttons.current[index] = element; }} type="button" className={styles.panelToggle} aria-expanded={expanded} aria-controls={`demo-${project.slug}`} aria-label={`${expanded ? '当前作品' : '展开'}：${project.name}`} onClick={() => select(index)} onKeyDown={event => navigate(event, index)}><HeadingText project={project} /></button>
              <span className={styles.mobileHeading}><HeadingText project={project} /></span>
            </h2>
            <p className={styles.projectDescription}>{expanded ? project.description : project.compactDescription || '给终端换个样子。'}</p>
          </div>
          <div ref={element => { panelContents.current[index] = element; }} id={`demo-${project.slug}`} className={styles.experiment} hidden={!expanded} role="region" aria-label={`${project.name} 体验内容`} tabIndex={expanded ? 0 : -1}><project.Demo /></div>
          {!expanded && <div className={styles.teaser} aria-hidden="true">{project.Teaser ? <project.Teaser /> : <div className={styles.terminalTeaser}><span>~/playground</span><strong>hello,<br />terminal.</strong><span>YOUR SHELL. YOUR STYLE.</span></div>}</div>}
          <div className={styles.panelFooter}>
            {expanded ? <><span className={styles.panelNumber}>0{index + 1}<small> / 04</small></span><a className={styles.projectLink} href={archiveEntryHref(entry)}><span>作品档案<ArrowUpRight size={15} aria-hidden="true" /></span><span className={styles.launchArrow}><ArrowUpRight size={30} strokeWidth={1.8} aria-hidden="true" /></span></a></> : <button type="button" className={styles.panelFoot} aria-label={`展开 ${project.name}`} onClick={() => select(index)}><span>0{index + 1}</span><ArrowRight size={20} aria-hidden="true" /></button>}
          </div>
        </article>;
      })}
      </div>
    </section>

    <div className={styles.exploreRail}><button type="button" aria-label="上一个作品" onClick={() => select((active + PROJECTS.length - 1) % PROJECTS.length, true)}><ArrowLeft size={23} aria-hidden="true" /></button><span className={styles.desktopHint}>悬停展开 · 动手体验</span><span className={styles.mobileHint}>切换作品 · 继续探索</span><button type="button" aria-label="下一个作品" onClick={() => select((active + 1) % PROJECTS.length, true)}><ArrowRight size={23} aria-hidden="true" /></button></div>

    <section id="notes" className={styles.notes} aria-labelledby="notes-heading">
      <div className={styles.notesHeading}><span>FIELD NOTES / 04</span><h2 id="notes-heading">做东西之外，<br />也留一点时间追问。</h2><p>关于知识、网络、语音与系统的四条手记。</p></div>
      <div ref={notes} className={styles.notesList}>{NOTES.map((entry, index) => <a key={entry.slug} href={archiveEntryHref(entry)}><span className={styles.noteNumber}>0{index + 1}</span><span><small>{entry.tags[0]}</small><h3>{entry.question}</h3></span><ArrowUpRight size={24} aria-hidden="true" /></a>)}</div>
    </section>
    <footer className={styles.footer}><span>{SITE_CONFIG.domain} · 保持好奇，继续动手。</span><span>公开资料快照 {PUBLIC_EVIDENCE_CHECKED_AT}</span><a href="#works">回到作品<ArrowUpRight size={16} aria-hidden="true" /></a></footer>
    <ArchiveReader />
  </main>;
}
