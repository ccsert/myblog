'use client';

import Terminal from '@/app/components/terminal/Terminal';
import SignalObservatory from './exploration/SignalObservatory';
import DiscoveryDock from './exploration/DiscoveryDock';
import { KNOWLEDGE_SIGNALS, PORTFOLIO_PROFILE, PORTFOLIO_PROJECTS, SITE_CONFIG } from '@/app/lib/content/portfolio';
import { Command, TerminalHandle } from '@/app/types/terminal';
import { ArrowDownRight, ArrowUpRight, TerminalSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ArchiveLink } from '@/app/components/ArchiveLink';
import { rememberHomePosition, scrollToHomeSection } from '@/app/lib/home-navigation';
import { useRef } from 'react';
import styles from './Hero.module.css';

export default function Hero() {
  const router = useRouter();
  const terminalRef = useRef<TerminalHandle>(null);
  const [brandPrefix, ...brandSuffix] = SITE_CONFIG.domain.split(/(?=\.)/);
  const openDocument = (path: string) => {
    const instant = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      || document.activeElement?.matches(':focus-visible');
    terminalRef.current?.openDocument(path);
    scrollToHomeSection('workbench', Boolean(instant));
  };
  const scrollToSection = (sectionId: string, label: string) => {
    requestAnimationFrame(() => {
      scrollToHomeSection(sectionId, true);
    });

    return `Opening ${label}...`;
  };

  const commands: Command[] = [
    {
      name: 'archive',
      description: 'Explore the questions behind the projects',
      fn: () => {
        rememberHomePosition();
        router.push('/archive', { scroll: false });
        return '正在打开个人实验场…';
      },
    },
    {
      name: 'about',
      description: 'Learn more about me',
      fn: () => scrollToSection('about', 'about'),
    },
    {
      name: 'projects',
      description: 'View my projects',
      fn: () => scrollToSection('projects', 'projects'),
    },
    {
      name: 'skills',
      description: 'View my skills',
      fn: () => scrollToSection('skills', 'skills'),
    },
    {
      name: 'notes',
      description: 'Browse the public knowledge index',
      fn: () => scrollToSection('blog', 'field notes'),
    },
    {
      name: 'contact',
      description: 'Get in touch',
      fn: () => scrollToSection('contact', 'contact'),
    },
    {
      name: 'sudo',
      description: 'Try it :)',
      fn: () => {
        return 'visitor is not in the sudoers file. This incident will be reported.';
      },
    },
    {
      name: 'matrix',
      description: 'Toggle matrix theme',
      fn: () => {
        document.body.classList.toggle('matrix-theme');
        return 'Matrix theme toggled.';
      },
    },
  ];

  const welcomeMessage = [
    `${SITE_CONFIG.domain} — developer tools, AI-assisted engineering, self-hosted systems.`,
    `${PORTFOLIO_PROJECTS.length} public repositories · ${KNOWLEDGE_SIGNALS.length} knowledge signals · session online`,
    '',
    'Quick start:',
    '  open <path> — preview a file',
    '  search protocol — search projects and research notes',
    '  tree — inspect files',
    '  status — show system health',
    '  archive — explore the questions behind the projects',
    '  theme <name> — green · cyan · amber · light',
    '',
    'Tip: → accepts the gray suggestion · Tab completes · ↑/↓ recalls history.',
    'Press ⌘K to browse every action.',
    '',
  ];

  return (
    <section id="home" className={`${styles.hero} blueprint-grid`} aria-label="个人信号观测台" tabIndex={-1} data-spotlight="hero">
      <div className={styles.inner}>
        <div className={styles.intro}>
          <div className={styles.identity}>
            <div className={styles.eyebrow}>CCSERT / BUILD · VERIFY · SHIP</div>
            <h1 className={styles.heading}>{brandPrefix}<span>{brandSuffix.join('')}</span><i className={styles.caret} aria-hidden="true" /></h1>
            <p className={styles.invitation}>{PORTFOLIO_PROFILE.tagline}</p>
            <p className={styles.domains}>Developer tools · AI engineering · Self-hosted systems</p>
            <nav className={styles.shortcuts} aria-label="开始探索">
              <a href="#projects"><b>{String(PORTFOLIO_PROJECTS.length).padStart(2, '0')}</b> 公开构建</a>
              <a href="#blog"><b>{String(KNOWLEDGE_SIGNALS.length).padStart(2, '0')}</b> 技术手记</a>
              <ArchiveLink href="/archive" id="hero-playground"><span className="playground-colors" aria-hidden="true"><i /><i /><i /><i /></span> 个人实验场 <ArrowUpRight size={11} aria-hidden="true" /></ArchiveLink>
            </nav>
          </div>
          <SignalObservatory onOpenDocument={openDocument} />
        </div>
        <div className={styles.workbenchHeading}>
          <span><TerminalSquare size={13} aria-hidden="true" /><b>01</b> THE OPEN WORKBENCH</span>
          <a href="#curiosity-heading">不知道从哪开始？ <ArrowDownRight size={13} aria-hidden="true" /></a>
        </div>
        <div className={styles.workbench} id="workbench">
          <Terminal ref={terminalRef} commands={commands} welcomeMessage={welcomeMessage} />
        </div>
        <div className={styles.workbenchFooter}><span><i /> 每个文件都能打开看看，也可以直接敲命令。</span><span>TYPE A COMMAND. FOLLOW A SIGNAL.</span></div>
        <DiscoveryDock onOpenDocument={openDocument} />
      </div>
    </section>
  );
}
