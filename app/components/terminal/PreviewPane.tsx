'use client';

import { useState } from 'react';
import { Check, Circle, Copy, CornerDownRight, ExternalLink, FileText, TerminalSquare } from 'lucide-react';
import { displayPath, getPreviewDocument } from '@/app/lib/terminal/shell';
import styles from './TerminalWorkbench.module.css';

interface PreviewPaneProps {
  path: string;
  onRunCommand: (command: string) => void;
  onOpenSection: (sectionId: string) => void;
}

export default function PreviewPane({ path, onRunCommand, onOpenSection }: PreviewPaneProps) {
  const [copied, setCopied] = useState(false);
  const document = getPreviewDocument(path);

  if (!document) {
    return (
      <div className={styles.previewBody}>
        <p className={styles.previewDescription}>Select a document from the workspace to preview it.</p>
      </div>
    );
  }

  const copyPath = async () => {
    try {
      await navigator.clipboard.writeText(displayPath(document.path));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  return (
    <>
      <header className={styles.previewHeader}>
        <div className={styles.previewPath} title={displayPath(document.path)}>
          <FileText size={13} aria-hidden="true" />
          <span>{displayPath(document.path)}</span>
          <span className={styles.previewBadge}>PREVIEW</span>
        </div>
        <div className={styles.previewActions}>
          <button
            type="button"
            className={styles.previewAction}
            onClick={() => onRunCommand(`cat ${displayPath(document.path)}`)}
            aria-label="在终端读取文件"
            title="在终端读取文件"
          >
            <TerminalSquare size={14} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={styles.previewAction}
            onClick={copyPath}
            aria-label={copied ? '路径已复制' : '复制文件路径'}
            title={copied ? '路径已复制' : '复制文件路径'}
          >
            {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
          </button>
          {document.href ? (
            <a
              className={styles.previewAction}
              href={document.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="打开公开来源"
              title="打开公开来源"
            >
              <ExternalLink size={14} aria-hidden="true" />
            </a>
          ) : null}
          {document.sectionId ? (
            <button
              type="button"
              className={styles.previewAction}
              onClick={() => onOpenSection(document.sectionId!)}
              aria-label="打开页面对应区域"
              title="打开页面对应区域"
            >
              <CornerDownRight size={14} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </header>

      <div className={styles.previewBody}>
        <h2 className={styles.previewTitle}>{document.title}</h2>
        <p className={styles.previewDescription}>{document.description}</p>

        <div className={styles.metadata}>
          <span className={styles.metadataItem}>
            <Circle size={6} fill="var(--terminal-accent)" color="var(--terminal-accent)" aria-hidden="true" />
            Status <strong>{document.status}</strong>
          </span>
          <span className={styles.metadataItem}>Stage <strong>{document.stage}</strong></span>
          <span className={styles.metadataItem}>Updated <strong>{document.updated}</strong></span>
        </div>

        {document.stack.length > 0 ? (
          <>
            <h3 className={styles.sectionTitle}>Stack</h3>
            <div className={styles.tagList}>
              {document.stack.map(item => <span className={styles.tag} key={item}>{item}</span>)}
            </div>
          </>
        ) : null}

        <h3 className={styles.sectionTitle}>Overview</h3>
        <p className={styles.overview}>{document.overview}</p>

        {document.evidence ? (
          <section className={styles.signalBlock} aria-label="公开证据">
            <h3 className={styles.sectionTitle}>Evidence</h3>
            <div className={styles.signalMetrics}>
              {document.evidence.map(item => (
                <div className={styles.signalMetric} key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
