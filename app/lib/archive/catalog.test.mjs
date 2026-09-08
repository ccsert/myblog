import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

async function moduleUrl(file, dependency) {
  const source = await readFile(new URL(file, import.meta.url), 'utf8');
  const result = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } });
  const output = dependency ? result.outputText.replace("'../content/portfolio'", JSON.stringify(dependency)) : result.outputText;
  return `data:text/javascript;base64,${Buffer.from(output).toString('base64')}`;
}
const portfolio = await moduleUrl('../content/portfolio.ts');
const { ARCHIVE_ENTRIES, filterArchiveEntries, archiveEntryFromHash, archiveEntryHref, archiveTerminalHref } = await import(await moduleUrl('./catalog.ts', portfolio));
const { ARCHIVE_STORIES } = await import(await moduleUrl('./stories.ts'));

test('每条档案及其相关线索都指向真实、唯一的公开内容', () => {
  assert.equal(ARCHIVE_ENTRIES.length, 8);
  const slugs = new Set(ARCHIVE_ENTRIES.map(entry => entry.slug));
  assert.equal(slugs.size, 8);
  for (const entry of ARCHIVE_ENTRIES) {
    assert.match(entry.source, /^https:\/\//);
    assert.ok(entry.points.length > 0);
    assert.ok(entry.related.every(slug => slugs.has(slug) && slug !== entry.slug));
    assert.ok(archiveTerminalHref(entry).includes(encodeURIComponent(entry.path)));
  }
});

test('搜索同时支持中文、技术名、多关键词与类型筛选', () => {
  assert.deepEqual(filterArchiveEntries('all', ' RUST ratatui ').map(entry => entry.slug), ['omz-pm']);
  assert.deepEqual(filterArchiveEntries('note', '网络').map(entry => entry.slug), ['network-paths']);
  assert.equal(filterArchiveEntries('project', '网络').length, 0);
  assert.equal(filterArchiveEntries('note', '  ').length, 4);
  assert.equal(filterArchiveEntries('all', 'no-such-public-document').length, 0);
});

test('每条档案均支持分享深链接，损坏或未知链接不打开错误内容', () => {
  for (const entry of ARCHIVE_ENTRIES) assert.equal(archiveEntryFromHash(archiveEntryHref(entry)), entry);
  for (const hash of ['', '#archive-index', '#read=missing', '#read=%E0%A4%A']) assert.equal(archiveEntryFromHash(hash), undefined);
});

test('每条可打开的档案都有阅读内容，关联推荐说明与真实目标一致', () => {
  assert.deepEqual(Object.keys(ARCHIVE_STORIES).sort(), ARCHIVE_ENTRIES.map(entry => entry.slug).sort());
  for (const entry of ARCHIVE_ENTRIES) {
    const story = ARCHIVE_STORIES[entry.slug];
    assert.ok(story.takeaway && story.scene && story.tradeoff);
    assert.ok(story.steps.length > 0);
    assert.deepEqual(Object.keys(story.connections).sort(), [...entry.related].sort());
    assert.ok(Object.values(story.connections).every(reason => reason.trim().length > 0));
  }
});
