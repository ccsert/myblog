import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

/**
 * package-lock.json 的完整性检查。
 *
 * `npm uninstall` 偶尔会留下一条没有 version 字段的可选依赖条目。npm 11 能
 * 容忍它，npm 10 会在安装时抛 `Invalid Version:`，而 Vercel 用的是 npm 10，
 * 于是构建直接失败。本地装得通不代表 CI 装得通，所以在这里守住。
 */
const lockfile = JSON.parse(await readFile(new URL('../../../package-lock.json', import.meta.url), 'utf8'));

test('lockfile 里每个包条目都带版本号', () => {
  const malformed = Object.entries(lockfile.packages)
    .filter(([path, entry]) => path && typeof entry.version !== 'string')
    .map(([path, entry]) => `${path} (${JSON.stringify(entry)})`);

  assert.deepEqual(malformed, []);
});

test('lockfile 的根依赖与 package.json 一致', async () => {
  const manifest = JSON.parse(await readFile(new URL('../../../package.json', import.meta.url), 'utf8'));
  const root = lockfile.packages[''];

  assert.equal(root.name, manifest.name);
  assert.deepEqual(root.dependencies, manifest.dependencies);
  assert.deepEqual(root.devDependencies, manifest.devDependencies);
});
