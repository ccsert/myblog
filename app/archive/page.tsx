import type { Metadata } from 'next';
import Playground from '@/app/components/archive/playground/Playground';
import { SITE_CONFIG } from '@/app/lib/content/portfolio';

const title = `别只看，动手玩。· 个人实验场｜${SITE_CONFIG.domain}`;
const description = '给终端换个主题，让文档跨越语言，跟随一次制品请求，展开一条代码审查。用四个交互示例，认识 ccsert 的开源作品。';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/archive' },
  openGraph: {
    title,
    description,
    url: '/archive',
    siteName: SITE_CONFIG.domain,
    locale: 'zh_CN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
};

export default function ArchivePage() {
  return <Playground />;
}
