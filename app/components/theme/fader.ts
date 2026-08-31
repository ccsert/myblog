import { SITE_THEMES, type SiteTheme } from '@/app/lib/theme';

const FADER_THEME_ORDER = SITE_THEMES.map(theme => theme.id);

export const FADER_COMMIT_PROGRESS = 0.55;
export const FADER_FLICK_MIN_PROGRESS = 0.18;
export const FADER_FLICK_VELOCITY = 0.11;
export const FADER_FLICK_MAX_AGE = 80;

export type FaderDirection = -1 | 0 | 1;

export interface FaderSegmentState {
  direction: FaderDirection;
  progress: number;
  targetTheme: SiteTheme;
}

export interface FaderTrackState {
  edgeOffset: number;
  position: number;
  rawPosition: number;
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

export function getFaderTrackState(
  originTheme: SiteTheme,
  startX: number,
  currentX: number,
  stepWidth: number,
): FaderTrackState {
  const originIndex = getFaderThemeIndex(originTheme);
  const safeStepWidth = Math.max(1, stepWidth);
  const rawPosition = originIndex + (currentX - startX) / safeStepWidth;
  const position = clamp(rawPosition, 0, FADER_THEME_ORDER.length - 1);
  const overdrag = (rawPosition - position) * safeStepWidth;

  return {
    edgeOffset: getFaderEdgeOffset(overdrag),
    position,
    rawPosition,
  };
}

export function getFaderSegmentState(
  baseTheme: SiteTheme,
  trackPosition: number,
): FaderSegmentState {
  const baseIndex = getFaderThemeIndex(baseTheme);
  const safePosition = clamp(trackPosition, 0, FADER_THEME_ORDER.length - 1);
  const delta = safePosition - baseIndex;
  const requestedDirection: FaderDirection = delta === 0 ? 0 : delta > 0 ? 1 : -1;
  const targetIndex = clamp(baseIndex + requestedDirection, 0, FADER_THEME_ORDER.length - 1);
  const direction = Math.sign(targetIndex - baseIndex) as FaderDirection;

  return {
    direction,
    progress: direction === 0 ? 0 : clamp(Math.abs(delta), 0, 1),
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
