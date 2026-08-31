import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('./position.ts', import.meta.url), 'utf8');
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
  fileName: 'position.ts',
});
const moduleUrl = `data:text/javascript;base64,${Buffer.from(transpiled.outputText).toString('base64')}`;
const { syncCursorPosition } = await import(moduleUrl);

test('连续移动时自定义光标立即采用最新指针坐标', () => {
  const cursor = { style: { transform: '' } };

  syncCursorPosition(cursor, { clientX: 313, clientY: 247 });
  syncCursorPosition(cursor, { clientX: 1565, clientY: 740 });

  assert.equal(
    cursor.style.transform,
    'translate3d(1565px, 740px, 0) translate(-50%, -50%)',
  );
});

test('光标节点尚未挂载时坐标同步安全跳过', () => {
  assert.doesNotThrow(() => {
    syncCursorPosition(null, { clientX: 100, clientY: 200 });
  });
});
