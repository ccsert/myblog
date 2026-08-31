import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const themeSource = await readFile(new URL('../../lib/theme.ts', import.meta.url), 'utf8');
const themeTranspiled = ts.transpileModule(themeSource, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
  fileName: 'theme.ts',
});
const themeModuleUrl = `data:text/javascript;base64,${Buffer.from(themeTranspiled.outputText).toString('base64')}`;

const faderSource = await readFile(new URL('./fader.ts', import.meta.url), 'utf8');
const faderTranspiled = ts.transpileModule(faderSource, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
  fileName: 'fader.ts',
});
const faderOutput = faderTranspiled.outputText.replaceAll('@/app/lib/theme', themeModuleUrl);
const moduleUrl = `data:text/javascript;base64,${Buffer.from(faderOutput).toString('base64')}`;
const {
  FADER_COMMIT_PROGRESS,
  getFaderDragState,
  getFaderEdgeOffset,
  getFaderReleaseVelocity,
  getThemeAtFaderIndex,
  shouldCommitFaderDrag,
} = await import(moduleUrl);

test('推杆只预览当前主题的相邻档位', () => {
  assert.deepEqual(getFaderDragState('cyan', 100, 150, 100), {
    direction: 1,
    progress: 0.5,
    position: 1.5,
    targetTheme: 'amber',
  });

  assert.deepEqual(getFaderDragState('cyan', 100, 50, 100), {
    direction: -1,
    progress: 0.5,
    position: 0.5,
    targetTheme: 'green',
  });
});

test('首尾档位不会越界或循环穿越', () => {
  assert.deepEqual(getFaderDragState('green', 100, 20, 100), {
    direction: 0,
    progress: 0,
    position: 0,
    targetTheme: 'green',
  });

  assert.deepEqual(getFaderDragState('light', 100, 180, 100), {
    direction: 0,
    progress: 0,
    position: 3,
    targetTheme: 'light',
  });
});

test('推到轨道边缘时使用递增阻力而不是生硬停住', () => {
  assert.equal(getFaderEdgeOffset(3), 0);
  assert.equal(getFaderEdgeOffset(8), 4);
  assert.equal(getFaderEdgeOffset(30), 8);
  assert.equal(getFaderEdgeOffset(-8), -4);
});

test('越过 55% 阈值才按位置提交主题', () => {
  assert.equal(FADER_COMMIT_PROGRESS, 0.55);
  assert.equal(shouldCommitFaderDrag(0.54, 0, 1), false);
  assert.equal(shouldCommitFaderDrag(0.55, 0, 1), true);
});

test('方向一致的快速拨动可以在短行程后提交', () => {
  assert.equal(shouldCommitFaderDrag(0.2, 0.12, 1), true);
  assert.equal(shouldCommitFaderDrag(0.2, -0.12, 1), false);
  assert.equal(shouldCommitFaderDrag(0.1, 0.5, 1), false);
});

test('停顿后松手不会沿用过期的快速拨动速度', () => {
  assert.equal(getFaderReleaseVelocity(0.4, 1000, 1079), 0.4);
  assert.equal(getFaderReleaseVelocity(0.4, 1000, 1081), 0);
});

test('刻度索引会被钳制到四个已知主题', () => {
  assert.equal(getThemeAtFaderIndex(-4), 'green');
  assert.equal(getThemeAtFaderIndex(2), 'amber');
  assert.equal(getThemeAtFaderIndex(99), 'light');
});
