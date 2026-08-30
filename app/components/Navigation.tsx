'use client';

import { MouseEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Menu, Palette, X } from 'lucide-react';
import { getNextSiteTheme, SITE_THEMES } from '@/app/lib/theme';
import { useSiteTheme } from '@/app/components/theme/SiteThemeProvider';

const navItems = [
  { name: 'archive', href: '/archive' },
  { name: 'projects', href: '#projects' },
  { name: 'about', href: '#about' },
  { name: 'skills', href: '#skills' },
  { name: 'notes', href: '#blog' },
  { name: 'contact', href: '#contact' },
];

function ThemeCycleButton({ mobile = false }: { mobile?: boolean }) {
  const { theme, changeTheme } = useSiteTheme();
  const currentTheme = SITE_THEMES.find(item => item.id === theme) ?? SITE_THEMES[0];
  const nextThemeId = getNextSiteTheme(theme);
  const nextTheme = SITE_THEMES.find(item => item.id === nextThemeId) ?? SITE_THEMES[0];

  const handleThemeChange = (event: MouseEvent<HTMLButtonElement>) => {
    changeTheme(nextThemeId, {
      origin: { x: event.clientX, y: event.clientY },
    });
  };

  return (
    <button
      type="button"
      onClick={handleThemeChange}
      className={`inline-flex h-9 items-center justify-center gap-2 rounded-full border border-border bg-surface/80 font-mono text-[11px] text-text-secondary transition-colors duration-150 hover:border-accent/50 hover:text-accent ${mobile ? 'w-9 p-0' : 'px-3'}`}
      aria-label={`当前主题：${currentTheme.label}；切换到：${nextTheme.label}`}
      title={`Theme: ${currentTheme.label} → ${nextTheme.label}`}
      data-theme-control
    >
      <Palette className="h-3.5 w-3.5" aria-hidden="true" />
      {!mobile ? (
        <>
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: currentTheme.accent }} aria-hidden="true" />
          <span>{currentTheme.shortLabel}</span>
        </>
      ) : null}
    </button>
  );
}

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY.current && currentScrollY > 100 && !isOpen) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
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
      className={`
        fixed top-0 left-0 right-0 z-50
        bg-bg/80 backdrop-blur-md border-b border-subtle
        transition-transform duration-300
        ${isVisible ? 'translate-y-0' : '-translate-y-full'}
      `}
    >
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a href="#" aria-label="返回首页" className="font-mono text-lg font-bold text-text-primary hover:text-accent transition-colors">
            ccsert<span className="text-accent">.dev</span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              item.href.startsWith('/') ? (
                <Link
                  key={item.name}
                  href={item.href}
                  className="font-mono text-sm text-text-secondary hover:text-accent transition-colors"
                >
                  <span className="text-accent">~/</span>{item.name}
                </Link>
              ) : (
                <a
                  key={item.name}
                  href={item.href}
                  className="font-mono text-sm text-text-secondary hover:text-accent transition-colors"
                >
                  <span className="text-accent">~/</span>{item.name}
                </a>
              )
            ))}
            <ThemeCycleButton />
          </div>

          {/* Mobile Actions */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeCycleButton mobile />
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
          <div id="mobile-navigation" className="md:hidden mt-4 pb-4 space-y-2">
            {navItems.map((item) => (
              item.href.startsWith('/') ? (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-2 font-mono text-sm text-text-secondary hover:text-accent hover:bg-surface rounded transition-colors"
                >
                  <span className="text-accent">~/</span>{item.name}
                </Link>
              ) : (
                <a
                  key={item.name}
                  href={item.href}
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
