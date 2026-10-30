'use client';

// Pauses looping decorative animations while they are off screen. Elements
// opt in with `data-motion`; the attribute flips to `paused` outside the
// viewport and CSS in globals.css stops the element and its direct children.
// This matters most for loops that repaint every frame (Border Beam's
// registered angle, the Shimmer sweep), which otherwise keep the main thread busy.
import { useEffect } from 'react';

export default function OffscreenMotion() {
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) (entry.target as HTMLElement).dataset.motion = entry.isIntersecting ? 'running' : 'paused';
    }, { rootMargin: '120px 0px' });
    const watch = () => document.querySelectorAll('[data-motion]').forEach(element => observer.observe(element));
    watch();
    // Sections that mount later (expanded panels, swapped notes) join in too.
    const mutations = new MutationObserver(watch);
    mutations.observe(document.body, { childList: true, subtree: true });
    return () => { observer.disconnect(); mutations.disconnect(); };
  }, []);

  return null;
}
