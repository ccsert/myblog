'use client';

import { FormEvent, useState } from 'react';
import { GitBranch, Mail, MessageSquareText, Send } from 'lucide-react';
import MissionSection from '@/app/components/sections/mission/MissionSection';
import { SITE_CONFIG } from '@/app/lib/content/portfolio';
import styles from '@/app/components/sections/mission/MissionLog.module.css';

export default function Contact() {
  const [formStatus, setFormStatus] = useState('');

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
      eyebrow="// Contact"
      title="聊聊"
      subtitle="说说你遇到的问题、手上的限制，和希望得到的结果。"
    >
      <div className={styles.contactGrid} data-reveal-group>
        <div className={styles.directPanel} data-spotlight="card">
          <div className={styles.directBlock}>
            <h3 className={styles.subpanelTitle}>直接联系</h3>
            <div className={styles.directLinks}>
              <a href={`mailto:${SITE_CONFIG.email}`}><Mail size={14} aria-hidden="true" />{SITE_CONFIG.email}</a>
              <a href="https://github.com/ccsert" target="_blank" rel="noopener noreferrer"><GitBranch size={14} aria-hidden="true" />github.com/ccsert</a>
            </div>
          </div>
          <div className={styles.directBlock}>
            <h3 className={styles.subpanelTitle}>写信时可以附上</h3>
            <p className={styles.availability}>
              <MessageSquareText size={13} aria-hidden="true" /> 问题背景 · 已知限制 · 期待的结果<br />
              如果和某个开源项目有关，直接贴上仓库链接或 Issue 就好。
            </p>
          </div>
        </div>

        <form className={styles.composer} onSubmit={openEmailDraft} data-spotlight="card">
          <h3 className={styles.subpanelTitle}>写封邮件</h3>
          <div className={styles.formGrid}>
            <div className={styles.fieldStack}>
              <div className={styles.field}>
                <label htmlFor="name">怎么称呼你</label>
                <input type="text" id="name" name="name" autoComplete="name" required placeholder="名字或昵称" />
              </div>
              <div className={styles.field}>
                <label htmlFor="email">你的邮箱</label>
                <input type="email" id="email" name="email" autoComplete="email" required placeholder="your@email.com" />
              </div>
            </div>
            <div className={styles.field}>
              <label htmlFor="message">想聊的事</label>
              <textarea id="message" name="message" required placeholder="简单说说情况就好" />
            </div>
          </div>
          <button className={styles.sendButton} type="submit">
            生成邮件草稿 <Send size={13} aria-hidden="true" />
          </button>
          <p className={styles.formNote}>点击后会打开你的邮件客户端，内容已经填好；本站不保存任何表单内容。</p>
          <p className={styles.formStatus} role="status" aria-live="polite">{formStatus}</p>
        </form>
      </div>
    </MissionSection>
  );
}
