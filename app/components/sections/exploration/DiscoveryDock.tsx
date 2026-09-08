import { ArchiveLink } from '@/app/components/ArchiveLink';
import { ArrowDownRight, ArrowUpRight, CornerDownRight } from 'lucide-react';
import { KNOWLEDGE_SIGNALS, PORTFOLIO_PROJECTS } from '@/app/lib/content/portfolio';
import styles from './DiscoveryDock.module.css';

const terminalProject = PORTFOLIO_PROJECTS.find(project => project.slug === 'omz-pm')!;
const voiceNote = KNOWLEDGE_SIGNALS.find(note => note.slug === 'voice-turns')!;
const EXPERIMENTS = [
  { slug: 'omz-pm', name: 'omz-pm', action: '换个终端主题' },
  { slug: 'DocBabel', name: 'DocBabel', action: '对照两种语言' },
  { slug: 'artifact-gateway', name: 'Gateway', action: '跟随一次请求' },
  { slug: 'opencode-review-gitea', name: 'Review', action: '试一次代码审查' },
] as const;
const TRAILS = [
  { question: '命令行，也可以让人爱不释手吗？', title: terminalProject.title, path: `/home/visitor/projects/${terminalProject.slug}.md`, kind: 'PROJECT' },
  { question: '怎样让 AI 真正学会「听你说完」？', title: voiceNote.title, path: `/home/visitor/knowledge/${voiceNote.slug}.md`, kind: 'FIELD NOTE' },
] as const;

export default function DiscoveryDock({ onOpenDocument }: { onOpenDocument: (path: string) => void }) {
  return (
    <div className={styles.dock}>
      <section className={styles.trails} aria-labelledby="curiosity-heading">
        <div className={styles.kicker}><CornerDownRight size={13} aria-hidden="true" /> FOLLOW A THREAD</div>
        <h2 id="curiosity-heading">好奇心，总有下一站<span>。</span></h2>
        <p className={styles.intro}>从一个问题开始，看看它最后长成了什么。</p>
        <div className={styles.trailList}>
          {TRAILS.map((trail, index) => (
            <button key={trail.path} type="button" className={styles.trail} onClick={() => onOpenDocument(trail.path)}>
              <span className={styles.number}>0{index + 1}</span>
              <span className={styles.trailCopy}><strong>{trail.question}</strong><span>{trail.kind}<i />{trail.title}</span></span>
              <ArrowUpRight size={18} aria-hidden="true" />
            </button>
          ))}
        </div>
        <a className={styles.allProjects} href="#projects">或者，浏览全部作品 <ArrowDownRight size={14} aria-hidden="true" /></a>
      </section>
      <section className={styles.archive} aria-label="个人实验场预览">
        <ArchiveLink className={styles.archiveEntry} href="/archive" id="discovery-playground" aria-label="进入个人实验场">
          <span className={styles.archiveTop}>THE PLAYGROUND<span>04 个可玩的想法</span></span>
          <span className={styles.archiveContent}><strong>别只看，动手玩。</strong><ArrowUpRight size={28} aria-hidden="true" /></span>
          <span className={styles.archiveDescription}>同一件作品，换一个角度认识。选一个想法，直接开始。</span>
        </ArchiveLink>
        <div className={styles.experiments}>{EXPERIMENTS.map((item, index) => <ArchiveLink key={item.slug} id={`discovery-${item.slug}`} href={`/archive#play=${item.slug}`} className={styles.experiment} data-project={item.slug}>
          <span><small>0{index + 1}</small><ArrowUpRight size={16} aria-hidden="true" /></span><strong>{item.name}</strong><span>{item.action}</span>
        </ArchiveLink>)}</div>
        <div className={styles.archiveBottom}>个人实验场<span>试玩 / 档案 / 手记</span></div>
      </section>
    </div>
  );
}
