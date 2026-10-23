import type { MetadataRoute } from 'next';
import { PORTFOLIO_PROJECTS, PUBLIC_EVIDENCE_CHECKED_AT, SITE_CONFIG } from './lib/content/portfolio';

// Content changes only when portfolio facts are re-verified or a project ships,
// so derive lastModified from those dates instead of the build time.
const latestProjectUpdate = PORTFOLIO_PROJECTS
  .map(project => project.updated)
  .reduce((latest, date) => (date > latest ? date : latest), PUBLIC_EVIDENCE_CHECKED_AT);

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_CONFIG.url,
      lastModified: latestProjectUpdate,
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${SITE_CONFIG.url}/archive`,
      lastModified: latestProjectUpdate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];
}
