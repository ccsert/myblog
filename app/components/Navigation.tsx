'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import ThemeSignalFader from '@/app/components/theme/ThemeSignalFader';
import { SITE_CONFIG } from '@/app/lib/content/portfolio';
import { ArchiveLink } from '@/app/components/ArchiveLink';
import { scrollToHomeSection } from '@/app/lib/home-navigation';

const navItems = [
  { name: '个人实验场', href: '/archive' },
  { name: 'projects', href: '#projects' },
  { name: 'about', href: '#about' },
  { name: 'skills', href: '#skills' },
  { name: 'notes', href: '#blog' },
  { name: 'contact', href: '#contact' },
];

export default function Navigation() {
  const pathname = usePathname();
  // Chapter links only exist on the homepage; elsewhere they must navigate there.
  const isHome = pathname === '/';
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const navigation = useRef<HTMLElement>(null);
  const [brandPrefix, ...brandSuffix] = SITE_CONFIG.domain.split(/(?=\.)/);

  useEffect(() => {
    let lastY = window.scrollY;
    let travel = 0;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = Math.max(0, Math.min(window.scrollY, document.documentElement.scrollHeight - window.innerHeight));
      const delta = y - lastY;
      lastY = y;
      if (Math.abs(delta) >= .5) travel = Math.sign(delta) === Math.sign(travel) ? travel + delta : delta;
      const focused = navigation.current?.contains(document.activeElement) && document.activeElement?.matches(':focus-visible');
      const chapters = document.querySelector('[aria-label="首页章节"]');
      const compactReading = window.matchMedia('(max-width: 980px)').matches && chapters && chapters.getBoundingClientRect().top <= 74;
      if (y < 80 || isOpen || focused || compactReading || document.documentElement.dataset.homeInput === 'keyboard') setIsVisible(true);
      else if (travel > 56 && y > 160) setIsVisible(false);
      else if (travel < -24) setIsVisible(true);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    schedule();
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); };
  }, [isOpen]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

  return (
    <nav
      ref={navigation}
      aria-label="主导航"
      onFocusCapture={() => setIsVisible(true)}
      onClick={event => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const link = (event.target as Element).closest('a[href^="#"]');
        const hash = link?.getAttribute('href');
        if (!hash) return;
        // A missing target means the click belongs to another page.
        if (!document.getElementById(hash.slice(1))) return;
        event.preventDefault();
        setIsOpen(false);
        const keyboard = event.detail === 0;
        window.history.pushState(window.history.state, '', hash);
        requestAnimationFrame(() => scrollToHomeSection(hash.slice(1), keyboard));
      }}
      className={`
        home-navigation fixed top-0 left-0 right-0 z-50
        bg-bg/80 backdrop-blur-md border-b border-subtle
        transition-transform duration-200
        ${isVisible ? 'translate-y-0' : '-translate-y-full'}
      `}
    >
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a href={isHome ? '#home' : '/'} aria-label="返回首页" className="font-mono text-lg font-bold text-text-primary hover:text-accent transition-colors">
            {brandPrefix}<span className="text-accent">{brandSuffix.join('')}</span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
            {navItems.map((item) => (
              item.href.startsWith('/') ? (
                <ArchiveLink
                  key={item.name}
                  href={item.href}
                  className="font-mono text-sm text-text-secondary hover:text-accent transition-colors"
                >
                  <span className="playground-colors" aria-hidden="true"><i /><i /><i /><i /></span>{item.name}
                </ArchiveLink>
              ) : (
                <a
                  key={item.name}
                  href={isHome ? item.href : `/${item.href}`}
                  className="font-mono text-sm text-text-secondary hover:text-accent transition-colors"
                >
                  <span className="text-accent">~/</span>{item.name}
                </a>
              )
            ))}
            <ThemeSignalFader />
          </div>

          {/* Mobile Actions */}
          <div className="flex items-center gap-2 lg:hidden">
            <ThemeSignalFader compact />
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-text-primary hover:text-accent transition-colors"
              aria-label={isOpen ? '关闭导航菜单' : '打开导航菜单'}
              aria-expanded={isOpen}
              aria-controls="mobile-navigation"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div id="mobile-navigation" className="lg:hidden mt-4 pb-4 space-y-2">
            {navItems.map((item) => (
              item.href.startsWith('/') ? (
                <ArchiveLink
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-2 font-mono text-sm text-text-secondary hover:text-accent hover:bg-surface rounded transition-colors"
                >
                  <span className="text-accent">~/</span>{item.name}
                </ArchiveLink>
              ) : (
                <a
                  key={item.name}
                  href={isHome ? item.href : `/${item.href}`}
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-2 font-mono text-sm text-text-secondary hover:text-accent hover:bg-surface rounded transition-colors"
                >
                  <span className="text-accent">~/</span>{item.name}
                </a>
              )
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
