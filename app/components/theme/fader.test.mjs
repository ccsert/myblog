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
  getFaderEdgeOffset,
  getFaderReleaseVelocity,
  getFaderSegmentState,
  getFaderTrackState,
  getThemeAtFaderIndex,
  shouldCommitFaderDrag,
} = await import(moduleUrl);

test('一次拖拽可以在完整四档轨道上连续移动', () => {
  assert.deepEqual(getFaderTrackState('green', 100, 340, 100), {
    edgeOffset: 0,
    position: 2.4,
    rawPosition: 2.4,
  });
});

test('跨过整档后可以用剩余拖拽距离继续预览下一主题', () => {
  assert.deepEqual(getFaderSegmentState('green', 2.4), {
    direction: 1,
    progress: 1,
    targetTheme: 'cyan',
  });

  assert.deepEqual(getFaderSegmentState('cyan', 2.4), {
    direction: 1,
    progress: 1,
    targetTheme: 'amber',
  });

  const finalSegment = getFaderSegmentState('amber', 2.4);
  assert.equal(finalSegment.direction, 1);
  assert.equal(Number(finalSegment.progress.toFixed(4)), 0.4);
  assert.equal(finalSegment.targetTheme, 'light');
});

test('同一次拖拽跨档后仍可反向穿回之前的主题', () => {
  assert.deepEqual(getFaderSegmentState('amber', 0.3), {
    direction: -1,
    progress: 1,
    targetTheme: 'cyan',
  });

  assert.deepEqual(getFaderSegmentState('cyan', 0.3), {
    direction: -1,
    progress: 0.7,
    targetTheme: 'green',
  });
});

test('完整轨道在首尾档位钳制位置并且不会循环穿越', () => {
  const beforeGreen = getFaderTrackState('green', 100, 20, 100);
  assert.equal(beforeGreen.position, 0);
  assert.ok(beforeGreen.rawPosition < 0);
  assert.deepEqual(getFaderSegmentState('green', beforeGreen.position), {
    direction: 0,
    progress: 0,
    targetTheme: 'green',
  });

  const afterLight = getFaderTrackState('light', 100, 180, 100);
  assert.equal(afterLight.position, 3);
  assert.ok(afterLight.rawPosition > 3);
  assert.deepEqual(getFaderSegmentState('light', afterLight.position), {
    direction: 0,
    progress: 0,
    targetTheme: 'light',
  });
});

test('推到轨道边缘时使用递增阻力而不是生硬停住', () => {
  assert.equal(getFaderEdgeOffset(3), 0);
  assert.equal(getFaderEdgeOffset(8), 4);
  assert.equal(getFaderEdgeOffset(30), 8);
  assert.equal(getFaderEdgeOffset(-8), -4);
  assert.deepEqual(getFaderTrackState('green', 100, 92, 100), {
    edgeOffset: -4,
    position: 0,
    rawPosition: -0.08,
  });
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
