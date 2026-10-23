#!/usr/bin/env node
/**
 * 项目数据漂移检查。
 *
 * 读取 app/lib/content/portfolio.ts 里的公开项目索引，逐个到 GitHub 核对仓库
 * 最近推送、最新发行版与标签，然后和站点写的 stage / updated / Release 证据比对。
 *
 * 退出码：
 *   0  全部一致
 *   1  存在漂移
 *   2  网络错误、限流，或者拿不到足够信息完成核对
 *
 * 可选环境变量：
 *   GITHUB_TOKEN  提高 API 配额并避免匿名请求被限流
 */

import { readFile } from 'node:fs/promises';
import process from 'node:process';
import ts from 'typescript';

const PORTFOLIO_URL = new URL('../app/lib/content/portfolio.ts', import.meta.url);
const API_ROOT = 'https://api.github.com';
const USER_AGENT = 'me.ccsert.top-check-projects';
const TOKEN = process.env.GITHUB_TOKEN?.trim() || '';

const VERSION_PATTERN = /v?(\d+\.\d+\.\d+)/;

/** 网络类错误：属于「无法核对」，退出码 2。 */
class GitHubError extends Error {
  constructor(message, { kind = 'network', retryable = true } = {}) {
    super(message);
    this.name = 'GitHubError';
    this.kind = kind;
    this.retryable = retryable;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** 读取 portfolio.ts：用 typescript 转译后以 data URL 动态导入。 */
async function loadPortfolio() {
  const source = await readFile(PORTFOLIO_URL, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: 'portfolio.ts',
  });
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(transpiled.outputText).toString('base64')}`;
  const portfolio = await import(moduleUrl);
  return {
    projects: portfolio.PORTFOLIO_PROJECTS ?? [],
    checkedAt: portfolio.PUBLIC_EVIDENCE_CHECKED_AT ?? 'unknown',
  };
}

/** 请求 GitHub API；网络抖动自动重试，限流和 404 立刻抛出。 */
async function github(path, { retries = 2 } = {}) {
  const url = `${API_ROOT}${path}`;
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          accept: 'application/vnd.github+json',
          'x-github-api-version': '2022-11-28',
          'user-agent': USER_AGENT,
          ...(TOKEN ? { authorization: `Bearer ${TOKEN}` } : {}),
        },
      });

      if (response.status === 404) {
        throw new GitHubError(`${url} 返回 404：仓库不存在、已改名或不可见。`, { kind: 'not-found', retryable: false });
      }
      if (response.status === 403 || response.status === 429) {
        const reset = response.headers.get('x-ratelimit-reset');
        const resetHint = reset ? `配额重置时间 ${new Date(Number(reset) * 1000).toISOString()}。` : '';
        throw new GitHubError(`GitHub 限流（HTTP ${response.status}）。${resetHint}设置 GITHUB_TOKEN 可以提高配额。`, {
          kind: 'rate-limit',
          retryable: false,
        });
      }
      if (response.status >= 500) {
        throw new GitHubError(`GitHub 返回 HTTP ${response.status}：${url}`, { kind: 'http', retryable: true });
      }
      if (!response.ok) {
        const body = (await response.text()).slice(0, 200);
        throw new GitHubError(`GitHub 返回 HTTP ${response.status}：${body}`, { kind: 'http', retryable: false });
      }

      return await response.json();
    } catch (error) {
      if (error instanceof GitHubError && !error.retryable) throw error;
      lastError = error instanceof GitHubError
        ? error
        : new GitHubError(`请求 ${url} 失败：${error?.message ?? error}`, { kind: 'network' });
      if (attempt < retries) await sleep(500 * (attempt + 1));
    }
  }

  throw lastError;
}

/** 取出项目在站点上声明的版本号：stage 与 Release 证据都可能带。 */
function extractClaimedVersion(project) {
  const claims = [];
  const stageMatch = String(project.stage ?? '').match(VERSION_PATTERN);
  if (stageMatch) claims.push({ source: 'stage', version: stageMatch[1] });

  for (const item of project.evidence ?? []) {
    if (!/release|version|tag/i.test(String(item.label ?? ''))) continue;
    const match = String(item.value ?? '').match(VERSION_PATTERN);
    if (match) claims.push({ source: `evidence:${item.label}`, version: match[1] });
  }

  return claims;
}

function compareVersions(left, right) {
  const a = left.split('.').map(part => Number.parseInt(part, 10));
  const b = right.split('.').map(part => Number.parseInt(part, 10));
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    const diff = (a[index] ?? 0) - (b[index] ?? 0);
    if (diff !== 0) return diff > 0 ? 1 : -1;
  }
  return 0;
}

/** 只比较日期部分，避免同一天内的时刻差被误判成漂移。 */
function toDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

/** 拉取一个项目的 GitHub 现状。 */
async function fetchProjectState(project) {
  const match = String(project.repositoryUrl ?? '').match(/github\.com\/([^/]+)\/([^/#?]+)/);
  if (!match) {
    throw new GitHubError(`项目 ${project.id} 的 repositoryUrl 不是 GitHub 地址：${project.repositoryUrl}`, {
      kind: 'not-found',
      retryable: false,
    });
  }
  const [, owner, name] = match;
  const base = `/repos/${owner}/${name}`;

  // 匿名配额只有 60 次/小时，所以先取仓库信息和发行列表；只有没有发行版时
  // 才多问一次标签列表。
  const repo = await github(base);
  const releases = await github(`${base}/releases?per_page=5`).catch(error => {
    if (error instanceof GitHubError && error.kind === 'not-found') return [];
    throw error;
  });

  const release = Array.isArray(releases) && releases.length > 0
    ? releases.reduce((latest, candidate) => {
      const latestDate = new Date(latest.published_at ?? 0).getTime();
      const candidateDate = new Date(candidate.published_at ?? 0).getTime();
      return candidateDate > latestDate ? candidate : latest;
    })
    : null;

  let tagNames = [];
  if (!release) {
    const tags = await github(`${base}/tags?per_page=5`).catch(error => {
      if (error instanceof GitHubError && error.kind === 'not-found') return [];
      throw error;
    });
    tagNames = Array.isArray(tags) ? tags.map(tag => tag.name).filter(Boolean) : [];
  }

  const tagVersion = tagNames
    .map(name => ({ name, match: name.match(VERSION_PATTERN) }))
    .filter(item => item.match)
    .sort((a, b) => compareVersions(b.match[1], a.match[1]))[0];

  const latest = release
    ? { version: release.tag_name?.match(VERSION_PATTERN)?.[1] ?? null, tag: release.tag_name, date: toDate(release.published_at), source: 'release' }
    : tagVersion
      ? { version: tagVersion.match[1], tag: tagVersion.name, date: null, source: 'tag' }
      : { version: null, tag: null, date: null, source: 'none' };

  return {
    owner,
    name,
    pushedAt: toDate(repo.pushed_at),
    archived: repo.archived === true,
    license: repo.license?.spdx_id ?? null,
    latest,
    tagNames,
  };
}

/** 比对单个项目，返回漂移列表。 */
function compareProject(project, state) {
  const drifts = [];
  const claims = extractClaimedVersion(project);
  const updated = toDate(project.updated);

  if (state.archived) {
    drifts.push(`仓库已归档，但站点仍把它当作在更的项目展示。`);
  }

  if (claims.length === 0) {
    if (state.latest.version) {
      drifts.push(`站点没有写版本号，GitHub 已经有 ${state.latest.tag}。`);
    }
  } else if (!state.latest.version) {
    drifts.push(`站点写了版本 ${claims.map(claim => claim.version).join('、')}，但 GitHub 上既没有发行版也没有标签，无法核对。`);
  } else {
    for (const claim of claims) {
      if (claim.version !== state.latest.version) {
        drifts.push(`${claim.source} 写的是 ${claim.version}，GitHub 最新的是 ${state.latest.tag}。`);
      }
    }
  }

  if (updated && state.latest.date && updated < state.latest.date) {
    drifts.push(`站点核对日期 ${updated} 早于最新发行日 ${state.latest.date}，需要重新核对。`);
  }

  if (updated && state.pushedAt && updated < state.pushedAt) {
    drifts.push(`仓库在 ${state.pushedAt} 还有提交，晚于站点核对日期 ${updated}。`);
  }

  return drifts;
}

/* ---------- 输出 ---------- */

function displayWidth(text) {
  let width = 0;
  for (const character of String(text)) {
    width += /[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹯＀-｠￠-￦]/.test(character) ? 2 : 1;
  }
  return width;
}

function pad(text, width) {
  const value = String(text);
  const gap = Math.max(0, width - displayWidth(value));
  return value + ' '.repeat(gap);
}

function renderTable(rows, headers) {
  const widths = headers.map((header, index) => Math.max(displayWidth(header), ...rows.map(row => displayWidth(row[index] ?? ''))));
  const line = (cells) => cells.map((cell, index) => pad(cell ?? '', widths[index])).join('  ').trimEnd();
  return [line(headers), ...rows.map(line)].join('\n');
}

/* ---------- 主流程 ---------- */

async function main() {
  const { projects, checkedAt } = await loadPortfolio();
  if (!projects.length) {
    console.error('没有从 portfolio.ts 读到任何项目，站点内容可能出错了。');
    process.exit(2);
  }

  console.log(`项目数据漂移检查 · ${projects.length} 个公开项目`);
  console.log(`站点核对日期：${checkedAt}`);
  console.log(`GitHub 凭据：${TOKEN ? '使用 GITHUB_TOKEN' : '未设置 GITHUB_TOKEN（匿名请求，配额 60 次/小时）'}`);
  console.log('');

  const rows = [];
  const drifts = [];
  const unverifiable = [];

  for (const project of projects) {
    let state;
    try {
      state = await fetchProjectState(project);
    } catch (error) {
      if (error instanceof GitHubError) {
        if (error.kind === 'not-found') {
          drifts.push({ project, reasons: [error.message] });
          rows.push([project.slug, '—', '不可见', project.updated, '—', '漂移']);
          continue;
        }
        console.error(`网络或 GitHub 错误：${error.message}`);
        if (error.kind === 'rate-limit') {
          console.error('设置 GITHUB_TOKEN 可以提高配额并避免匿名限流。');
        } else {
          console.error('这次没有完成核对，站点内容没有被改动。稍后重试，或设置 GITHUB_TOKEN。');
        }
        process.exit(2);
      }
      throw error;
    }

    const reasons = compareProject(project, state);
    const claims = extractClaimedVersion(project);
    const claimedVersions = [...new Set(claims.map(claim => `v${claim.version}`))];
    const claimed = claimedVersions.length ? claimedVersions.join(' / ') : '—';
    const latest = state.latest.tag ?? '无';
    const pushed = state.pushedAt ?? '—';

    if (reasons.length) {
      drifts.push({ project, reasons });
      rows.push([project.slug, claimed, latest, project.updated, pushed, '漂移']);
    } else {
      rows.push([project.slug, claimed, latest, project.updated, pushed, '一致']);
    }

    if (!state.latest.version && claims.length) {
      unverifiable.push(project.slug);
    }
  }

  console.log(renderTable(rows, ['项目', '站点版本', 'GitHub 最新', '站点 updated', '仓库 pushed_at', '结论']));
  console.log('');

  if (unverifiable.length) {
    console.error(`无法完成核对的仓库：${unverifiable.join('、')}。`);
    process.exit(2);
  }

  if (drifts.length) {
    console.log(`结论：发现 ${drifts.length} 处漂移`);
    for (const drift of drifts) {
      console.log(`  · ${drift.project.slug}`);
      for (const reason of drift.reasons) console.log(`      ${reason}`);
    }
    process.exit(1);
  }

  console.log(`结论：全部一致（${projects.length} 个项目）`);
  process.exit(0);
}

main().catch(error => {
  console.error(`检查失败：${error?.message ?? error}`);
  process.exit(2);
});
