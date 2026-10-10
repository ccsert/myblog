'use client';

import { FormEvent, useState } from 'react';
import { Check, Copy, GitBranch, Mail, MessageSquareText, Send } from 'lucide-react';
import MissionSection from '@/app/components/sections/mission/MissionSection';
import { SITE_CONFIG } from '@/app/lib/content/portfolio';
import styles from '@/app/components/sections/mission/MissionLog.module.css';

export default function Contact() {
  const [formStatus, setFormStatus] = useState('');
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(SITE_CONFIG.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setFormStatus(`复制失败，请手动复制：${SITE_CONFIG.email}`);
    }
  };

  const openEmailDraft = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get('name') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const message = String(formData.get('message') ?? '').trim();
    const subject = encodeURIComponent(`来自 ${name} 的网站留言`);
    const body = encodeURIComponent(`姓名：${name}\n邮箱：${email}\n\n${message}`);

    window.location.href = `mailto:${SITE_CONFIG.email}?subject=${subject}&body=${body}`;
    setFormStatus(`已请求打开系统邮件客户端；若没有反应，请直接发送至 ${SITE_CONFIG.email}。`);
  };

  return (
    <MissionSection
      id="contact"
      number="06"
      railTitle="Contact"
      railSubtitle="Open channel"
      eyebrow="// Open channel"
      title="联系我"
      subtitle="从问题本身说起：背景、约束，以及你期待的结果。"
    >
      <div className={styles.contactGrid}>
        <div className={styles.directPanel}>
          <div className={styles.directBlock}>
            <h3 className={styles.subpanelTitle}>Direct links</h3>
            <div className={styles.directLinks}>
              <div className={styles.emailRow}>
                <a href={`mailto:${SITE_CONFIG.email}`}><Mail size={14} aria-hidden="true" />{SITE_CONFIG.email}</a>
                <button type="button" className={styles.copyButton} onClick={copyEmail} aria-label="复制邮箱地址">
                  {copied ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
                  {copied ? '已复制' : '复制'}
                </button>
              </div>
              <a href="https://github.com/ccsert" target="_blank" rel="noopener noreferrer"><GitBranch size={14} aria-hidden="true" />github.com/ccsert</a>
            </div>
          </div>
          <div className={styles.directBlock}>
            <h3 className={styles.subpanelTitle}>Useful context</h3>
            <p className={styles.availability}>
              <MessageSquareText size={13} aria-hidden="true" /> 问题背景 · 已知约束 · 期待结果<br />
              如果与某个公开项目有关，也可以直接附上仓库链接或 Issue。
            </p>
          </div>
        </div>

        <form className={styles.composer} onSubmit={openEmailDraft}>
          <h3 className={styles.subpanelTitle}>Transmission composer</h3>
          <div className={styles.formGrid}>
            <div className={styles.fieldStack}>
              <div className={styles.field}>
                <label htmlFor="name">Name</label>
                <input type="text" id="name" name="name" autoComplete="name" required placeholder="Your name" />
              </div>
              <div className={styles.field}>
                <label htmlFor="email">Email</label>
                <input type="email" id="email" name="email" autoComplete="email" required placeholder="your@email.com" />
              </div>
            </div>
            <div className={styles.field}>
              <label htmlFor="message">Message</label>
              <textarea id="message" name="message" required placeholder="Your message..." />
            </div>
          </div>
          <button className={styles.sendButton} type="submit">
            Open email draft <Send size={13} aria-hidden="true" />
          </button>
          <p className={styles.formNote}>提交后将打开系统邮件客户端；本站不会存储表单内容。</p>
          <p className={styles.formStatus} role="status" aria-live="polite">{formStatus}</p>
        </form>
      </div>
    </MissionSection>
  );
}
