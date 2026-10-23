import type { MetadataRoute } from 'next';
import { PORTFOLIO_PROFILE, SITE_CONFIG } from './lib/content/portfolio';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: PORTFOLIO_PROFILE.metadata.title,
    short_name: SITE_CONFIG.domain,
    description: PORTFOLIO_PROFILE.metadata.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#0A0A0B',
    theme_color: '#0A0A0B',
    lang: 'zh-CN',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  };
}
