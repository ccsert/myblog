const RETURN_KEY = 'playground-home-return-v1';
const RESTORE_KEY = 'playground-restore-home';
const ENTER_KEY = 'playground-enter-from-home';

type HomePosition = { top: number; hash: string; link: string | null };
let enteringFromHome = false;
let cancelCurrentScroll: (() => void) | null = null;

export function cancelHomeScroll() { cancelCurrentScroll?.(); }

function readHomePosition(): HomePosition | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(RETURN_KEY) || 'null');
    if (value && Number.isFinite(value.top) && value.top >= 0 && typeof value.hash === 'string' && (!value.hash || value.hash.startsWith('#')) && (value.link === null || typeof value.link === 'string')) return value;
  } catch { /* Navigation works without session storage. */ }
  return null;
}

export function rememberHomePosition(link: string | null = null) {
  if (window.location.pathname !== '/') return;
  enteringFromHome = true;
  try {
    sessionStorage.setItem(RETURN_KEY, JSON.stringify({ top: window.scrollY, hash: window.location.hash, link }));
    sessionStorage.setItem(ENTER_KEY, 'true');
  } catch { /* Optional continuity. */ }
}

export function enterPlayground() {
  try {
    enteringFromHome = enteringFromHome || Boolean(sessionStorage.getItem(ENTER_KEY));
    sessionStorage.removeItem(ENTER_KEY);
  } catch { /* Keep native navigation when storage is unavailable. */ }
  if (enteringFromHome) window.scrollTo({ top: 0, behavior: 'instant' });
  enteringFromHome = false;
}

export function requestHomeRestore() {
  if (!readHomePosition()) return false;
  try { sessionStorage.setItem(RESTORE_KEY, 'true'); return true; } catch { return false; }
}

export function restoreHomePosition() {
  try {
    if (!sessionStorage.getItem(RESTORE_KEY)) return;
    sessionStorage.removeItem(RESTORE_KEY);
    const position = readHomePosition();
    if (!position) return;
    window.history.replaceState(window.history.state, '', `/${position.hash}`);
    window.scrollTo({ top: position.top, behavior: 'instant' });
    const link = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-archive-link]')).find(node => node.dataset.archiveLink === position.link);
    link?.focus({ preventScroll: true });
  } catch { /* Keep the default homepage entry if storage is unavailable. */ }
}

export function scrollToHomeSection(id: string, keyboard = false) {
  const section = document.getElementById(id);
  if (!section) return;
  cancelHomeScroll();
  const instant = keyboard || document.documentElement.dataset.homeInput === 'keyboard' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  section.scrollIntoView({ behavior: instant ? 'instant' : 'smooth', block: 'start' });
  if (instant) {
    if (!section.hasAttribute('tabindex')) section.setAttribute('tabindex', '-1');
    section.focus({ preventScroll: true });
  } else {
    // Native momentum remains in charge; an anchor scroll yields to the next input.
    const inputs = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finish = () => {
      inputs.forEach(type => window.removeEventListener(type, interrupt, true));
      window.removeEventListener('scrollend', finish);
      preference.removeEventListener('change', interrupt);
      window.clearTimeout(timeout);
      cancelCurrentScroll = null;
    };
    const interrupt = () => {
      window.scrollTo({ top: window.scrollY, behavior: 'instant' });
      finish();
    };
    const timeout = window.setTimeout(finish, 1800);
    cancelCurrentScroll = interrupt;
    inputs.forEach(type => window.addEventListener(type, interrupt, { capture: true, passive: true }));
    preference.addEventListener('change', interrupt);
    window.addEventListener('scrollend', finish, { once: true });
  }
}
