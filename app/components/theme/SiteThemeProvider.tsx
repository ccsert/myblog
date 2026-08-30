'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { isSiteTheme, SiteTheme } from '@/app/lib/theme';

interface ThemeOrigin {
  x: number;
  y: number;
}

interface ChangeThemeOptions {
  animate?: boolean;
  origin?: ThemeOrigin;
}

interface SiteThemeContextValue {
  theme: SiteTheme;
  changeTheme: (theme: SiteTheme, options?: ChangeThemeOptions) => void;
}

const SiteThemeContext = createContext<SiteThemeContextValue | null>(null);
const SITE_THEME_STORAGE_KEY = 'ccsert-site:theme';

function applyThemeAttribute(theme: SiteTheme) {
  document.documentElement.dataset.theme = theme;
}

export default function SiteThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<SiteTheme>('green');
  const [transitionSequence, setTransitionSequence] = useState(0);
  const fallbackFrameRef = useRef<number | null>(null);
  const fallbackTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const storedTheme = window.localStorage.getItem(SITE_THEME_STORAGE_KEY);
        if (!storedTheme || !isSiteTheme(storedTheme)) return;
        applyThemeAttribute(storedTheme);
        setTheme(storedTheme);
      } catch {
        // Theme persistence is optional; the in-memory theme remains usable.
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => () => {
    if (fallbackFrameRef.current !== null) window.cancelAnimationFrame(fallbackFrameRef.current);
    if (fallbackTimerRef.current !== null) window.clearTimeout(fallbackTimerRef.current);
  }, []);

  const changeTheme = useCallback((nextTheme: SiteTheme, options: ChangeThemeOptions = {}) => {
    if (nextTheme === theme) return;

    const root = document.documentElement;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const origin = options.origin ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const radius = Math.hypot(
      Math.max(origin.x, window.innerWidth - origin.x),
      Math.max(origin.y, window.innerHeight - origin.y),
    );

    root.style.setProperty('--theme-origin-x', `${origin.x}px`);
    root.style.setProperty('--theme-origin-y', `${origin.y}px`);

    const commitTheme = () => {
      applyThemeAttribute(nextTheme);
      try {
        window.localStorage.setItem(SITE_THEME_STORAGE_KEY, nextTheme);
      } catch {
        // A blocked store should not prevent the visible theme change.
      }
      flushSync(() => {
        setTheme(nextTheme);
        setTransitionSequence(sequence => sequence + 1);
      });
    };

    if (options.animate === false || reduceMotion) {
      commitTheme();
      return;
    }

    if (!document.startViewTransition) {
      if (fallbackFrameRef.current !== null) window.cancelAnimationFrame(fallbackFrameRef.current);
      if (fallbackTimerRef.current !== null) window.clearTimeout(fallbackTimerRef.current);

      root.dataset.themeFallbackTransitioning = 'true';
      fallbackFrameRef.current = window.requestAnimationFrame(() => {
        fallbackFrameRef.current = window.requestAnimationFrame(() => {
          commitTheme();
          fallbackFrameRef.current = null;
          fallbackTimerRef.current = window.setTimeout(() => {
            delete root.dataset.themeFallbackTransitioning;
            fallbackTimerRef.current = null;
          }, 280);
        });
      });
      return;
    }

    root.style.setProperty('--theme-reveal-radius', `${radius}px`);
    root.dataset.themeTransitioning = 'true';

    const transition = document.startViewTransition(commitTheme);
    void transition.finished.finally(() => {
      delete root.dataset.themeTransitioning;
    });
  }, [theme]);

  const value = useMemo(() => ({ theme, changeTheme }), [changeTheme, theme]);

  return (
    <SiteThemeContext.Provider value={value}>
      {children}
      {transitionSequence > 0 ? (
        <span key={transitionSequence} className="theme-transition-overlay" aria-hidden="true" />
      ) : null}
    </SiteThemeContext.Provider>
  );
}

export function useSiteTheme() {
  const context = useContext(SiteThemeContext);
  if (!context) throw new Error('useSiteTheme must be used within SiteThemeProvider');
  return context;
}
