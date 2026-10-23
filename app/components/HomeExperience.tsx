'use client';

import { useEffect, useLayoutEffect, useRef, type MouseEvent, type ReactNode } from 'react';
import { installSpotlight } from '@/app/lib/home-motion';
import { cancelHomeScroll, restoreHomePosition, scrollToHomeSection } from '@/app/lib/home-navigation';

export default function HomeExperience({ children }: { children: ReactNode }) {
  const mainRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const frame = requestAnimationFrame(restoreHomePosition);
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const keyboard = () => { root.dataset.homeInput = 'keyboard'; };
    const pointer = () => { root.dataset.homeInput = 'pointer'; };
    window.addEventListener('keydown', keyboard, true);
    window.addEventListener('pointerdown', pointer, true);
    window.addEventListener('wheel', pointer, { passive: true });
    return () => {
      cancelHomeScroll();
      delete root.dataset.homeInput;
      window.removeEventListener('keydown', keyboard, true);
      window.removeEventListener('pointerdown', pointer, true);
      window.removeEventListener('wheel', pointer);
    };
  }, []);

  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    return installSpotlight(main);
  }, []);

  function followAnchor(event: MouseEvent<HTMLElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
    if (!link || link.target || link.hasAttribute('download')) return;
    const hash = link.getAttribute('href')!;
    const id = hash.slice(1);
    if (!id || !document.getElementById(id)) return;
    event.preventDefault();
    if (window.location.hash !== hash) window.history.pushState(window.history.state, '', hash);
    scrollToHomeSection(id, event.detail === 0);
  }

  return (
    <main ref={mainRef} className="min-h-screen" data-home-experience onClick={followAnchor}>
      <div className="home-scroll-progress" aria-hidden="true" />
      {children}
    </main>
  );
}
