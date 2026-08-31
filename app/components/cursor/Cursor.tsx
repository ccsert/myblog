'use client';

import { useEffect, useRef, useState } from 'react';

type CursorState = 'default' | 'link' | 'button' | 'drag' | 'text';

export default function Cursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<CursorState>('default');
  const [label, setLabel] = useState('');
  const [hasMoved, setHasMoved] = useState(false);
  const hasMovedRef = useRef(false);
  const position = useRef({ x: 0, y: 0 });
  const targetPosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const documentElement = document.documentElement;
    documentElement.dataset.customCursor = 'true';

    const pointerQuery = window.matchMedia('(min-width: 768px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    let animationFrameId = 0;
    let isActive = false;

    const handleMouseMove = (e: MouseEvent) => {
      if (!hasMovedRef.current) {
        hasMovedRef.current = true;
        setHasMoved(true);
      }

      targetPosition.current = { x: e.clientX, y: e.clientY };

      // 检测悬停元素
      const target = e.target as HTMLElement;

      if (target.closest('a')) {
        setState('link');
        setLabel('→');
      } else if (target.tagName === 'BUTTON' || target.closest('button')) {
        setState('button');
        setLabel('View');
      } else if (target.closest('[data-cursor="drag"]')) {
        setState('drag');
        setLabel('Drag');
      } else if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        setState('text');
        setLabel('');
      } else {
        setState('default');
        setLabel('');
      }
    };

    const animate = () => {
      // Lerp 平滑跟随
      position.current.x += (targetPosition.current.x - position.current.x) * 0.15;
      position.current.y += (targetPosition.current.y - position.current.y) * 0.15;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${position.current.x}px, ${position.current.y}px, 0) translate(-50%, -50%)`;
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    const start = () => {
      if (isActive || !pointerQuery.matches) return;
      isActive = true;
      window.addEventListener('mousemove', handleMouseMove);
      animationFrameId = requestAnimationFrame(animate);
    };

    const stop = (resetState: boolean) => {
      if (!isActive) return;
      isActive = false;
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
      animationFrameId = 0;

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
