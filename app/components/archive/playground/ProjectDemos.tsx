'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, GitBranch, MessageSquare, RotateCcw } from 'lucide-react';
import styles from './Playground.module.css';

const THEMES = ['Pure', 'Agnoster', 'Roboto'] as const;
type TerminalTheme = typeof THEMES[number];

function Prompt({ theme, command = false }: { theme: TerminalTheme; command?: boolean }) {
  return <div className={styles.prompt} data-theme={theme}>
    {theme === 'Pure' ? <><span className={styles.promptPath}>~/playground</span><span className={styles.promptBranch}>main</span><span className={styles.promptSymbol}>❯</span></>
      : <><span className={styles.promptUser}>ccsert<span>@playground</span></span><span className={styles.promptPath}>~/playground</span><span className={styles.promptBranch}><GitBranch size={12} aria-hidden="true" /> main</span></>}
    {command ? <span className={styles.command}>git status</span> : <span className={styles.caret} aria-hidden="true" />}
  </div>;
}

export function TerminalDemo() {
  const [theme, setTheme] = useState<TerminalTheme>('Agnoster');
  return <div className={styles.terminalDemo}>
    <div className={styles.terminal} data-theme={theme} role="region" tabIndex={0} aria-label={`${theme} 终端主题示意`}>
      <Prompt theme={theme} command />
      <div className={styles.terminalOutput}>
        <p>On branch main<br />Your branch is up to date with &apos;origin/main&apos;.</p>
        <p>Changes not staged for commit:<br /><span className={styles.terminalHint}>  (use &quot;git add&quot; to update what will be committed)</span></p>
        <p className={styles.modified}>  modified:   README.md<br />  modified:   src/index.ts</p>
        <p>no changes added to commit</p>
      </div>
      <Prompt theme={theme} />
    </div>
    <div className={styles.themeControls}>
      <p>切换主题，立即预览<span>主题示意</span></p>
      <div className={styles.themeChoices} role="group" aria-label="终端主题">
        {THEMES.map(name => <button type="button" key={name} aria-pressed={theme === name} onClick={() => setTheme(name)}>
          <span className={styles.themeSwatch} data-theme={name}>{theme === name && <Check size={18} strokeWidth={2.5} aria-hidden="true" />}</span>{name}
        </button>)}
      </div>
      <span className={styles.srOnly} role="status">当前主题：{theme}</span>
    </div>
  </div>;
}

export function DocumentTeaser() {
  return <div className={styles.documentTeaser}>
    <h3>分布式系统的<br />重试策略</h3>
    <p lang="en">Retry Strategies<br />in Distributed Systems</p>
    <span>READING SAMPLE</span>
    <p>在不确定的网络条件下，设计可观察、可预测的重试。</p>
    <p lang="en">Design observable, predictable retries under uncertain network conditions.</p>
  </div>;
}

const SENTENCES = [
  { en: 'Failure is normal in distributed systems. A retry can recover a request — or amplify an outage.', zh: '失败是分布式系统的常态。重试可以恢复请求，也可能放大一次故障。' },
  { en: 'Use exponential backoff, jitter and a retry budget. Make every attempt bounded.', zh: '使用指数退避、随机抖动与重试预算，让每一次重试都有边界。', headingEn: '01 / Give the next attempt some room', headingZh: '01 / 给下一次尝试留点时间' },
  { en: 'Record attempts and outcomes. Understand what happened before deciding what to do next.', zh: '记录尝试次数与最终结果。先知道发生了什么，再决定接下来怎么做。', headingEn: '02 / Make the outcome observable', headingZh: '02 / 让结果可以被观察' },
];

function DocumentPage({ chinese = false, selected, onSelect, language }: { chinese?: boolean; selected: number | null; onSelect: (index: number) => void; language: 'en' | 'zh' }) {
  const page = useRef<HTMLDivElement>(null);
  const sentences = useRef<(HTMLButtonElement | null)[]>([]);
  useEffect(() => {
    const pane = page.current;
    const sentence = selected === null ? null : sentences.current[selected];
    if (!pane || !sentence) return;
    const revealSentence = () => {
      if (!pane.clientHeight) return;
      const bounds = pane.getBoundingClientRect();
      const target = sentence.getBoundingClientRect();
      // Scroll only the matching page, never the surrounding stage or document.
      if (target.top < bounds.top || target.bottom > bounds.bottom) pane.scrollTo({ top: pane.scrollTop + target.top - bounds.top - 16, behavior: 'instant' });
    };
    revealSentence();
    const observer = new ResizeObserver(revealSentence);
    observer.observe(pane);
    return () => observer.disconnect();
  }, [selected, language]);
  return <div ref={page} className={styles.documentPage} lang={chinese ? 'zh-CN' : 'en'}>
    <span className={styles.paperKicker}>{chinese ? '系统设计 / 阅读示例' : 'SYSTEM DESIGN / READING SAMPLE'}</span>
    <h3>{chinese ? <>重试，<br />也需要分寸。</> : <>Retry,<br />with respect.</>}</h3>
    {SENTENCES.map((sentence, index) => <div key={index}>
      {sentence.headingEn && <h4>{chinese ? sentence.headingZh : sentence.headingEn}</h4>}
      <p><button ref={element => { sentences.current[index] = element; }} type="button" className={styles.sentence} aria-pressed={selected === index} aria-label={`${chinese ? '对应中文' : '对应英文'}第 ${index + 1} 段：${chinese ? sentence.zh : sentence.en}`} onClick={() => onSelect(index)}>{chinese ? sentence.zh : sentence.en}</button></p>
    </div>)}
  </div>;
}

export function DocumentDemo() {
  const [reveal, setReveal] = useState(50);
  const [language, setLanguage] = useState<'en' | 'zh'>('zh');
  const [selected, setSelected] = useState<number | null>(null);
  return <div className={styles.documentDemo}>
    <p className={styles.documentHint}>点一句话，看它的另一面。<span role="status">{selected === null ? '中英对应' : `已对应 ${selected + 1} / 3`}</span></p>
    <div className={styles.mobileLanguages} role="group" aria-label="文档阅读语言"><button type="button" aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>英文原文</button><button type="button" aria-pressed={language === 'zh'} onClick={() => setLanguage('zh')}>中文译文</button></div>
    <div className={styles.documentCompare} data-mobile-language={language} style={{ gridTemplateColumns: `${100 - reveal}% ${reveal}%` }} aria-label="双语阅读对照示例">
      <DocumentPage selected={selected} onSelect={setSelected} language={language} />
      <DocumentPage chinese selected={selected} onSelect={setSelected} language={language} />
    </div>
    {selected !== null && <aside className={styles.pairedTranslation} aria-label="所选段落的对应译文"><span>{language === 'zh' ? 'EN / 对应原文' : 'ZH / 对应译文'}</span><p lang={language === 'zh' ? 'en' : 'zh-CN'}>{SENTENCES[selected][language === 'zh' ? 'en' : 'zh']}</p></aside>}
    <div className={styles.compareControl}>
      <label htmlFor="translation-reveal">拖动滑块，给译文多一点空间<span>{reveal}% 中文</span></label>
      <input id="translation-reveal" type="range" min="30" max="70" value={reveal} aria-label="中文阅读空间" aria-valuetext={`${reveal}% 中文，${100 - reveal}% 英文`} onChange={event => setReveal(Number(event.target.value))} />
      <div><span>多看原文</span><span>多看译文</span></div>
    </div>
  </div>;
}

const PROTOCOLS = [
  { name: 'npm', label: 'REGISTRY PROTOCOL', command: 'npm install example-package --registry https://packages.example/npm/', client: 'npm 客户端', kind: '包的元数据与 tarball' },
  { name: 'OCI', label: 'DISTRIBUTION SPEC', command: 'docker pull packages.example/team/example:1.0', client: 'OCI 客户端', kind: '镜像 manifest 与 blob' },
  { name: 'PyPI', label: 'SIMPLE API', command: 'pip install example-package --index-url https://packages.example/pypi/simple/', client: 'pip 客户端', kind: '包的索引与分发文件' },
] as const;

export function ProtocolTeaser() {
  return <div className={styles.protocolTeaser}>{PROTOCOLS.map(protocol => <div key={protocol.name}><strong>{protocol.name}</strong><span>{protocol.label}</span></div>)}</div>;
}

export function GatewayDemo() {
  const [protocolIndex, setProtocolIndex] = useState(0);
  const [step, setStep] = useState(0);
  const [cached, setCached] = useState(false);
  const protocol = PROTOCOLS[protocolIndex];
  const steps = [
    { name: '客户端', detail: `${protocol.client} 继续使用熟悉的命令。这次观察其中一份不可变制品的读取。` },
    { name: 'Gateway', detail: cached ? '网关找到有效缓存，这一份制品内容可以直接从对象存储读取。' : '这份制品还没有缓存，网关需要向配置的上游仓库请求内容。' },
    { name: cached ? '对象存储' : '上游仓库', detail: cached ? '从 S3 兼容存储读取已校验的字节，这次制品内容读取无需回源。' : '从上游取得制品内容，通过校验后写入对象存储，为后续读取留下缓存。' },
    { name: '返回结果', detail: cached ? '同一份制品再次返回给客户端。有效缓存让这次内容读取少走了一次上游。' : '制品交还给客户端，缓存也已准备好。再读一次，看看路径有什么不同。' },
  ];
  return <div className={styles.gatewayDemo}>
    <div className={styles.protocolTabs} role="group" aria-label="选择原生协议">{PROTOCOLS.map((item, index) => <button key={item.name} type="button" aria-pressed={index === protocolIndex} onClick={() => { setProtocolIndex(index); setStep(0); }}>{item.name}</button>)}</div>
    <pre className={styles.gatewayCommand}><span>$ </span>{protocol.command}</pre>
    <div className={styles.requestHeading}><span>同一份制品，两条读取路径</span><span>代理仓库 · 本地示例</span></div>
    <div className={styles.cacheChoices} role="group" aria-label="制品缓存场景"><button type="button" aria-pressed={!cached} onClick={() => { setCached(false); setStep(0); }}>首次读取</button><button type="button" aria-pressed={cached} onClick={() => { setCached(true); setStep(0); }}>缓存命中</button></div>
    <div className={styles.requestSteps} data-cached={cached} role="group" aria-label="请求路径">{steps.map((item, index) => <button key={index} type="button" aria-pressed={index === step} data-complete={index < step} onClick={() => setStep(index)}><span>0{index + 1}</span><strong>{item.name}</strong>{index < 3 && <ArrowRight size={18} aria-hidden="true" />}</button>)}<span className={styles.requestProgress} style={{ transform: `scaleX(${step / 3})` }} aria-hidden="true" /></div>
    <p className={styles.requestDetail} role="status"><span key={`${protocolIndex}-${cached}-${step}`}>{steps[step].detail}</span></p>
    <div className={styles.requestOutcome} data-complete={step === 3}><span>本次制品内容回源</span><strong>{step === 3 ? `${cached ? 0 : 1} 次` : '—'}</strong><small>{step === 3 ? (cached ? '有效缓存，路径更短' : '缓存已就绪') : `${step + 1} / 4 步`}</small></div>
    <button type="button" className={styles.textAction} onClick={() => { if (step < 3) setStep(step + 1); else { setCached(!cached); setStep(0); } }}>{step < 3 ? '跟随这次请求' : cached ? '重新体验首次读取' : '再读一次，看看缓存'}<ArrowRight size={19} aria-hidden="true" /></button>
  </div>;
}

export function ReviewTeaser() {
  return <div className={styles.reviewTeaser}>
    <p>diff --git a/src/profile.ts<br />--- a/src/profile.ts<br />+++ b/src/profile.ts</p>
    <pre><span> async function loadProfile(id) {'{'}</span>{'\n'}<span className={styles.removed}>-  const user = fetchUser(id)</span>{'\n'}<span className={styles.added}>+  const user = await fetchUser(id)</span>{'\n'}<span>   return user.name</span>{'\n'}<span> {'}'}</span></pre>
  </div>;
}

export function ReviewDemo() {
  const [commentOpen, setCommentOpen] = useState(false);
  const [applied, setApplied] = useState(false);
  return <div className={styles.reviewDemo}>
    <div className={styles.codeHeader}><span>src/profile.ts</span><span>审查示例</span></div>
    <div className={styles.codeLines} role="region" aria-label="审查代码" tabIndex={0}>
      <div><span className={styles.lineNumber}>1</span><code><span className={styles.syntax}>async function</span> loadProfile(id) {'{'}</code></div>
      <button className={styles.reviewLine} type="button" aria-expanded={commentOpen} aria-controls="review-comment" onClick={() => setCommentOpen(!commentOpen)}><span className={styles.lineNumber}>2</span><code><span className={styles.syntax}>const</span> user = {applied && <span className={styles.addedWord}>await </span>}fetchUser(id)</code><MessageSquare size={16} aria-hidden="true" /></button>
      <div id="review-comment" className={styles.reviewComment} hidden={!commentOpen}>
        <span>{applied ? '已应用到示例' : '这一行，值得再看一下'}</span>
        <p>{applied ? '先等待请求完成，再读取 user.name。修改已经显示在上面。' : '示例中的 fetchUser 返回 Promise。这里少了 await，应先等待结果，再读取 name。'}</p>
        {!applied && <button type="button" onClick={() => setApplied(true)}>应用这条建议 <ArrowRight size={15} /></button>}
      </div>
      <div><span className={styles.lineNumber}>3</span><code><span className={styles.syntax}>return</span> user.name</code></div>
      <div><span className={styles.lineNumber}>4</span><code>{'}'}</code></div>
    </div>
    <div className={styles.reviewActions}><span role="status">{applied ? '建议已应用，看看第 2 行的变化。' : '点一下第 2 行，展开审查意见。'}</span><button type="button" onClick={() => { setApplied(false); setCommentOpen(false); }} aria-label="重置审查示例"><RotateCcw size={17} /></button></div>
  </div>;
}
