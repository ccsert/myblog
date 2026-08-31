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

interface ThemePreviewOptions {
  direction: -1 | 1;
}

interface CancelThemePreviewOptions {
  immediate?: boolean;
}

interface SiteThemeContextValue {
  theme: SiteTheme;
  changeTheme: (theme: SiteTheme, options?: ChangeThemeOptions) => void;
  beginThemeGesture: () => boolean;
  beginThemePreview: (theme: SiteTheme, options: ThemePreviewOptions) => boolean;
  updateThemePreview: (progress: number) => void;
  advanceThemePreview: () => SiteTheme | null;
  cancelThemePreview: (options?: CancelThemePreviewOptions) => void;
  finishThemeGesture: (commit: boolean) => void;
}

const SiteThemeContext = createContext<SiteThemeContextValue | null>(null);
const SITE_THEME_STORAGE_KEY = 'ccsert-site:theme';
const INTERACTIVE_TRANSITION_DURATION = 1000;
const INTERACTIVE_SETTLE_MAX_DURATION = 220;

interface ActiveThemePreview {
  animations: Animation[];
  discrete: boolean;
  from: SiteTheme;
  frame: number | null;
  intent: boolean | null;
  progress: number;
  ready: boolean;
  sequence: number;
  to: SiteTheme;
  transition: ViewTransition | null;
}

interface ActiveThemeGesture {
  current: SiteTheme;
  origin: SiteTheme;
}

function applyThemeAttribute(theme: SiteTheme) {
  document.documentElement.dataset.theme = theme;
}

function persistTheme(theme: SiteTheme) {
  try {
    window.localStorage.setItem(SITE_THEME_STORAGE_KEY, theme);
  } catch {
    // A blocked store should not prevent the visible theme change.
  }
}

function clampProgress(progress: number) {
  return Math.min(1, Math.max(0, progress));
}

function isViewTransitionAnimation(animation: Animation) {
  const effect = animation.effect as (KeyframeEffect & { pseudoElement?: string | null }) | null;
  return effect?.pseudoElement?.includes('view-transition') ?? false;
}

function getAnimationDuration(animation: Animation) {
  const duration = animation.effect?.getTiming().duration;
  return typeof duration === 'number' ? duration : INTERACTIVE_TRANSITION_DURATION;
}

export default function SiteThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<SiteTheme>('green');
  const [transitionSequence, setTransitionSequence] = useState(0);
  const themeRef = useRef<SiteTheme>('green');
  const committedThemeRef = useRef<SiteTheme>('green');
  const themeHydratedRef = useRef(false);
  const previewSequenceRef = useRef(0);
  const activePreviewRef = useRef<ActiveThemePreview | null>(null);
  const activeGestureRef = useRef<ActiveThemeGesture | null>(null);
  const directTransitionRef = useRef<ViewTransition | null>(null);
  const directTransitionSequenceRef = useRef(0);
  const activeDirectTransitionRef = useRef<number | null>(null);
  const fallbackFrameRef = useRef<number | null>(null);
  const fallbackTimerRef = useRef<number | null>(null);

  const cancelDirectThemeTransition = useCallback(() => {
    if (fallbackFrameRef.current !== null) {
      window.cancelAnimationFrame(fallbackFrameRef.current);
      fallbackFrameRef.current = null;
    }
    if (fallbackTimerRef.current !== null) {
      window.clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    directTransitionRef.current?.skipTransition();
    directTransitionRef.current = null;
    directTransitionSequenceRef.current += 1;
    activeDirectTransitionRef.current = null;

    const root = document.documentElement;
    delete root.dataset.themeReducedTransitioning;
    delete root.dataset.themeFallbackTransitioning;
    delete root.dataset.themeTransitioning;
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const storedTheme = window.localStorage.getItem(SITE_THEME_STORAGE_KEY);
        if (!storedTheme || !isSiteTheme(storedTheme)) return;
        applyThemeAttribute(storedTheme);
        themeRef.current = storedTheme;
        committedThemeRef.current = storedTheme;
        setTheme(storedTheme);
      } catch {
        // Theme persistence is optional; the in-memory theme remains usable.
      } finally {
        themeHydratedRef.current = true;
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => () => {
    cancelDirectThemeTransition();
    const activeGesture = activeGestureRef.current;
    const activePreview = activePreviewRef.current;
    if (activePreview) {
      if (activePreview.frame !== null) window.cancelAnimationFrame(activePreview.frame);
      activePreview.transition?.skipTransition();
      activePreviewRef.current = null;
    }
    if (activeGesture) applyThemeAttribute(activeGesture.origin);
    else if (activePreview) applyThemeAttribute(activePreview.from);
    activeGestureRef.current = null;
    const root = document.documentElement;
    delete root.dataset.themePreviewing;
    delete root.dataset.themePreviewDirection;
    delete root.dataset.themeOverlaySuppressed;
  }, [cancelDirectThemeTransition]);

  const clearThemePreview = useCallback((preview: ActiveThemePreview) => {
    if (activePreviewRef.current?.sequence !== preview.sequence) return;

    const root = document.documentElement;
    delete root.dataset.themePreviewing;
    delete root.dataset.themePreviewDirection;
    activePreviewRef.current = null;
    if (!activeGestureRef.current) delete root.dataset.themeOverlaySuppressed;
  }, []);

  const syncPreviewAnimations = useCallback((preview: ActiveThemePreview, progress: number) => {
    const clampedProgress = clampProgress(progress);
    preview.progress = clampedProgress;

    preview.animations.forEach(animation => {
      animation.pause();
      animation.currentTime = getAnimationDuration(animation) * clampedProgress;
    });
  }, []);

  const settleThemePreview = useCallback((preview: ActiveThemePreview) => {
    if (!preview.ready || preview.intent === null) return;

    const targetProgress = preview.intent ? 1 : 0;
    const startProgress = preview.progress;
    const distance = Math.abs(targetProgress - startProgress);

    if (distance === 0) {
      preview.transition?.skipTransition();
      clearThemePreview(preview);
      return;
    }

    const duration = Math.max(100, INTERACTIVE_SETTLE_MAX_DURATION * distance);
    const startTime = performance.now();

    const tick = (now: number) => {
      if (activePreviewRef.current?.sequence !== preview.sequence) return;

      const elapsed = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - elapsed, 3);
      syncPreviewAnimations(preview, startProgress + (targetProgress - startProgress) * eased);

      if (elapsed < 1) {
        preview.frame = window.requestAnimationFrame(tick);
        return;
      }

      preview.frame = null;
      preview.transition?.skipTransition();
      clearThemePreview(preview);
    };

    preview.frame = window.requestAnimationFrame(tick);
  }, [clearThemePreview, syncPreviewAnimations]);

  const beginThemeGesture = useCallback(() => {
    if (!themeHydratedRef.current || activeGestureRef.current || activePreviewRef.current) return false;
    if (activeDirectTransitionRef.current !== null) cancelDirectThemeTransition();

    activeGestureRef.current = {
      current: themeRef.current,
      origin: themeRef.current,
    };
    return true;
  }, [cancelDirectThemeTransition]);

  const beginThemePreview = useCallback((nextTheme: SiteTheme, options: ThemePreviewOptions) => {
    const gesture = activeGestureRef.current;
    if (!gesture || activePreviewRef.current || nextTheme === gesture.current) return false;

    const root = document.documentElement;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const preview: ActiveThemePreview = {
      animations: [],
      discrete: reduceMotion || !document.startViewTransition,
      from: gesture.current,
      frame: null,
      intent: null,
      progress: 0,
      ready: false,
      sequence: previewSequenceRef.current + 1,
      to: nextTheme,
      transition: null,
    };

    previewSequenceRef.current = preview.sequence;
    activePreviewRef.current = preview;
    root.dataset.themePreviewing = 'true';
    root.dataset.themePreviewDirection = options.direction > 0 ? 'forward' : 'backward';
    root.dataset.themeOverlaySuppressed = 'true';

    if (preview.discrete) return true;

    try {
      preview.transition = document.startViewTransition(() => {
        if (activePreviewRef.current?.sequence === preview.sequence) {
          applyThemeAttribute(nextTheme);
        }
      });

      void preview.transition.ready.then(() => {
        if (activePreviewRef.current?.sequence !== preview.sequence) return;

        if (preview.intent !== null) {
          applyThemeAttribute(preview.intent ? preview.to : preview.from);
        }

        preview.animations = document.getAnimations().filter(isViewTransitionAnimation);
        if (preview.animations.length === 0) {
          preview.discrete = true;
          preview.ready = true;
          applyThemeAttribute(preview.intent === null
            ? (preview.progress >= 0.5 ? preview.to : preview.from)
            : (preview.intent ? preview.to : preview.from));
          if (preview.intent !== null) clearThemePreview(preview);
          return;
        }
        preview.ready = true;
        syncPreviewAnimations(preview, preview.progress);
        settleThemePreview(preview);
      }).catch(() => {
        if (activePreviewRef.current?.sequence !== preview.sequence) return;
        preview.discrete = true;
        preview.ready = true;
        applyThemeAttribute(preview.intent === null
          ? (preview.progress >= 0.5 ? preview.to : preview.from)
          : (preview.intent ? preview.to : preview.from));
        if (preview.intent !== null) clearThemePreview(preview);
      });
    } catch {
      preview.discrete = true;
      preview.ready = true;
    }

    return true;
  }, [clearThemePreview, settleThemePreview, syncPreviewAnimations]);

  const updateThemePreview = useCallback((progress: number) => {
    const preview = activePreviewRef.current;
    if (!preview || preview.intent !== null) return;

    const clampedProgress = clampProgress(progress);
    preview.progress = clampedProgress;

    if (preview.discrete) {
      applyThemeAttribute(clampedProgress >= 0.5 ? preview.to : preview.from);
      return;
    }

    if (preview.ready) syncPreviewAnimations(preview, clampedProgress);
  }, [syncPreviewAnimations]);

  const advanceThemePreview = useCallback(() => {
    const preview = activePreviewRef.current;
    const gesture = activeGestureRef.current;
    if (!preview || !gesture || preview.intent !== null) return null;

    preview.intent = true;
    if (preview.frame !== null) {
      window.cancelAnimationFrame(preview.frame);
      preview.frame = null;
    }
    if (preview.ready && !preview.discrete) syncPreviewAnimations(preview, 1);

    applyThemeAttribute(preview.to);
    gesture.current = preview.to;
    themeRef.current = preview.to;
    setTheme(preview.to);
    preview.transition?.skipTransition();
    clearThemePreview(preview);
    return preview.to;
  }, [clearThemePreview, syncPreviewAnimations]);

  const cancelThemePreview = useCallback((options: CancelThemePreviewOptions = {}) => {
    const preview = activePreviewRef.current;
    if (!preview || preview.intent !== null) return;

    preview.intent = false;
    applyThemeAttribute(preview.from);

    if (options.immediate || preview.progress <= 0.001 || preview.discrete) {
      if (preview.frame !== null) {
        window.cancelAnimationFrame(preview.frame);
        preview.frame = null;
      }
      if (preview.ready && !preview.discrete) syncPreviewAnimations(preview, 0);
      preview.transition?.skipTransition();
      clearThemePreview(preview);
      return;
    }

    settleThemePreview(preview);
  }, [clearThemePreview, settleThemePreview, syncPreviewAnimations]);

  const finishThemeGesture = useCallback((commit: boolean) => {
    const gesture = activeGestureRef.current;
    if (!gesture) return;

    if (activePreviewRef.current?.intent === null) {
      cancelThemePreview({ immediate: true });
    }

    const nextTheme = commit ? gesture.current : gesture.origin;
    applyThemeAttribute(nextTheme);
    themeRef.current = nextTheme;

    if (commit && nextTheme !== committedThemeRef.current) {
      persistTheme(nextTheme);
      committedThemeRef.current = nextTheme;
    }

    setTheme(nextTheme);
    activeGestureRef.current = null;
    if (!activePreviewRef.current) delete document.documentElement.dataset.themeOverlaySuppressed;
  }, [cancelThemePreview]);

  const changeTheme = useCallback((nextTheme: SiteTheme, options: ChangeThemeOptions = {}) => {
    if (!themeHydratedRef.current || activeGestureRef.current || activePreviewRef.current) return;
    if (activeDirectTransitionRef.current !== null) cancelDirectThemeTransition();
    if (nextTheme === themeRef.current) return;

    const root = document.documentElement;
    if (options.animate === false) root.dataset.themeOverlaySuppressed = 'true';
    else delete root.dataset.themeOverlaySuppressed;
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
      persistTheme(nextTheme);
      themeRef.current = nextTheme;
      committedThemeRef.current = nextTheme;
      flushSync(() => {
        setTheme(nextTheme);
        if (options.animate !== false && !reduceMotion) {
          setTransitionSequence(sequence => sequence + 1);
        }
      });
    };

    if (options.animate === false) {
      commitTheme();
      return;
    }

    if (reduceMotion) {
      const sequence = directTransitionSequenceRef.current + 1;
      directTransitionSequenceRef.current = sequence;
      activeDirectTransitionRef.current = sequence;
      root.dataset.themeReducedTransitioning = 'true';
      void root.offsetWidth;
      commitTheme();
      fallbackTimerRef.current = window.setTimeout(() => {
        if (activeDirectTransitionRef.current !== sequence) return;
        delete root.dataset.themeReducedTransitioning;
        fallbackTimerRef.current = null;
        activeDirectTransitionRef.current = null;
      }, 140);
      return;
    }

    if (!document.startViewTransition) {
      const sequence = directTransitionSequenceRef.current + 1;
      directTransitionSequenceRef.current = sequence;
      activeDirectTransitionRef.current = sequence;

      root.dataset.themeFallbackTransitioning = 'true';
      fallbackFrameRef.current = window.requestAnimationFrame(() => {
        fallbackFrameRef.current = window.requestAnimationFrame(() => {
          if (activeDirectTransitionRef.current !== sequence) return;
          commitTheme();
          fallbackFrameRef.current = null;
          fallbackTimerRef.current = window.setTimeout(() => {
            if (activeDirectTransitionRef.current !== sequence) return;
            delete root.dataset.themeFallbackTransitioning;
            fallbackTimerRef.current = null;
            activeDirectTransitionRef.current = null;
          }, 280);
        });
      });
      return;
    }

    root.style.setProperty('--theme-reveal-radius', `${radius}px`);
    root.dataset.themeTransitioning = 'true';

    const sequence = directTransitionSequenceRef.current + 1;
    directTransitionSequenceRef.current = sequence;
    activeDirectTransitionRef.current = sequence;
    const transition = document.startViewTransition(() => {
      if (activeDirectTransitionRef.current !== sequence) return;
      commitTheme();
    });
    directTransitionRef.current = transition;
    void transition.finished.finally(() => {
      if (activeDirectTransitionRef.current !== sequence) return;
      delete root.dataset.themeTransitioning;
      directTransitionRef.current = null;
      activeDirectTransitionRef.current = null;
    });
  }, [cancelDirectThemeTransition]);

  const value = useMemo(() => ({
    theme,
    changeTheme,
    beginThemeGesture,
    beginThemePreview,
    updateThemePreview,
    advanceThemePreview,
    cancelThemePreview,
    finishThemeGesture,
  }), [
    advanceThemePreview,
    beginThemeGesture,
    beginThemePreview,
    cancelThemePreview,
    changeTheme,
    finishThemeGesture,
    theme,
    updateThemePreview,
  ]);

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
