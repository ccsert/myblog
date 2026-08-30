'use client';

import { useEffect, useRef, ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

type AnimationType = 'fadeUp' | 'maskReveal' | 'parallax' | 'scaleIn';

interface ScrollRevealProps {
  children: ReactNode;
  animation?: AnimationType;
  delay?: number;
  duration?: number;
  className?: string;
}

export default function ScrollReveal({
  children,
  animation = 'fadeUp',
  delay = 0,
  duration = 0.5,
  className = '',
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const element = ref.current;

    // 检查用户是否偏好减少动画
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      gsap.set(element, { opacity: 1, y: 0, scale: 1, clipPath: 'none' });
      return;
    }

    let animationConfig: gsap.TweenVars = {
      duration,
      delay,
      ease: 'expo.out',
    };

    switch (animation) {
      case 'fadeUp':
        gsap.set(element, { opacity: 0, y: 24 });
        animationConfig = {
          ...animationConfig,
          opacity: 1,
          y: 0,
        };
        break;

      case 'maskReveal':
        gsap.set(element, { clipPath: 'inset(100% 0 0 0)' });
        animationConfig = {
          ...animationConfig,
          clipPath: 'inset(0% 0 0 0)',
        };
        break;

      case 'scaleIn':
        gsap.set(element, { opacity: 0, scale: 0.95 });
        animationConfig = {
          ...animationConfig,
          opacity: 1,
          scale: 1,
        };
        break;

      case 'parallax':
        // Parallax 需要特殊处理
        const tween = gsap.to(element, {
          y: -50,
          ease: 'none',
          scrollTrigger: {
            trigger: element,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        });
        return () => {
          tween.scrollTrigger?.kill();
          tween.kill();
        };
    }

    const tween = gsap.to(element, {
      ...animationConfig,
      scrollTrigger: {
        trigger: element,
        start: 'top 80%',
        end: 'top 20%',
        toggleActions: 'play none none reverse',
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [animation, delay, duration]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
