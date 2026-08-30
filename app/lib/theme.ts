export const SITE_THEMES = [
  { id: 'green', label: 'Signal green', shortLabel: 'Signal', accent: '#00FF88' },
  { id: 'cyan', label: 'Telemetry cyan', shortLabel: 'Cyan', accent: '#00D9FF' },
  { id: 'amber', label: 'Operations amber', shortLabel: 'Amber', accent: '#FFB800' },
  { id: 'light', label: 'Paper light', shortLabel: 'Light', accent: '#087F5B' },
] as const;

export type SiteTheme = (typeof SITE_THEMES)[number]['id'];

export function isSiteTheme(value: string): value is SiteTheme {
  return SITE_THEMES.some(theme => theme.id === value);
}

export function getNextSiteTheme(theme: SiteTheme): SiteTheme {
  const currentIndex = SITE_THEMES.findIndex(item => item.id === theme);
  return SITE_THEMES[(currentIndex + 1) % SITE_THEMES.length].id;
}
