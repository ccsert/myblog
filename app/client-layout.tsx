'use client';

import { ReactNode } from 'react';
import Cursor from '@/app/components/cursor/Cursor';
import EasterEggs from '@/app/components/EasterEggs';
import Navigation from '@/app/components/Navigation';
import SiteThemeProvider from '@/app/components/theme/SiteThemeProvider';

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <SiteThemeProvider>
      <Cursor />
      <EasterEggs />
      <Navigation />
      {children}
    </SiteThemeProvider>
  );
}
