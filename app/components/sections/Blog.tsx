'use client';

import { useState } from 'react';
import { ArrowUpRight, FileText } from 'lucide-react';
import MissionSection from '@/app/components/sections/mission/MissionSection';
import styles from '@/app/components/sections/mission/MissionLog.module.css';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  tags: string[];
}

const POSTS: BlogPost[] = [
  {
    id: 'BLOG-001',
    title: '构建 AI Agent 平台的思考',
    excerpt: '从单体到多智能体，从规则到学习，记录我在构建 AI Agent 平台过程中的思考与实践。',
    date: '2024-01-15',
    readTime: '8 min',
    tags: ['AI', 'Agent', 'Architecture'],
  },
  {
    id: 'BLOG-002',
    title: 'DevOps 最佳实践：从代码到生产',
    excerpt: '如何构建可靠的 CI/CD 流水线，让代码从提交到生产的过程可预测、可回溯。',
    date: '2023-12-10',
    readTime: '12 min',
    tags: ['DevOps', 'CI/CD', 'Best Practices'],
  },
  {
    id: 'BLOG-003',
    title: '微服务架构的权衡',
    excerpt: '微服务不是银弹。讨论什么时候应该使用微服务，以及什么时候更应该保持简单。',
    date: '2023-11-05',
    readTime: '10 min',
    tags: ['Microservices', 'Architecture', 'Trade-offs'],
  },
];

export default function Blog() {
  const [selectedPostId, setSelectedPostId] = useState(POSTS[0].id);
  const selectedPost = POSTS.find(post => post.id === selectedPostId) ?? POSTS[0];

  return (
    <MissionSection
      id="blog"
      number="05"
      railTitle="Blog"
      railSubtitle="Field notes"
      eyebrow="// Field notes"
      title="Blog"
      subtitle="Thoughts on technology, architecture, and building systems"
      headerAside={(
        <a className={styles.textLink} href="https://github.com/ccsert" target="_blank" rel="noopener noreferrer">
          View all posts <ArrowUpRight size={12} aria-hidden="true" />
        </a>
      )}
    >
      <div className={styles.blogGrid}>
        <article className={styles.featuredPost} aria-live="polite">
          <div className={styles.featuredLabel}>Featured · {selectedPost.id}</div>
          <h3>{selectedPost.title}</h3>
          <p>{selectedPost.excerpt}</p>
          <div className={styles.featuredMeta}>
            {selectedPost.tags.map(tag => <span className={styles.tag} key={tag}>{tag}</span>)}
            <span>{selectedPost.date}</span>
            <span>{selectedPost.readTime} read</span>
          </div>
        </article>

        <div className={styles.postQueue} aria-label="文章队列">
          {POSTS.map(post => (
            <button
              type="button"
              key={post.id}
              className={styles.postButton}
              data-active={post.id === selectedPostId}
              onClick={() => setSelectedPostId(post.id)}
              aria-pressed={post.id === selectedPostId}
            >
              <span className={styles.postDate}>{post.date}</span>
              <span className={styles.postIdentity}>
                <strong><FileText size={13} aria-hidden="true" />{post.title}</strong>
                <span>{post.tags.join(' · ')}</span>
              </span>
              <span className={styles.draftLabel}>Draft</span>
            </button>
          ))}
        </div>
      </div>
      <div className={styles.endMarker}>End of field notes</div>
    </MissionSection>
  );
}
