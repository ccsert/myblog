'use client';

import { useSessionSelection } from './useSessionSelection';
import { ArrowUpRight, Circle, ExternalLink, Minus, Plus } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import MissionSection from '@/app/components/sections/mission/MissionSection';
import { PORTFOLIO_PROJECTS, PUBLIC_EVIDENCE_CHECKED_AT } from '@/app/lib/content/portfolio';
import styles from '@/app/components/sections/mission/MissionLog.module.css';
import { ArchiveLink } from '@/app/components/ArchiveLink';

export default function Projects() {
  const [openProjectId, setOpenProjectId] = useSessionSelection('home-open-project', PORTFOLIO_PROJECTS[0].id, ['', ...PORTFOLIO_PROJECTS.map(project => project.id)]);

  return (
    <MissionSection
      id="projects"
      number="02"
      railTitle="Projects"
      railSubtitle="Public systems"
      eyebrow="// Verified repositories"
      title="想法，已经在运行。"
      subtitle="四个开源作品。展开看看各自解决什么问题，也可以直接上手试。"
      headerAside={(
        <div className={styles.summaryMetrics}>
          <div className={styles.summaryMetric}>
            <span>Selected</span>
            <strong data-accent="true">{String(PORTFOLIO_PROJECTS.length).padStart(2, '0')}</strong>
          </div>
          <div className={styles.summaryMetric}>
            <span>Source</span>
            <strong>Public GitHub</strong>
          </div>
        </div>
      )}
    >
      <div className={styles.projectList} data-reveal-group>
        {PORTFOLIO_PROJECTS.map(project => {
          const isOpen = openProjectId === project.id;
          const contentId = `${project.id.toLowerCase()}-details`;

          return (
            <article className={styles.projectItem} key={project.id} data-project={project.slug} data-open={isOpen}>
              <button
                type="button"
                className={styles.projectToggle}
                data-open={isOpen}
                aria-expanded={isOpen}
                aria-controls={contentId}
                onClick={() => setOpenProjectId(isOpen ? '' : project.id)}
              >
                <div className={styles.projectIdentity}>
                  <div className={styles.projectMeta}>
                    <span>UPDATED {project.updated}</span>
                    <span className={styles.statusBadge} data-status={project.status}>{project.status}</span>
                    <span>{project.stage}</span>
                  </div>
                  <div className={styles.projectTitle}>
                    <Circle size={7} fill="currentColor" aria-hidden="true" />
                    {project.title}
                  </div>
                </div>

                <div className={styles.projectSummary}>
                  <p className={styles.projectDescription}>{project.description}</p>
                  <div className={styles.stackList} aria-label={`${project.title} 技术栈`}>
                    {project.stack.map(item => <span className={styles.tag} key={item}>{item}</span>)}
                  </div>
                </div>

                <span className={styles.toggleIcon} aria-hidden="true">
                  {isOpen ? <Minus size={13} /> : <Plus size={13} />}
                </span>
              </button>

              <div className={styles.projectExpandWrap} data-open={isOpen} inert={!isOpen}>
                <div className={styles.projectExpandInner}>
                  <div className={styles.projectExpanded} id={contentId} role="region" aria-label={`${project.title} 项目详情`}>
                    <div className={styles.projectCover}>
                      <Image src={`/projects/${project.slug}/cover.jpg`} alt="" fill sizes="(max-width: 680px) 100vw, 320px" />
                    </div>
                    <div className={styles.expandedOverview}>
                      <p>{project.overview}</p>
                      <div className={styles.projectActions}>
                        <ArchiveLink id={`project-play-${project.slug}`} className={styles.textLink} href={`/archive#play=${project.slug}`}><i className={styles.projectColor} data-project={project.slug} />上手试试 <ExternalLink size={12} aria-hidden="true" /></ArchiveLink>
                        <ArchiveLink id={`project-read-${project.slug}`} className={styles.textLink} href={`/archive#read=${project.slug}`}>读设计思路 <ExternalLink size={12} aria-hidden="true" /></ArchiveLink>
                        {'caseStudy' in project ? <Link className={styles.textLink} href={project.caseStudy}>读完整案例 <ArrowUpRight size={12} aria-hidden="true" /></Link> : null}
                        <a className={styles.textLink} href={project.repositoryUrl} target="_blank" rel="noopener noreferrer">项目源码 <ExternalLink size={12} aria-hidden="true" /></a>
                      </div>
                    </div>
                    <div className={styles.expandedCapabilities}>
                      <h3 className={styles.capabilityTitle}>能做什么</h3>
                      <ul className={styles.capabilityList}>
                        {project.capabilities.map(capability => (
                          <li key={capability}><Circle size={6} fill="currentColor" aria-hidden="true" />{capability}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <div className={styles.endMarker}>版本与功能信息核对自公开仓库 · {PUBLIC_EVIDENCE_CHECKED_AT}</div>
    </MissionSection>
  );
}
