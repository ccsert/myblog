import { SITE_THEMES, type SiteTheme } from '@/app/lib/theme';

const FADER_THEME_ORDER = SITE_THEMES.map(theme => theme.id);

export const FADER_COMMIT_PROGRESS = 0.55;
export const FADER_FLICK_MIN_PROGRESS = 0.18;
export const FADER_FLICK_VELOCITY = 0.11;
export const FADER_FLICK_MAX_AGE = 80;

export type FaderDirection = -1 | 0 | 1;

export interface FaderDragState {
  direction: FaderDirection;
  progress: number;
  position: number;
  targetTheme: SiteTheme;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function getThemeAtFaderIndex(index: number): SiteTheme {
  const safeIndex = clamp(Math.round(index), 0, FADER_THEME_ORDER.length - 1);
  return FADER_THEME_ORDER[safeIndex];
}

export function getFaderThemeIndex(theme: SiteTheme) {
  return FADER_THEME_ORDER.indexOf(theme);
}

export function getFaderEdgeOffset(delta: number, activationDistance = 4, maxOffset = 8) {
  const excess = Math.max(0, Math.abs(delta) - activationDistance);
  if (excess === 0) return 0;
  return Math.sign(delta) * Math.min(maxOffset, Math.sqrt(excess) * 2);
}

export function getFaderDragState(
  theme: SiteTheme,
  startX: number,
  currentX: number,
  stepWidth: number,
): FaderDragState {
  const currentIndex = getFaderThemeIndex(theme);
  const safeStepWidth = Math.max(1, stepWidth);
  const delta = currentX - startX;
  const requestedDirection: FaderDirection = delta === 0 ? 0 : delta > 0 ? 1 : -1;
  const targetIndex = clamp(currentIndex + requestedDirection, 0, FADER_THEME_ORDER.length - 1);
  const direction = Math.sign(targetIndex - currentIndex) as FaderDirection;
  const progress = direction === 0 ? 0 : clamp(Math.abs(delta) / safeStepWidth, 0, 1);

  return {
    direction,
    progress,
    position: currentIndex + direction * progress,
    targetTheme: getThemeAtFaderIndex(targetIndex),
  };
}

export function shouldCommitFaderDrag(
  progress: number,
  velocityX: number,
  direction: FaderDirection,
) {
  if (direction === 0) return false;
  if (progress >= FADER_COMMIT_PROGRESS) return true;

  const isFlickingTowardTarget = Math.sign(velocityX) === direction
    && Math.abs(velocityX) >= FADER_FLICK_VELOCITY;

  return progress >= FADER_FLICK_MIN_PROGRESS && isFlickingTowardTarget;
}

export function getFaderReleaseVelocity(
  velocityX: number,
  velocitySampleTime: number,
  releaseTime: number,
) {
  return releaseTime - velocitySampleTime <= FADER_FLICK_MAX_AGE ? velocityX : 0;
}
