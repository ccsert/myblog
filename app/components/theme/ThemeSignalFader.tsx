'use client';

import {
  KeyboardEvent,
  MouseEvent,
  PointerEvent,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import { SITE_THEMES, SiteTheme } from '@/app/lib/theme';
import { useSiteTheme } from '@/app/components/theme/SiteThemeProvider';
import {
  FaderDirection,
  getFaderDragState,
  getFaderEdgeOffset,
  getFaderReleaseVelocity,
  getFaderThemeIndex,
  getThemeAtFaderIndex,
  shouldCommitFaderDrag,
} from './fader';
import styles from './ThemeSignalFader.module.css';

interface ThemeSignalFaderProps {
  compact?: boolean;
}

interface TrackGeometry {
  step: number;
}

interface ActiveDrag {
  direction: FaderDirection;
  lastTime: number;
  lastX: number;
  pointerId: number;
  progress: number;
  startIndex: number;
  startTheme: SiteTheme;
  startX: number;
  targetTheme: SiteTheme;
  velocityX: number;
}

const DRAG_ACTIVATION_DISTANCE = 4;
const HANDLE_SPRING = { type: 'spring' as const, duration: 0.5, bounce: 0.2 };

export default function ThemeSignalFader({ compact = false }: ThemeSignalFaderProps) {
  const {
    theme,
    changeTheme,
    beginThemePreview,
    updateThemePreview,
    finishThemePreview,
  } = useSiteTheme();
  const trackRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const geometryRef = useRef<TrackGeometry>({ step: 1 });
  const dragRef = useRef<ActiveDrag | null>(null);
  const settleAnimationRef = useRef<ReturnType<typeof animate> | null>(null);
  const themeRef = useRef(theme);
  const handleX = useMotionValue(0);
  const handleTransform = useTransform(handleX, value => `translate3d(${value}px, 0, 0)`);
  const currentTheme = SITE_THEMES.find(item => item.id === theme) ?? SITE_THEMES[0];

  const measureTrack = useCallback(() => {
    const track = trackRef.current;
    const handle = handleRef.current;
    if (!track || !handle) return geometryRef.current;

    const travel = Math.max(1, track.clientWidth - handle.getBoundingClientRect().width);
    geometryRef.current = { step: travel / (SITE_THEMES.length - 1) };
    return geometryRef.current;
  }, []);

  const moveHandleToIndex = useCallback((index: number, immediate = false) => {
    const { step } = measureTrack();
    const destination = index * step;
    settleAnimationRef.current?.stop();

    if (immediate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      handleX.set(destination);
      return;
    }

    if (Math.abs(handleX.get() - destination) < 0.5) {
      handleX.set(destination);
      return;
    }

    settleAnimationRef.current = animate(handleX, destination, HANDLE_SPRING);
  }, [handleX, measureTrack]);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const syncGeometry = () => {
      const { step } = measureTrack();
      if (!dragRef.current) handleX.set(getFaderThemeIndex(themeRef.current) * step);
    };
    const observer = new ResizeObserver(syncGeometry);
    observer.observe(track);
    syncGeometry();

    return () => observer.disconnect();
  }, [handleX, measureTrack]);

  useEffect(() => {
    if (!dragRef.current) moveHandleToIndex(getFaderThemeIndex(theme));
  }, [moveHandleToIndex, theme]);

  const cancelDrag = useCallback((immediate = false) => {
    const drag = dragRef.current;
    if (!drag) return;

    if (drag.direction !== 0) finishThemePreview(false);
    moveHandleToIndex(drag.startIndex, immediate);
    dragRef.current = null;
    if (handleRef.current) {
      handleRef.current.dataset.dragging = 'false';
      if (handleRef.current.hasPointerCapture(drag.pointerId)) {
        handleRef.current.releasePointerCapture(drag.pointerId);
      }
    }
  }, [finishThemePreview, moveHandleToIndex]);

  useEffect(() => () => {
    settleAnimationRef.current?.stop();
    cancelDrag(true);
  }, [cancelDrag]);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || dragRef.current) return;

    settleAnimationRef.current?.stop();
    measureTrack();
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.dataset.dragging = 'true';
    dragRef.current = {
      direction: 0,
      lastTime: event.timeStamp,
      lastX: event.clientX,
      pointerId: event.pointerId,
      progress: 0,
      startIndex: getFaderThemeIndex(theme),
      startTheme: theme,
      startX: event.clientX,
      targetTheme: theme,
      velocityX: 0,
    };
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const delta = event.clientX - drag.startX;
    const dragState = getFaderDragState(
      drag.startTheme,
      drag.startX,
      event.clientX,
      geometryRef.current.step,
    );
    const crossedPastOrigin = drag.direction !== 0
      && dragState.direction !== 0
      && dragState.direction !== drag.direction
      && Math.abs(delta) >= DRAG_ACTIVATION_DISTANCE;

    if (crossedPastOrigin) {
      updateThemePreview(0);
      finishThemePreview(false);
      drag.direction = 0;
      drag.progress = 0;
      drag.targetTheme = drag.startTheme;
    }

    if (drag.direction === 0 && Math.abs(delta) >= DRAG_ACTIVATION_DISTANCE) {
      if (dragState.targetTheme !== drag.startTheme
        && dragState.direction !== 0
        && beginThemePreview(dragState.targetTheme, { direction: dragState.direction })) {
        drag.direction = dragState.direction;
        drag.targetTheme = dragState.targetTheme;
      } else if (dragState.targetTheme === drag.startTheme) {
        handleX.set(drag.startIndex * geometryRef.current.step + getFaderEdgeOffset(delta));
      }
    }

    if (drag.direction === 0) {
      if (Math.abs(delta) >= DRAG_ACTIVATION_DISTANCE) {
        handleX.set(drag.startIndex * geometryRef.current.step + getFaderEdgeOffset(delta));
      }
      return;
    }

    const elapsed = Math.max(1, event.timeStamp - drag.lastTime);
    drag.velocityX = (event.clientX - drag.lastX) / elapsed;
    drag.lastX = event.clientX;
    drag.lastTime = event.timeStamp;
    drag.progress = dragState.direction === drag.direction ? dragState.progress : 0;

    handleX.set((drag.startIndex + drag.direction * drag.progress) * geometryRef.current.step);
    updateThemePreview(drag.progress);
  };

  const finishDrag = (event: PointerEvent<HTMLDivElement>, cancelled = false) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const releaseVelocity = getFaderReleaseVelocity(drag.velocityX, drag.lastTime, event.timeStamp);
    const commit = !cancelled && shouldCommitFaderDrag(drag.progress, releaseVelocity, drag.direction);
    if (drag.direction !== 0) finishThemePreview(commit);
    moveHandleToIndex(commit ? getFaderThemeIndex(drag.targetTheme) : drag.startIndex);
    dragRef.current = null;
    event.currentTarget.dataset.dragging = 'false';
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = getFaderThemeIndex(theme);
    let targetIndex: number | null = null;

    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') targetIndex = currentIndex - 1;
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') targetIndex = currentIndex + 1;
    if (event.key === 'Home') targetIndex = 0;
    if (event.key === 'End') targetIndex = SITE_THEMES.length - 1;
    if (event.key === 'Escape' && dragRef.current) {
      event.preventDefault();
      cancelDrag();
      return;
    }
    if (targetIndex === null) return;

    event.preventDefault();
    const targetTheme = getThemeAtFaderIndex(targetIndex);
    if (targetTheme === theme) return;
    moveHandleToIndex(getFaderThemeIndex(targetTheme), true);
    changeTheme(targetTheme, { animate: false });
  };

  const handleDetentClick = (event: MouseEvent<HTMLButtonElement>, targetTheme: SiteTheme) => {
    if (dragRef.current || targetTheme === theme) return;

    const rect = event.currentTarget.getBoundingClientRect();
    changeTheme(targetTheme, {
      origin: {
        x: event.clientX || rect.left + rect.width / 2,
        y: event.clientY || rect.top + rect.height / 2,
      },
    });
  };

  return (
    <div
      className={`${styles.fader} ${compact ? styles.compact : ''}`}
      data-theme-control
      aria-label="主题信号推杆"
      role="group"
    >
      <span className={styles.readout} aria-hidden="true">
        <span className={styles.eyebrow}>THEME</span>
        <span className={styles.value}>{currentTheme.shortLabel}</span>
      </span>

      <div ref={trackRef} className={styles.track}>
        <span className={styles.railGlow} aria-hidden="true" />
        <span className={styles.rail} aria-hidden="true" />
        <span className={styles.detents}>
          {SITE_THEMES.map(item => (
            <button
              key={item.id}
              type="button"
              className={styles.detent}
              data-active={item.id === theme}
              aria-label={`切换到${item.label}主题`}
              aria-pressed={item.id === theme}
              title={item.label}
              onClick={event => handleDetentClick(event, item.id)}
            />
          ))}
        </span>
        <motion.div
          ref={handleRef}
          className={styles.handle}
          data-cursor="drag"
          data-dragging="false"
          role="slider"
          tabIndex={0}
          aria-label="拖动或使用方向键切换主题"
          aria-valuemin={0}
          aria-valuemax={SITE_THEMES.length - 1}
          aria-valuenow={getFaderThemeIndex(theme)}
          aria-valuetext={currentTheme.label}
          style={{ transform: handleTransform }}
          onKeyDown={handleKeyDown}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={event => finishDrag(event)}
          onPointerCancel={event => finishDrag(event, true)}
          onLostPointerCapture={event => {
            if (dragRef.current?.pointerId === event.pointerId) cancelDrag();
          }}
        />
      </div>
    </div>
  );
}
