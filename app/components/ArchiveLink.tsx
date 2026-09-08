'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ComponentProps } from 'react';
import { rememberHomePosition, requestHomeRestore } from '@/app/lib/home-navigation';

type Props = Omit<ComponentProps<typeof Link>, 'onNavigate'>;

export function ArchiveLink({ href, id, ...props }: Props) {
  const key = id ?? String(href);
  return <Link scroll={false} {...props} id={id} href={href} data-archive-link={key} onNavigate={() => rememberHomePosition(key)} />;
}

export function ReturnHomeLink(props: Omit<Props, 'href'>) {
  const router = useRouter();
  return <Link {...props} href="/" onNavigate={event => {
    if (!requestHomeRestore()) return;
    event.preventDefault();
    router.push('/', { scroll: false });
  }} />;
}
