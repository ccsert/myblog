'use client';

import { createRef, useEffect, useMemo, useRef, useState } from 'react';
import AnimatedBeam from '@/app/components/ui/AnimatedBeam';
import Link from 'next/link';
import { ArrowUpRight, Pause, Play } from 'lucide-react';
import { KNOWLEDGE_SIGNALS, PORTFOLIO_PROJECTS } from '@/app/lib/content/portfolio';
import styles from './SignalObservatory.module.css';

const project = PORTFOLIO_PROJECTS.find(item => item.slug === 'artifact-gateway')!;
const note = KNOWLEDGE_SIGNALS[0];
const SIGNALS = [
  { label: '构建', code: 'BUILD', title: project.title, hint: '一个入口，连接原生协议与不可变字节。', path: `/home/visitor/projects/${project.slug}.md` },
  { label: '思考', code: 'THINK', title: note.title, hint: '如果知识可以像代码一样持续演进？', path: `/home/visitor/knowledge/${note.slug}.md` },
  { label: '动手', code: 'PLAY', title: '个人实验场', hint: '四件作品，各有一个可以直接上手的小实验。', path: null },
] as const;

export default function SignalObservatory({ onOpenDocument }: { onOpenDocument: (path: string) => void }) {
  const [selected, setSelected] = useState(0);
  const [paused, setPaused] = useState(false);
  const [pulse, setPulse] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const instrumentRef = useRef<HTMLDivElement>(null);
  const channelRefs = useMemo(() => SIGNALS.map(() => createRef<HTMLButtonElement>()), []);
  const signal = SIGNALS[selected];

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let inView = false;
    const update = () => {
      const running = inView && !document.hidden;
      root.dataset.running = String(running);
      if (!running) setPulse(0);
    };
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      update();
    });
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const cancelPulse = () => setPulse(0);
    observer.observe(root);
    document.addEventListener('visibilitychange', update);
    preference.addEventListener('change', cancelPulse);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', update);
      preference.removeEventListener('change', cancelPulse);
    };
  }, []);

  return (
    <div ref={rootRef} className={styles.observatory} data-signal={selected} data-paused={paused} data-running="false" onKeyDownCapture={() => setPulse(0)}>
      <AnimatedBeam containerRef={rootRef} fromRef={instrumentRef} toRef={channelRefs[selected]} pulse={pulse} paused={paused} onComplete={completed => setPulse(current => current === completed ? 0 : current)} />
      <div ref={instrumentRef} className={styles.instrument} aria-hidden="true">
        <span className={styles.coordinate}>SIG / 0{selected + 1}</span>
        <svg viewBox="0 0 280 260" className={styles.scope} fill="none">
          <path className={styles.crosshair} d="M140 5v250M10 130h260" />
          <circle className={styles.boundary} cx="140" cy="130" r="116" strokeDasharray="1 8" />
          <circle className={styles.boundary} cx="140" cy="130" r="105" />
          <g className={styles.sphere}>
            {[26, 51, 73, 88].map(radius => <ellipse key={`v${radius}`} cx="140" cy="130" rx={radius} ry="90" />)}
            {[22, 45, 67, 85].map(radius => <ellipse key={`h${radius}`} cx="140" cy="130" rx="90" ry={radius} />)}
            <circle cx="140" cy="130" r="90" />
          </g>
          <g className={styles.orbitAngle}>
            <ellipse className={styles.orbit} cx="140" cy="130" rx="132" ry="43" />
            <path className={styles.orbitBright} d="M8 130a132 43 0 0 0 264 0" />
            <circle className={styles.satellite} cx="272" cy="130" r="4" />
            <circle className={styles.satelliteHalo} cx="272" cy="130" r="9" />
          </g>
          <path className={styles.core} d="M132 130h16m-8-8v16" />
        </svg>
        <span className={styles.instrumentCaption}>CURIOSITY IS THE SIGNAL</span>
      </div>
      <div className={styles.readout}>
        <div className={styles.readoutMeta}><span className={styles.dot} /> OPEN FREQUENCY</div>
        <div className={styles.channels} role="group" aria-label="选择探索信号">
          {SIGNALS.map((item, index) => (
            <button type="button" key={item.code} ref={channelRefs[index]} aria-pressed={selected === index} onClick={event => {
              setSelected(index);
              const canAnimate = event.detail > 0 && !paused && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
              setPulse(canAnimate ? value => value + 1 : 0);
            }}>
              <span>0{index + 1}</span>{item.label}
            </button>
          ))}
        </div>
        <div className={styles.signalDetail} aria-live="polite" aria-atomic="true">
          <span className={styles.signalCode}>{signal.code} / SELECTED SIGNAL</span>
          <h2>{signal.title}</h2>
          <p>{signal.hint}</p>
        </div>
        {signal.path ? (
          <button type="button" className={styles.openSignal} onClick={() => onOpenDocument(signal.path!)}>
            读取这份档案 <ArrowUpRight size={14} aria-hidden="true" />
          </button>
        ) : (
          <Link className={styles.openSignal} href="/archive">进入个人实验场 <ArrowUpRight size={14} aria-hidden="true" /></Link>
        )}
      </div>
      <button type="button" className={styles.motionToggle} aria-label={paused ? '播放轨道动画' : '暂停轨道动画'} aria-pressed={paused} onClick={() => { setPulse(0); setPaused(value => !value); }}>
        {paused ? <Play size={11} aria-hidden="true" /> : <Pause size={11} aria-hidden="true" />}
      </button>
    </div>
  );
}
