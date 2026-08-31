'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import ThemeSignalFader from '@/app/components/theme/ThemeSignalFader';

const navItems = [
  { name: 'archive', href: '/archive' },
  { name: 'projects', href: '#projects' },
  { name: 'about', href: '#about' },
  { name: 'skills', href: '#skills' },
  { name: 'notes', href: '#blog' },
  { name: 'contact', href: '#contact' },
];

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
          <div className="hidden lg:flex items-center gap-6">
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
