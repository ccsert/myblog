import type { Metadata } from 'next';
import ArchiveExperience from '@/app/components/archive/ArchiveExperience';

export const metadata: Metadata = {
  title: 'Signal Archive｜ccsert.dev',
  description: '探索一间失联的像素档案室，恢复服务器并进入 ccsert.dev 终端。',
};

export default function ArchivePage() {
  return <ArchiveExperience />;
}
