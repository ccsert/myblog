'use client';

import { useState } from 'react';
import { Circle, ExternalLink, Minus, Plus } from 'lucide-react';
import MissionSection from '@/app/components/sections/mission/MissionSection';
import styles from '@/app/components/sections/mission/MissionLog.module.css';

interface Project {
  id: string;
  title: string;
  description: string;
  overview: string;
  capabilities: string[];
  status: 'production' | 'development';
  stack: string[];
  timestamp: string;
}

const PROJECTS: Project[] = [
  {
    id: 'PROJ-001',
    title: 'Agent Platform',
    description: 'AI Agent 平台，支持多 Agent 协作、任务编排与工具调用。',
    overview: 'A production-ready platform for orchestrating agents, tools, memory, and observable workflows across reliable delivery boundaries.',
    capabilities: ['多 Agent 协作与任务编排', '工具调用与扩展生态', '可观测执行与运行时安全', '水平扩展与高可用部署'],
    status: 'production',
    stack: ['React', 'Node.js', 'Docker', 'Kubernetes'],
    timestamp: '2024-01-15 14:32:07',
  },
  {
    id: 'PROJ-002',
    title: 'DevOps Pipeline',
    description: 'CI/CD 流水线系统，支持自动化构建、测试与部署。',
    overview: 'A traceable delivery system that turns source changes into reproducible builds, immutable artifacts, and controlled deployments.',
    capabilities: ['多环境流水线编排', '制品追溯与质量门禁', '自动化部署与回滚', '可审计交付事件'],
    status: 'production',
    stack: ['GitLab CI', 'Docker', 'Kubernetes', 'Terraform'],
    timestamp: '2023-11-20 09:15:33',
  },
  {
    id: 'PROJ-003',
    title: 'Monitoring Dashboard',
    description: '实时监控系统，支持日志聚合、指标可视化与告警。',
    overview: 'A practical observability surface connecting metrics, logs, alerts, and operational context without losing incident chronology.',
    capabilities: ['指标、日志与事件聚合', '告警分级与路由', '服务健康趋势分析', '故障上下文快速定位'],
    status: 'production',
    stack: ['Grafana', 'Prometheus', 'Loki', 'AlertManager'],
    timestamp: '2023-09-10 16:45:12',
  },
  {
    id: 'PROJ-004',
    title: 'Microservices Framework',
    description: '微服务框架，支持服务发现、负载均衡与熔断降级。',
    overview: 'An opinionated service foundation for resilient communication, discovery, policy, and operational consistency.',
    capabilities: ['服务发现与健康检查', '请求治理与流量策略', '熔断、重试与降级', '统一遥测与配置边界'],
    status: 'development',
    stack: ['Go', 'gRPC', 'Consul', 'Envoy'],
    timestamp: '2024-03-05 11:20:45',
  },
];

export default function Projects() {
  const [openProjectId, setOpenProjectId] = useState(PROJECTS[0].id);

  return (
    <MissionSection
      id="projects"
      number="02"
      railTitle="Projects"
      railSubtitle="Deploy Log · 2019—Present"
      eyebrow="// Deploy log"
      title="Projects"
      subtitle="系统日志：已部署并持续运行的项目"
      headerAside={(
        <div className={styles.summaryMetrics}>
          <div className={styles.summaryMetric}>
            <span>Total deployed</span>
            <strong data-accent="true">04</strong>
          </div>
          <div className={styles.summaryMetric}>
            <span>Status</span>
            <strong>All systems operational</strong>
          </div>
        </div>
      )}
    >
      <div className={styles.projectList}>
        {PROJECTS.map(project => {
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
                    <span>{project.timestamp}</span>
                    <span className={styles.statusBadge} data-status={project.status}>{project.status}</span>
                    <span>{project.id}</span>
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
                    <a className={styles.textLink} href="https://github.com/ccsert" target="_blank" rel="noopener noreferrer">
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
      <div className={styles.endMarker}>End of deploy log</div>
    </MissionSection>
  );
}
