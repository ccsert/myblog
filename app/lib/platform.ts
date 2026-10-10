'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

function isApplePlatform(): boolean {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  const platform = nav.userAgentData?.platform || nav.platform || nav.userAgent;
  return /mac|iphone|ipad|ipod/i.test(platform);
}

/**
 * Label for the command-palette shortcut: "⌘K" on Apple platforms, "Ctrl K" elsewhere.
 * The server render uses "⌘K"; the client corrects it right after hydration.
 */
export function usePaletteShortcut(): string {
  return useSyncExternalStore(
    subscribe,
    () => (isApplePlatform() ? '⌘K' : 'Ctrl K'),
    () => '⌘K',
  );
}
