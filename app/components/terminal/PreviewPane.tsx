'use client';

import { useState } from 'react';
import { Check, Circle, Copy, ExternalLink, FileText, TerminalSquare } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer, Tooltip } from 'recharts';
import { displayPath, getPreviewDocument } from '@/app/lib/terminal/shell';
import styles from './TerminalWorkbench.module.css';

interface PreviewPaneProps {
  path: string;
  onRunCommand: (command: string) => void;
  onOpenSection: (sectionId: string) => void;
}

const SIGNAL_DATA = [
  { requests: 58, latency: 36, errors: 14 },
  { requests: 64, latency: 42, errors: 12 },
  { requests: 60, latency: 32, errors: 15 },
  { requests: 52, latency: 46, errors: 11 },
  { requests: 48, latency: 39, errors: 9 },
  { requests: 62, latency: 55, errors: 13 },
  { requests: 76, latency: 44, errors: 17 },
  { requests: 71, latency: 38, errors: 12 },
  { requests: 66, latency: 51, errors: 10 },
  { requests: 74, latency: 48, errors: 14 },
  { requests: 82, latency: 58, errors: 18 },
  { requests: 91, latency: 54, errors: 16 },
];

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
          {document.sectionId ? (
            <button
              type="button"
              className={styles.previewAction}
              onClick={() => onOpenSection(document.sectionId!)}
              aria-label="打开页面对应区域"
              title="打开页面对应区域"
            >
              <ExternalLink size={14} aria-hidden="true" />
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

        {document.signals ? (
          <section className={styles.signalBlock} aria-label="系统信号">
            <h3 className={styles.sectionTitle}>System Signals</h3>
            <div className={styles.signalLegend} aria-hidden="true">
              <span className={styles.signalLegendItem}><Circle size={6} fill="var(--color-accent)" color="var(--color-accent)" /> Requests</span>
              <span className={styles.signalLegendItem}><Circle size={6} fill="var(--color-info)" color="var(--color-info)" /> Latency</span>
              <span className={styles.signalLegendItem}><Circle size={6} fill="var(--color-warning)" color="var(--color-warning)" /> Errors</span>
            </div>
            <div className={styles.signalChart} role="img" aria-label="请求、延迟与错误趋势图">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={SIGNAL_DATA} margin={{ top: 8, right: 4, bottom: 4, left: 4 }}>
                  <Tooltip
                    contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: 10 }}
                    labelStyle={{ display: 'none' }}
                  />
                  <Line type="monotone" dataKey="requests" stroke="var(--color-accent)" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="latency" stroke="var(--color-info)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="errors" stroke="var(--color-warning)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className={styles.signalMetrics}>
              <div className={styles.signalMetric}><span>Requests</span><strong>{document.signals.requests}</strong></div>
              <div className={styles.signalMetric}><span>Latency</span><strong>{document.signals.latency}</strong></div>
              <div className={styles.signalMetric}><span>Errors</span><strong>{document.signals.errors}</strong></div>
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
