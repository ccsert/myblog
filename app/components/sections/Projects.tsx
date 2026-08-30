'use client';

import { useState } from 'react';
import { Circle, ExternalLink, Minus, Plus } from 'lucide-react';
import MissionSection from '@/app/components/sections/mission/MissionSection';
import { PORTFOLIO_PROJECTS } from '@/app/lib/content/portfolio';
import styles from '@/app/components/sections/mission/MissionLog.module.css';

export default function Projects() {
  const [openProjectId, setOpenProjectId] = useState<string>(PORTFOLIO_PROJECTS[0].id);

  return (
    <MissionSection
      id="projects"
      number="02"
      railTitle="Projects"
      railSubtitle="Public systems"
      eyebrow="// Verified repositories"
      title="Selected Systems"
      subtitle="来自公开仓库的真实构建，不再使用概念项目占位"
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
      <div className={styles.projectList}>
        {PORTFOLIO_PROJECTS.map(project => {
          const isOpen = openProjectId === project.id;
          const contentId = `${project.id.toLowerCase()}-details`;

          return (
            <article className={styles.projectItem} key={project.id}>
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

              {isOpen ? (
                <div className={styles.projectExpanded} id={contentId} role="region" aria-label={`${project.title} 项目详情`}>
                  <div className={styles.expandedOverview}>
                    <p>{project.overview}</p>
                    <a className={styles.textLink} href={project.repositoryUrl} target="_blank" rel="noopener noreferrer">
                      View repository <ExternalLink size={12} aria-hidden="true" />
                    </a>
                  </div>
                  <div>
                    <h3 className={styles.capabilityTitle}>Key capabilities</h3>
                    <ul className={styles.capabilityList}>
                      {project.capabilities.map(capability => (
                        <li key={capability}><Circle size={6} fill="currentColor" aria-hidden="true" />{capability}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
      <div className={styles.endMarker}>Evidence checked against public repositories</div>
    </MissionSection>
  );
}
