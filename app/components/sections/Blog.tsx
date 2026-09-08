'use client';

import { useSessionSelection } from './useSessionSelection';
import { ArrowUpRight, FileText } from 'lucide-react';
import MissionSection from '@/app/components/sections/mission/MissionSection';
import { KNOWLEDGE_SIGNALS } from '@/app/lib/content/portfolio';
import styles from '@/app/components/sections/mission/MissionLog.module.css';
import { ArchiveLink } from '@/app/components/ArchiveLink';

export default function Blog() {
  const [selectedPostId, setSelectedPostId] = useSessionSelection('home-selected-note', KNOWLEDGE_SIGNALS[0].id, KNOWLEDGE_SIGNALS.map(note => note.id));
  const selectedPost = KNOWLEDGE_SIGNALS.find(post => post.id === selectedPostId) ?? KNOWLEDGE_SIGNALS[0];

  return (
    <MissionSection
      id="blog"
      number="05"
      railTitle="Notes"
      railSubtitle="Knowledge signals"
      eyebrow="// Research index"
      title="做东西，也留一点追问。"
      subtitle="关于知识、网络、语音与系统，顺着一条线索继续读。"
      headerAside={(
        <span className={styles.indexBoundary}>Private notes · public-safe index</span>
      )}
    >
      <div className={styles.blogGrid}>
        <article className={styles.featuredPost} aria-live="polite">
          <div className={styles.featuredLabel}>Knowledge signal · {selectedPost.id}</div>
          <h3>{selectedPost.title}</h3>
          <p>{selectedPost.excerpt}</p>
          <p className={styles.knowledgeQuestion}><strong>OPEN QUESTION</strong>{selectedPost.openQuestion}</p>
          <p className={styles.knowledgeBoundary}>{selectedPost.boundary}</p>
          <div className={styles.featuredMeta}>
            {selectedPost.tags.map(tag => <span className={styles.tag} key={tag}>{tag}</span>)}
            <span>Indexed {selectedPost.indexed}</span>
            <ArchiveLink id={`note-read-${selectedPost.slug}`} className={styles.textLink} href={`/archive#read=${selectedPost.slug}`}>阅读这条手记 <ArrowUpRight size={11} aria-hidden="true" /></ArchiveLink>
            <a className={styles.textLink} href={selectedPost.sourceUrl} target="_blank" rel="noopener noreferrer">
              {selectedPost.sourceLabel} <ArrowUpRight size={11} aria-hidden="true" />
            </a>
          </div>
        </article>

        <div className={styles.postQueue} aria-label="知识信号队列">
          {KNOWLEDGE_SIGNALS.map(post => (
            <button
              type="button"
              key={post.id}
              className={styles.postButton}
              data-active={post.id === selectedPostId}
              onClick={() => setSelectedPostId(post.id)}
              aria-pressed={post.id === selectedPostId}
            >
              <span className={styles.postDate}>{post.indexed}</span>
              <span className={styles.postIdentity}>
                <strong><FileText size={13} aria-hidden="true" />{post.title}</strong>
                <span>{post.tags.join(' · ')}</span>
              </span>
              <span className={styles.draftLabel}>{post.state}</span>
            </button>
          ))}
        </div>
      </div>
      <div className={styles.endMarker}>Full private notes remain outside the public site by design</div>
    </MissionSection>
  );
}
