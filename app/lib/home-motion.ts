/**
 * Homepage pointer spotlight. Scroll reveals are pure CSS scroll-driven
 * animations (see `[data-reveal]` in app/globals.css).
 */

/** Tracks the pointer inside `[data-spotlight]` elements as `--spot-x` / `--spot-y`. */
export function installSpotlight(root: HTMLElement): () => void {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return () => {};

  let frame = 0;
  let latest: PointerEvent | null = null;

  const update = () => {
    frame = 0;
    const event = latest;
    if (!event) return;
    // Nested spotlights (a card inside the hero) all follow the same pointer.
    let target = (event.target as Element | null)?.closest<HTMLElement>('[data-spotlight]');
    while (target) {
      const rect = target.getBoundingClientRect();
      target.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
      target.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
      target = target.parentElement?.closest<HTMLElement>('[data-spotlight]');
    }
  };

  const onMove = (event: PointerEvent) => {
    latest = event;
    if (!frame) frame = requestAnimationFrame(update);
  };

  root.addEventListener('pointermove', onMove, { passive: true });
  return () => {
    cancelAnimationFrame(frame);
    root.removeEventListener('pointermove', onMove);
  };
}
