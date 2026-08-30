import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const stateSource = await readFile(new URL('./state.ts', import.meta.url), 'utf8');
const transpiledState = ts.transpileModule(stateSource, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
  fileName: 'state.ts',
});
const stateModuleUrl = `data:text/javascript;base64,${Buffer.from(transpiledState.outputText).toString('base64')}`;
const {
  createInitialArchiveState,
  deriveArchiveStatus,
  getNextMandatoryAction,
  parseArchiveState,
  reduceArchiveState,
  serializeArchiveState,
} = await import(stateModuleUrl);

test('新档案室从休眠状态开始且尚未达到启动门槛', () => {
  const state = createInitialArchiveState();

  assert.deepEqual(deriveArchiveStatus(state), {
    phase: 'dormant',
    bootReady: false,
    restoreCount: 0,
    repairs: {
      power: false,
      health: false,
      bootOrder: false,
    },
  });
});

test('健康修复允许先运行探针或先清理滤网', () => {
  const probeFirst = reduceArchiveState(
    reduceArchiveState(createInitialArchiveState(), { type: 'arm-health-probe' }),
    { type: 'clear-filter' },
  );
  const filterFirst = reduceArchiveState(
    reduceArchiveState(createInitialArchiveState(), { type: 'clear-filter' }),
    { type: 'arm-health-probe' },
  );

  assert.equal(deriveArchiveStatus(probeFirst).repairs.health, true);
  assert.equal(deriveArchiveStatus(filterFirst).repairs.health, true);
});

test('启动顺序只接受 BUILD → TEST → DEPLOY，同一动作幂等且不同尝试会累计', () => {
  const initial = createInitialArchiveState();
  const wrong = reduceArchiveState(initial, {
    type: 'set-boot-order',
    order: ['deploy', 'test', 'build'],
    actionId: 'boot-attempt-1',
  });
  const duplicate = reduceArchiveState(wrong, {
    type: 'set-boot-order',
    order: ['deploy', 'test', 'build'],
    actionId: 'boot-attempt-1',
  });
  const retried = reduceArchiveState(duplicate, {
    type: 'set-boot-order',
    order: ['deploy', 'test', 'build'],
    actionId: 'boot-attempt-2',
  });
  const resolved = reduceArchiveState(retried, {
    type: 'set-boot-order',
    order: ['build', 'test', 'deploy'],
    actionId: 'boot-attempt-3',
  });

  assert.equal(deriveArchiveStatus(wrong).repairs.bootOrder, false);
  assert.equal(wrong.puzzles['boot-order'].attemptCount, 1);
  assert.strictEqual(duplicate, wrong);
  assert.equal(retried.puzzles['boot-order'].attemptCount, 2);
  assert.equal(deriveArchiveStatus(resolved).repairs.bootOrder, true);
  assert.equal(resolved.puzzles['boot-order'].completionMode, 'unaided');
});

test('访客可先修复后诊断，启动门槛只在三项修复与诊断完成后开放', () => {
  const repaired = [
    { type: 'connect-power-link' },
    { type: 'set-boot-order', order: ['build', 'test', 'deploy'] },
    { type: 'clear-filter' },
    { type: 'arm-health-probe' },
  ].reduce(reduceArchiveState, createInitialArchiveState());

  assert.equal(deriveArchiveStatus(repaired).bootReady, false);
  assert.equal(deriveArchiveStatus(repaired).phase, 'restoring');

  const diagnosed = reduceArchiveState(repaired, { type: 'diagnose-server' });
  assert.equal(deriveArchiveStatus(diagnosed).bootReady, true);
  assert.equal(deriveArchiveStatus(diagnosed).phase, 'boot-ready');

  const booting = reduceArchiveState(diagnosed, { type: 'start-boot' });
  assert.equal(deriveArchiveStatus(booting).phase, 'booting');

  const online = reduceArchiveState(booting, { type: 'complete-boot' });
  assert.equal(deriveArchiveStatus(online).phase, 'online');
  assert.strictEqual(reduceArchiveState(online, { type: 'complete-boot' }), online);
});

test('重置只清理未完成谜题的临时排列，辅助完成不会留下软锁', () => {
  const wrong = reduceArchiveState(createInitialArchiveState(), {
    type: 'set-boot-order',
    order: ['test', 'deploy', 'build'],
  });
  const hinted = reduceArchiveState(wrong, {
    type: 'request-hint',
    puzzleId: 'boot-order',
    actionId: 'hint-1',
  });
  const duplicateHint = reduceArchiveState(hinted, {
    type: 'request-hint',
    puzzleId: 'boot-order',
    actionId: 'hint-1',
  });
  const reset = reduceArchiveState(duplicateHint, {
    type: 'reset-puzzle',
    puzzleId: 'boot-order',
  });
  const assisted = reduceArchiveState(reset, {
    type: 'assist-puzzle',
    puzzleId: 'boot-order',
  });

  assert.strictEqual(duplicateHint, hinted);
  assert.deepEqual(reset.puzzles['boot-order'].order, []);
  assert.equal(reset.puzzles['boot-order'].attemptCount, 1);
  assert.equal(reset.puzzles['boot-order'].hintLevel, 1);
  assert.equal(deriveArchiveStatus(assisted).repairs.bootOrder, true);
  assert.equal(assisted.puzzles['boot-order'].completionMode, 'assisted');
});

test('每个未完成状态都能给出一个不会软锁的下一必修动作', () => {
  let state = createInitialArchiveState();
  assert.equal(getNextMandatoryAction(state), 'diagnose-server');

  state = reduceArchiveState(state, { type: 'diagnose-server' });
  assert.equal(getNextMandatoryAction(state), 'connect-power-link');

  state = reduceArchiveState(state, { type: 'assist-puzzle', puzzleId: 'power' });
  assert.equal(getNextMandatoryAction(state), 'arm-health-probe');

  state = reduceArchiveState(state, { type: 'assist-puzzle', puzzleId: 'health' });
  assert.equal(getNextMandatoryAction(state), 'set-boot-order');

  state = reduceArchiveState(state, { type: 'assist-puzzle', puzzleId: 'boot-order' });
  assert.equal(getNextMandatoryAction(state), 'start-boot');

  state = reduceArchiveState(state, { type: 'start-boot' });
  assert.equal(getNextMandatoryAction(state), 'complete-boot');

  state = reduceArchiveState(state, { type: 'complete-boot' });
  assert.equal(getNextMandatoryAction(state), 'enter-terminal');
});

test('存档可纯函数序列化，并把 v0 状态迁移为当前启动门槛', () => {
  const legacy = JSON.stringify({
    schemaVersion: 0,
    roomId: 'first-room',
    revision: 7,
    flags: {
      diagnosed: true,
      powerConnected: true,
      healthProbeArmed: true,
      filterCleared: true,
      bootOrderResolved: true,
      bootStarted: false,
      serverOnline: false,
    },
    hintLevels: { power: 1, health: 0, bootOrder: 2 },
    bootOrder: ['build', 'test', 'deploy'],
  });

  const migrated = parseArchiveState(legacy);
  assert.equal(migrated.ok, true);
  assert.equal(migrated.migrated, true);
  assert.equal(deriveArchiveStatus(migrated.state).phase, 'boot-ready');
  assert.equal(migrated.state.puzzles.power.hintLevel, 1);
  assert.equal(migrated.state.puzzles['boot-order'].hintLevel, 2);

  const roundTrip = parseArchiveState(serializeArchiveState(migrated.state));
  assert.equal(roundTrip.ok, true);
  assert.equal(roundTrip.migrated, false);
  assert.deepEqual(roundTrip.state, migrated.state);
});

test('损坏或未来版本存档安全回退到全新档案室', () => {
  const malformed = parseArchiveState('{not-json');
  const future = parseArchiveState(JSON.stringify({ schemaVersion: 99 }));
  const futureContent = createInitialArchiveState();
  futureContent.contentVersion = 99;

  assert.deepEqual(malformed, {
    ok: false,
    error: 'invalid-json',
    state: createInitialArchiveState(),
  });
  assert.deepEqual(future, {
    ok: false,
    error: 'unsupported-version',
    state: createInitialArchiveState(),
  });
  assert.equal(parseArchiveState(JSON.stringify(futureContent)).error, 'unsupported-version');
});

test('重复启动令牌和缺少修复的在线状态不会成为可恢复存档', () => {
  const duplicateOrder = createInitialArchiveState();
  duplicateOrder.puzzles['boot-order'].order = ['build', 'build', 'test'];
  const duplicateResult = parseArchiveState(JSON.stringify(duplicateOrder));
  assert.equal(duplicateResult.ok, false);
  assert.equal(duplicateResult.error, 'invalid-save');

  const legacyDuplicate = parseArchiveState(JSON.stringify({
    schemaVersion: 0,
    roomId: 'first-room',
    revision: 3,
    flags: {
      diagnosed: true,
      powerConnected: true,
      healthProbeArmed: true,
      filterCleared: true,
      bootOrderResolved: false,
      bootStarted: false,
      serverOnline: false,
    },
    bootOrder: ['build', 'build', 'test'],
  }));
  assert.equal(legacyDuplicate.ok, false);
  assert.equal(legacyDuplicate.error, 'invalid-save');

  const impossibleOnline = createInitialArchiveState();
  impossibleOnline.facts.serverOnline = true;
  impossibleOnline.facts.bootStarted = true;
  const reconciled = parseArchiveState(JSON.stringify(impossibleOnline));
  assert.equal(reconciled.ok, true);
  assert.equal(reconciled.state.facts.serverOnline, false);
  assert.equal(reconciled.state.facts.bootStarted, false);
  assert.equal(deriveArchiveStatus(reconciled.state).phase, 'dormant');
});

test('线索、信号与安全锚点通过事件单调更新，重复发现不增加 revision', () => {
  const initial = createInitialArchiveState();
  const clue = reduceArchiveState(initial, { type: 'discover-clue', clueId: 'clue.power-topology' });
  const duplicateClue = reduceArchiveState(clue, { type: 'discover-clue', clueId: 'clue.power-topology' });
  const signal = reduceArchiveState(duplicateClue, { type: 'discover-signal', signalId: 'signal.console-trace' });
  const duplicateSignal = reduceArchiveState(signal, { type: 'discover-signal', signalId: 'signal.console-trace' });
  const anchored = reduceArchiveState(duplicateSignal, { type: 'set-safe-anchor', anchorId: 'server-console' });

  assert.deepEqual(clue.discoveredClueIds, ['clue.power-topology']);
  assert.strictEqual(duplicateClue, clue);
  assert.deepEqual(signal.discoveredSignalIds, ['signal.console-trace']);
  assert.strictEqual(duplicateSignal, signal);
  assert.equal(anchored.lastSafeAnchor, 'server-console');
  assert.equal(anchored.revision, initial.revision + 3);
});
