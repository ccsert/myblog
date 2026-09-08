'use client';

import { useSyncExternalStore } from 'react';

const selections = new Map<string, string>();
const EVENT = 'homepage-selection';
const subscribe = (notify: () => void) => {
  window.addEventListener(EVENT, notify);
  window.addEventListener('storage', notify);
  return () => { window.removeEventListener(EVENT, notify); window.removeEventListener('storage', notify); };
};

export function useSessionSelection(key: string, fallback: string, allowed: readonly string[]) {
  const value = useSyncExternalStore(subscribe, () => {
    let saved = selections.get(key);
    try { saved = sessionStorage.getItem(key) ?? saved; } catch { /* In-memory selection still works. */ }
    return saved !== undefined && allowed.includes(saved) ? saved : fallback;
  }, () => fallback);
  const select = (next: string) => {
    if (!allowed.includes(next)) return;
    selections.set(key, next);
    try { sessionStorage.setItem(key, next); } catch { /* Optional persistence. */ }
    window.dispatchEvent(new Event(EVENT));
  };
  return [value, select] as const;
}
