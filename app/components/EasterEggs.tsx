'use client';

import { useEffect } from 'react';
import { SITE_CONFIG } from '@/app/lib/content/portfolio';

export default function EasterEggs() {
  useEffect(() => {
    // Konami Code: ↑↑↓↓←→←→BA
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let konamiIndex = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === konamiCode[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === konamiCode.length) {
          activateKonamiCode();
          konamiIndex = 0;
        }
      } else {
        konamiIndex = 0;
      }
    };

    const activateKonamiCode = () => {
      // 屏幕闪烁
      document.body.style.animation = 'flash 0.5s';
      setTimeout(() => {
        document.body.style.animation = '';
      }, 500);

      // 显示隐藏消息
      const message = document.createElement('div');
      message.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-accent text-bg px-8 py-4 rounded-lg font-mono text-lg font-bold z-[10001] shadow-lg';
      message.textContent = '🎉 You found the secret! Matrix theme unlocked!';
      document.body.appendChild(message);

      // 3 秒后移除消息
      setTimeout(() => {
        message.remove();
      }, 3000);

      // 切换 Matrix 主题
      document.body.classList.toggle('matrix-theme');

      // 控制台消息
      console.log('%c🎉 Konami Code Activated!', 'font-size: 20px; color: #00FF88; font-weight: bold;');
      console.log('%cYou found the secret! Matrix theme unlocked!', 'font-size: 14px; color: #00D9FF;');
    };

    // 控制台欢迎消息
    console.log('%c👋 Hello, curious developer!', 'font-size: 20px; color: #00FF88; font-weight: bold;');
    console.log('%cYou found the console. Here\'s a secret:', 'font-size: 14px; color: #A1A1AA;');
    console.log('%cTry the Konami Code: ↑↑↓↓←→←→BA', 'font-size: 14px; color: #00D9FF;');
    console.log('%cOr type "matrix" in the terminal.', 'font-size: 14px; color: #00D9FF;');
    console.log(`%c\nWant to work together? Email me: ${SITE_CONFIG.email}`, 'font-size: 12px; color: #52525B;');

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return null;
}
