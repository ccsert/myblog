import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('./portfolio.ts', import.meta.url), 'utf8');
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
  fileName: 'portfolio.ts',
});
const moduleUrl = `data:text/javascript;base64,${Buffer.from(transpiled.outputText).toString('base64')}`;
const {
  KNOWLEDGE_SIGNALS,
  PORTFOLIO_PROJECTS,
  PUBLIC_EVIDENCE_CHECKED_AT,
  SITE_CONFIG,
} = await import(moduleUrl);

test('站点身份集中在单一配置源', () => {
  assert.deepEqual(SITE_CONFIG, {
    domain: 'me.ccsert.top',
    url: 'https://me.ccsert.top',
    email: 'ccsert@foxmail.com',
  });
});

test('公开项目索引只包含唯一、可追溯的 ccsert GitHub 仓库', () => {
  assert.equal(PORTFOLIO_PROJECTS.length, 4);
  assert.equal(new Set(PORTFOLIO_PROJECTS.map(project => project.id)).size, PORTFOLIO_PROJECTS.length);
  assert.equal(new Set(PORTFOLIO_PROJECTS.map(project => project.slug)).size, PORTFOLIO_PROJECTS.length);

  for (const project of PORTFOLIO_PROJECTS) {
    assert.equal(project.repositoryUrl, `https://github.com/ccsert/${project.slug}`);
    assert.match(project.updated, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(project.capabilities.length >= 3);
    assert.equal(project.evidence.length, 3);
  }
});

test('知识信号公开外部来源与发布边界，而不是私有 Wiki 路径', () => {
  assert.equal(KNOWLEDGE_SIGNALS.length, 4);
  assert.equal(new Set(KNOWLEDGE_SIGNALS.map(signal => signal.slug)).size, KNOWLEDGE_SIGNALS.length);

  for (const signal of KNOWLEDGE_SIGNALS) {
    assert.match(signal.sourceUrl, /^https:\/\//);
    assert.doesNotMatch(signal.sourceUrl, /llm-wiki|localhost|private/i);
    assert.ok(signal.boundary.length > 0);
    assert.match(signal.indexed, /^\d{4}-\d{2}-\d{2}$/);
  }
});

test('内容证据快照日期明确记录，避免把静态页面误认为实时数据', () => {
  assert.equal(PUBLIC_EVIDENCE_CHECKED_AT, '2026-10-22');
});
