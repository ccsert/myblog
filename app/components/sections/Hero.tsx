'use client';

import Terminal from '@/app/components/terminal/Terminal';
import { KNOWLEDGE_SIGNALS, PORTFOLIO_PROJECTS } from '@/app/lib/content/portfolio';
import { Command } from '@/app/types/terminal';
import { ArrowDown } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Hero() {
  const router = useRouter();
  const scrollToSection = (sectionId: string, label: string) => {
    requestAnimationFrame(() => {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      document.getElementById(sectionId)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });

    return `Opening ${label}...`;
  };

  const commands: Command[] = [
    {
      name: 'archive',
      description: 'Enter the playable Signal Archive',
      fn: () => {
        router.push('/archive');
        return 'Opening Signal Archive...';
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
    'ccsert.dev — developer tools, AI-assisted engineering, self-hosted systems.',
    `${PORTFOLIO_PROJECTS.length} public repositories · ${KNOWLEDGE_SIGNALS.length} knowledge signals · session online`,
    '',
    'Quick start:',
    '  open <path> — preview a file',
    '  search protocol — search projects and research notes',
    '  tree — inspect files',
    '  status — show system health',
    '  archive — enter the playable Signal Archive',
    '  theme <name> — green · cyan · amber · light',
    '',
    'Tip: type “o” to inspect matches, then press Tab to complete.',
    'Press ⌘K to browse every action.',
    '',
  ];

  return (
    <section className="relative min-h-[100svh] flex items-center justify-center px-4 pb-16 pt-28 blueprint-grid">
      <div className="w-full max-w-[1340px]">
        <div className="mb-7 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-3 text-text-primary tracking-tight">
            ccsert<span className="text-accent">.dev</span>
          </h1>
          <p className="text-lg md:text-xl text-text-secondary font-mono">
            Developer tools · AI-assisted engineering · self-hosted infrastructure
          </p>
        </div>

        <div className="h-[560px] md:h-[650px] lg:h-[clamp(620px,calc(100svh-225px),776px)]">
          <Terminal commands={commands} welcomeMessage={welcomeMessage} />
        </div>

        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 text-text-dim text-sm font-mono animate-bounce">
            <span>Scroll down to explore</span>
            <ArrowDown size={16} aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
}
