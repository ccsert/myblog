'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Cursor from '@/app/components/cursor/Cursor';
import EasterEggs from '@/app/components/EasterEggs';
import Navigation from '@/app/components/Navigation';
import SiteThemeProvider from '@/app/components/theme/SiteThemeProvider';

export default function ClientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isImmersiveArchive = pathname.startsWith('/archive');

  return (
    <SiteThemeProvider>
      {isImmersiveArchive ? null : (
        <>
          <Cursor />
          <EasterEggs />
          <Navigation />
        </>
      )}
      {children}
    </SiteThemeProvider>
  );
}
