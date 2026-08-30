'use client';

import { FormEvent, useState } from 'react';
import { AtSign, Clock3, GitBranch, Mail, Send } from 'lucide-react';
import MissionSection from '@/app/components/sections/mission/MissionSection';
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

    window.location.href = `mailto:hello@ccsert.dev?subject=${subject}&body=${body}`;
    setFormStatus('已请求打开系统邮件客户端；若没有反应，请直接发送至 hello@ccsert.dev。');
  };

  return (
    <MissionSection
      id="contact"
      number="06"
      railTitle="Contact"
      railSubtitle="Open channel"
      eyebrow="// Open channel"
      title="Contact"
      subtitle="Get in touch"
    >
      <div className={styles.contactGrid}>
        <div className={styles.directPanel}>
          <div className={styles.directBlock}>
            <h3 className={styles.subpanelTitle}>Direct links</h3>
            <div className={styles.directLinks}>
              <a href="mailto:hello@ccsert.dev"><Mail size={14} aria-hidden="true" />hello@ccsert.dev</a>
              <a href="https://github.com/ccsert" target="_blank" rel="noopener noreferrer"><GitBranch size={14} aria-hidden="true" />github.com/ccsert</a>
              <a href="https://twitter.com/ccsert" target="_blank" rel="noopener noreferrer"><AtSign size={14} aria-hidden="true" />ccsert</a>
            </div>
          </div>
          <div className={styles.directBlock}>
            <h3 className={styles.subpanelTitle}>Availability</h3>
            <p className={styles.availability}>
              <Clock3 size={13} aria-hidden="true" /> 通常在 24 小时内回复<br />
              工作时间：UTC+8 · 09:00—18:00
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
