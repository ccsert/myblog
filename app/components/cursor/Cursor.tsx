'use client';

import { useEffect, useRef, useState } from 'react';
import { syncCursorPosition } from './position';

type CursorState = 'default' | 'link' | 'button' | 'drag' | 'text';

export default function Cursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<CursorState>('default');
  const [label, setLabel] = useState('');
  const [hasMoved, setHasMoved] = useState(false);
  const hasMovedRef = useRef(false);

  useEffect(() => {
    const documentElement = document.documentElement;
    documentElement.dataset.customCursor = 'true';

    const pointerQuery = window.matchMedia('(min-width: 768px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    let isActive = false;

    const handlePointerMove = (event: PointerEvent) => {
      if (!hasMovedRef.current) {
        hasMovedRef.current = true;
        setHasMoved(true);
      }

      syncCursorPosition(cursorRef.current, event);

      // 检测悬停元素
      const target = event.target instanceof Element ? event.target : null;

      if (target?.closest('a')) {
        setState('link');
        setLabel('→');
      } else if (target?.closest('button')) {
        setState('button');
        setLabel('View');
      } else if (target?.closest('[data-cursor="drag"]')) {
        setState('drag');
        setLabel('Drag');
      } else if (target?.matches('input, textarea, [contenteditable="true"]')) {
        setState('text');
        setLabel('');
      } else {
        setState('default');
        setLabel('');
      }
    };

    const start = () => {
      if (isActive || !pointerQuery.matches) return;
      isActive = true;
      window.addEventListener('pointermove', handlePointerMove, { passive: true });
    };

    const stop = (resetState: boolean) => {
      if (!isActive) return;
      isActive = false;
      window.removeEventListener('pointermove', handlePointerMove);

      if (resetState) {
        hasMovedRef.current = false;
        setHasMoved(false);
        setState('default');
        setLabel('');
      }
    };

    const handlePointerChange = () => {
      if (pointerQuery.matches) start();
      else stop(true);
    };

    pointerQuery.addEventListener('change', handlePointerChange);
    start();

    return () => {
      delete documentElement.dataset.customCursor;
      pointerQuery.removeEventListener('change', handlePointerChange);
      stop(false);
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      className={`
        custom-cursor fixed top-0 left-0 pointer-events-none z-[10000]
        transition-[width,height,opacity] duration-150 ease-out
        ${state === 'default' ? 'w-2 h-2' : ''}
        ${state === 'link' ? 'w-8 h-8' : ''}
        ${state === 'button' ? 'w-16 h-8' : ''}
        ${state === 'drag' ? 'w-12 h-12' : ''}
        ${state === 'text' ? 'w-0.5 h-5' : ''}
        ${!hasMoved ? 'opacity-0' : 'opacity-100'}
      `}
      data-state={state}
      style={{ transform: 'translate(-50%, -50%)' }}
    >
      <div
        className={`
          w-full h-full flex items-center justify-center
          rounded-full border border-accent
          transition-all duration-150
          ${state === 'default' ? 'bg-accent' : 'bg-transparent'}
          ${state === 'link' ? 'bg-accent-10' : ''}
          ${state === 'button' ? 'bg-accent-10 rounded-full' : ''}
          ${state === 'drag' ? 'bg-accent-10' : ''}
          ${state === 'text' ? 'bg-accent border-0 rounded-none' : ''}
        `}
      >
        {label && (
          <span className="text-xs font-mono text-accent whitespace-nowrap">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
