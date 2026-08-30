import type {
  ArchiveAction,
  ArchiveBootService,
  ArchiveDerivedStatus,
  ArchiveMandatoryAction,
  ArchiveParseResult,
  ArchivePuzzleId,
  ArchivePuzzleRuntime,
  ArchiveState,
} from './types';

export type {
  ArchiveAction,
  ArchiveDerivedStatus,
  ArchiveMandatoryAction,
  ArchiveParseResult,
  ArchiveState,
} from './types';

export const ARCHIVE_SAVE_SCHEMA_VERSION = 1;
export const FIRST_ROOM_CONTENT_VERSION = 1;
export const FIRST_ROOM_ID = 'first-room';
export const ARCHIVE_SAVE_STORAGE_KEY = 'signal-archive:save';
export const ARCHIVE_SAVE_BACKUP_STORAGE_KEY = 'signal-archive:save:backup';
export const ARCHIVE_SAVE_TEMP_STORAGE_KEY = 'signal-archive:save:pending';
export const BOOT_ORDER_SOLUTION: ArchiveBootService[] = ['build', 'test', 'deploy'];

function createPuzzleRuntime(): ArchivePuzzleRuntime {
  return { attemptCount: 0, hintLevel: 0, completionMode: null };
}

export function createInitialArchiveState(): ArchiveState {
  return {
    schemaVersion: ARCHIVE_SAVE_SCHEMA_VERSION,
    contentVersion: FIRST_ROOM_CONTENT_VERSION,
    roomId: FIRST_ROOM_ID,
    revision: 0,
    processedActionIds: [],
    discoveredClueIds: [],
    discoveredSignalIds: [],
    lastSafeAnchor: 'entry',
    facts: {
      serverDiagnosed: false,
      powerLinkConnected: false,
      healthProbeArmed: false,
      filterCleared: false,
      bootOrderResolved: false,
      bootStarted: false,
      serverOnline: false,
    },
    puzzles: {
      power: createPuzzleRuntime(),
      health: createPuzzleRuntime(),
      'boot-order': { ...createPuzzleRuntime(), order: [] },
    },
  };
}

export const INITIAL_ARCHIVE_STATE: ArchiveState = createInitialArchiveState();

export function deriveArchiveStatus(state: ArchiveState): ArchiveDerivedStatus {
  const repairs = {
    power: state.facts.powerLinkConnected,
    health: state.facts.healthProbeArmed && state.facts.filterCleared,
    bootOrder: state.facts.bootOrderResolved,
  };
  const restoreCount = Number(repairs.power) + Number(repairs.health) + Number(repairs.bootOrder);
  const bootReady = state.facts.serverDiagnosed && restoreCount === 3 && !state.facts.bootStarted && !state.facts.serverOnline;

  let phase: ArchiveDerivedStatus['phase'] = 'dormant';
  if (state.facts.serverOnline) {
    phase = 'online';
  } else if (state.facts.bootStarted) {
    phase = 'booting';
  } else if (bootReady) {
    phase = 'boot-ready';
  } else if (restoreCount > 0) {
    phase = 'restoring';
  } else if (state.facts.serverDiagnosed) {
    phase = 'diagnosed';
  }

  return {
    phase,
    bootReady,
    restoreCount,
    repairs,
  };
}

function completionModeFor(puzzle: ArchivePuzzleRuntime): 'unaided' | 'hinted' {
  return puzzle.hintLevel > 0 ? 'hinted' : 'unaided';
}

function sameOrder(left: ArchiveBootService[], right: ArchiveBootService[]): boolean {
  return left.length === right.length && left.every((token, index) => token === right[index]);
}

function isBootOrder(order: ArchiveBootService[]): boolean {
  return order.length === 3 && new Set(order).size === 3 && order.every(token => BOOT_ORDER_SOLUTION.includes(token));
}

function isPuzzleResolved(state: ArchiveState, puzzleId: ArchivePuzzleId): boolean {
  if (puzzleId === 'power') return state.facts.powerLinkConnected;
  if (puzzleId === 'health') return state.facts.healthProbeArmed && state.facts.filterCleared;
  return state.facts.bootOrderResolved;
}

function reduceArchiveAction(state: ArchiveState, action: ArchiveAction): ArchiveState {
  if (action.type === 'diagnose-server') {
    if (state.facts.serverDiagnosed) return state;
    return {
      ...state,
      revision: state.revision + 1,
      facts: { ...state.facts, serverDiagnosed: true },
    };
  }

  if (action.type === 'connect-power-link') {
    if (state.facts.powerLinkConnected) return state;
    return {
      ...state,
      revision: state.revision + 1,
      facts: { ...state.facts, powerLinkConnected: true },
      puzzles: {
        ...state.puzzles,
        power: { ...state.puzzles.power, completionMode: completionModeFor(state.puzzles.power) },
      },
    };
  }

  if (action.type === 'arm-health-probe') {
    if (state.facts.healthProbeArmed) return state;
    const completesHealth = state.facts.filterCleared;
    return {
      ...state,
      revision: state.revision + 1,
      facts: { ...state.facts, healthProbeArmed: true },
      puzzles: completesHealth
        ? {
            ...state.puzzles,
            health: { ...state.puzzles.health, completionMode: completionModeFor(state.puzzles.health) },
          }
        : state.puzzles,
    };
  }

  if (action.type === 'clear-filter') {
    if (state.facts.filterCleared) return state;
    const completesHealth = state.facts.healthProbeArmed;
    return {
      ...state,
      revision: state.revision + 1,
      facts: { ...state.facts, filterCleared: true },
      puzzles: completesHealth
        ? {
            ...state.puzzles,
            health: { ...state.puzzles.health, completionMode: completionModeFor(state.puzzles.health) },
          }
        : state.puzzles,
    };
  }

  if (action.type === 'start-boot') {
    if (!deriveArchiveStatus(state).bootReady) return state;
    return {
      ...state,
      revision: state.revision + 1,
      facts: { ...state.facts, bootStarted: true },
    };
  }

  if (action.type === 'complete-boot') {
    const status = deriveArchiveStatus(state);
    if (state.facts.serverOnline || !state.facts.bootStarted || status.restoreCount !== 3 || !state.facts.serverDiagnosed) return state;
    return {
      ...state,
      revision: state.revision + 1,
      facts: { ...state.facts, serverOnline: true },
    };
  }

  if (action.type === 'request-hint') {
    if (isPuzzleResolved(state, action.puzzleId)) return state;
    const puzzle = state.puzzles[action.puzzleId];
    if (puzzle.hintLevel >= 5) return state;
    return {
      ...state,
      revision: state.revision + 1,
      puzzles: {
        ...state.puzzles,
        [action.puzzleId]: { ...puzzle, hintLevel: puzzle.hintLevel + 1 },
      },
    };
  }

  if (action.type === 'reset-puzzle') {
    if (action.puzzleId !== 'boot-order' || state.facts.bootOrderResolved || state.puzzles['boot-order'].order.length === 0) return state;
    return {
      ...state,
      revision: state.revision + 1,
      puzzles: {
        ...state.puzzles,
        'boot-order': { ...state.puzzles['boot-order'], order: [] },
      },
    };
  }

  if (action.type === 'assist-puzzle') {
    if (isPuzzleResolved(state, action.puzzleId)) return state;
    if (action.puzzleId === 'power') {
      return {
        ...state,
        revision: state.revision + 1,
        facts: { ...state.facts, powerLinkConnected: true },
        puzzles: {
          ...state.puzzles,
          power: { ...state.puzzles.power, completionMode: 'assisted' },
        },
      };
    }
    if (action.puzzleId === 'health') {
      return {
        ...state,
        revision: state.revision + 1,
        facts: { ...state.facts, healthProbeArmed: true, filterCleared: true },
        puzzles: {
          ...state.puzzles,
          health: { ...state.puzzles.health, completionMode: 'assisted' },
        },
      };
    }
    return {
      ...state,
      revision: state.revision + 1,
      facts: { ...state.facts, bootOrderResolved: true },
      puzzles: {
        ...state.puzzles,
        'boot-order': {
          ...state.puzzles['boot-order'],
          order: [...BOOT_ORDER_SOLUTION],
          completionMode: 'assisted',
        },
      },
    };
  }

  if (action.type === 'discover-clue') {
    const clueId = action.clueId.trim();
    if (!clueId || state.discoveredClueIds.includes(clueId)) return state;
    return {
      ...state,
      revision: state.revision + 1,
      discoveredClueIds: [...state.discoveredClueIds, clueId],
    };
  }

  if (action.type === 'discover-signal') {
    const signalId = action.signalId.trim();
    if (!signalId || state.discoveredSignalIds.includes(signalId)) return state;
    return {
      ...state,
      revision: state.revision + 1,
      discoveredSignalIds: [...state.discoveredSignalIds, signalId],
    };
  }

  if (action.type === 'set-safe-anchor') {
    const anchorId = action.anchorId.trim();
    if (!anchorId || state.lastSafeAnchor === anchorId) return state;
    return {
      ...state,
      revision: state.revision + 1,
      lastSafeAnchor: anchorId,
    };
  }

  if (action.type !== 'set-boot-order' || state.facts.bootOrderResolved || !isBootOrder(action.order)) return state;
  const currentPuzzle = state.puzzles['boot-order'];
  const solved = sameOrder(action.order, BOOT_ORDER_SOLUTION);

  return {
    ...state,
    revision: state.revision + 1,
    facts: solved ? { ...state.facts, bootOrderResolved: true } : state.facts,
    puzzles: {
      ...state.puzzles,
      'boot-order': {
        ...currentPuzzle,
        order: [...action.order],
        attemptCount: currentPuzzle.attemptCount + (solved ? 0 : 1),
        completionMode: solved ? completionModeFor(currentPuzzle) : null,
      },
    },
  };
}

export function archiveReducer(state: ArchiveState, action: ArchiveAction): ArchiveState {
  if (action.actionId && state.processedActionIds.includes(action.actionId)) return state;

  const nextState = reduceArchiveAction(state, action);
  if (nextState === state || !action.actionId) return nextState;

  return {
    ...nextState,
    processedActionIds: [...nextState.processedActionIds.slice(-127), action.actionId],
  };
}

export function getNextMandatoryAction(state: ArchiveState): ArchiveMandatoryAction {
  if (state.facts.serverOnline) return 'enter-terminal';
  if (state.facts.bootStarted) return 'complete-boot';
  if (!state.facts.serverDiagnosed) return 'diagnose-server';
  if (!state.facts.powerLinkConnected) return 'connect-power-link';
  if (!state.facts.healthProbeArmed) return 'arm-health-probe';
  if (!state.facts.filterCleared) return 'clear-filter';
  if (!state.facts.bootOrderResolved) return 'set-boot-order';
  return 'start-boot';
}

export const reduceArchiveState = archiveReducer;

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isCompletionMode(value: unknown): value is ArchivePuzzleRuntime['completionMode'] {
  return value === null || value === 'unaided' || value === 'hinted' || value === 'assisted';
}

function integerAtLeast(value: unknown, minimum: number, fallback: number): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= minimum ? value : fallback;
}

function stringList(value: unknown, limit = Number.POSITIVE_INFINITY): string[] {
  if (!Array.isArray(value) || !value.every(item => typeof item === 'string')) return [];
  return [...new Set(value)].slice(-limit);
}

function readPuzzleRuntime(value: unknown): ArchivePuzzleRuntime | null {
  if (!isRecord(value) || !isCompletionMode(value.completionMode)) return null;
  return {
    attemptCount: integerAtLeast(value.attemptCount, 0, 0),
    hintLevel: Math.min(5, integerAtLeast(value.hintLevel, 0, 0)),
    completionMode: value.completionMode,
  };
}

function reconcileArchiveState(state: ArchiveState): ArchiveState {
  const repairs = deriveArchiveStatus({
    ...state,
    facts: { ...state.facts, bootStarted: false, serverOnline: false },
  }).repairs;
  const canBoot = state.facts.serverDiagnosed && repairs.power && repairs.health && repairs.bootOrder;
  const serverOnline = state.facts.serverOnline && canBoot;
  const facts = {
    ...state.facts,
    bootStarted: serverOnline || (state.facts.bootStarted && canBoot),
    serverOnline,
  };
  const puzzleMode = (puzzle: ArchivePuzzleRuntime, resolved: boolean): ArchivePuzzleRuntime['completionMode'] => {
    if (!resolved) return null;
    return puzzle.completionMode ?? completionModeFor(puzzle);
  };

  return {
    ...state,
    schemaVersion: ARCHIVE_SAVE_SCHEMA_VERSION,
    contentVersion: FIRST_ROOM_CONTENT_VERSION,
    processedActionIds: stringList(state.processedActionIds, 128),
    discoveredClueIds: stringList(state.discoveredClueIds),
    discoveredSignalIds: stringList(state.discoveredSignalIds),
    lastSafeAnchor: state.lastSafeAnchor || 'entry',
    facts,
    puzzles: {
      power: {
        ...state.puzzles.power,
        completionMode: puzzleMode(state.puzzles.power, repairs.power),
      },
      health: {
        ...state.puzzles.health,
        completionMode: puzzleMode(state.puzzles.health, repairs.health),
      },
      'boot-order': {
        ...state.puzzles['boot-order'],
        order: repairs.bootOrder ? [...BOOT_ORDER_SOLUTION] : state.puzzles['boot-order'].order,
        completionMode: puzzleMode(state.puzzles['boot-order'], repairs.bootOrder),
      },
    },
  };
}

function readCurrentArchiveState(value: UnknownRecord): ArchiveState | null {
  if (!isRecord(value.facts) || !isRecord(value.puzzles)) return null;
  const facts = value.facts;
  const booleanFactNames = [
    'serverDiagnosed',
    'powerLinkConnected',
    'healthProbeArmed',
    'filterCleared',
    'bootOrderResolved',
    'bootStarted',
    'serverOnline',
  ] as const;
  if (!booleanFactNames.every(name => typeof facts[name] === 'boolean')) return null;

  const power = readPuzzleRuntime(value.puzzles.power);
  const health = readPuzzleRuntime(value.puzzles.health);
  const bootOrderRuntime = readPuzzleRuntime(value.puzzles['boot-order']);
  const rawBootOrder = isRecord(value.puzzles['boot-order']) ? value.puzzles['boot-order'].order : null;
  if (!power || !health || !bootOrderRuntime || !Array.isArray(rawBootOrder)) return null;
  const bootOrder = rawBootOrder.filter((token): token is ArchiveBootService => BOOT_ORDER_SOLUTION.includes(token as ArchiveBootService));
  if (bootOrder.length !== rawBootOrder.length || (bootOrder.length > 0 && !isBootOrder(bootOrder))) return null;

  return reconcileArchiveState({
    schemaVersion: ARCHIVE_SAVE_SCHEMA_VERSION,
    contentVersion: integerAtLeast(value.contentVersion, 1, FIRST_ROOM_CONTENT_VERSION),
    roomId: typeof value.roomId === 'string' && value.roomId ? value.roomId : FIRST_ROOM_ID,
    revision: integerAtLeast(value.revision, 0, 0),
    processedActionIds: stringList(value.processedActionIds, 128),
    discoveredClueIds: stringList(value.discoveredClueIds),
    discoveredSignalIds: stringList(value.discoveredSignalIds),
    lastSafeAnchor: typeof value.lastSafeAnchor === 'string' && value.lastSafeAnchor ? value.lastSafeAnchor : 'entry',
    facts: {
      serverDiagnosed: facts.serverDiagnosed as boolean,
      powerLinkConnected: facts.powerLinkConnected as boolean,
      healthProbeArmed: facts.healthProbeArmed as boolean,
      filterCleared: facts.filterCleared as boolean,
      bootOrderResolved: facts.bootOrderResolved as boolean,
      bootStarted: facts.bootStarted as boolean,
      serverOnline: facts.serverOnline as boolean,
    },
    puzzles: {
      power,
      health,
      'boot-order': { ...bootOrderRuntime, order: bootOrder },
    },
  });
}

function migrateLegacyV0(value: UnknownRecord): ArchiveState | null {
  if (!isRecord(value.flags)) return null;
  const flags = value.flags;
  const requiredFlags = [
    'diagnosed',
    'powerConnected',
    'healthProbeArmed',
    'filterCleared',
    'bootOrderResolved',
    'bootStarted',
    'serverOnline',
  ] as const;
  if (!requiredFlags.every(name => typeof flags[name] === 'boolean')) return null;
  const hints = isRecord(value.hintLevels) ? value.hintLevels : {};
  const power = { ...createPuzzleRuntime(), hintLevel: Math.min(5, integerAtLeast(hints.power, 0, 0)) };
  const health = { ...createPuzzleRuntime(), hintLevel: Math.min(5, integerAtLeast(hints.health, 0, 0)) };
  const bootOrderHint = Math.min(5, integerAtLeast(hints.bootOrder, 0, 0));
  const bootOrder = Array.isArray(value.bootOrder)
    ? value.bootOrder.filter((token): token is ArchiveBootService => BOOT_ORDER_SOLUTION.includes(token as ArchiveBootService))
    : [];
  if (Array.isArray(value.bootOrder)
    && (bootOrder.length !== value.bootOrder.length || (bootOrder.length > 0 && !isBootOrder(bootOrder)))) {
    return null;
  }

  return reconcileArchiveState({
    ...createInitialArchiveState(),
    roomId: typeof value.roomId === 'string' && value.roomId ? value.roomId : FIRST_ROOM_ID,
    revision: integerAtLeast(value.revision, 0, 0),
    discoveredClueIds: stringList(value.discoveredClueIds),
    discoveredSignalIds: stringList(value.discoveredSignalIds),
    lastSafeAnchor: typeof value.lastSafeAnchor === 'string' && value.lastSafeAnchor ? value.lastSafeAnchor : 'entry',
    facts: {
      serverDiagnosed: flags.diagnosed as boolean,
      powerLinkConnected: flags.powerConnected as boolean,
      healthProbeArmed: flags.healthProbeArmed as boolean,
      filterCleared: flags.filterCleared as boolean,
      bootOrderResolved: flags.bootOrderResolved as boolean,
      bootStarted: flags.bootStarted as boolean,
      serverOnline: flags.serverOnline as boolean,
    },
    puzzles: {
      power,
      health,
      'boot-order': { ...createPuzzleRuntime(), hintLevel: bootOrderHint, order: bootOrder },
    },
  });
}

export function serializeArchiveState(state: ArchiveState): string {
  return JSON.stringify(state);
}

export function parseArchiveState(raw: string | null): ArchiveParseResult {
  if (raw === null || raw.trim() === '') {
    return { ok: false, error: 'empty', state: createInitialArchiveState() };
  }

  let value: unknown;
  try {
    value = JSON.parse(raw) as unknown;
  } catch {
    return { ok: false, error: 'invalid-json', state: createInitialArchiveState() };
  }
  if (!isRecord(value) || typeof value.schemaVersion !== 'number') {
    return { ok: false, error: 'invalid-save', state: createInitialArchiveState() };
  }
  if (value.schemaVersion > ARCHIVE_SAVE_SCHEMA_VERSION || value.schemaVersion < 0) {
    return { ok: false, error: 'unsupported-version', state: createInitialArchiveState() };
  }
  if (typeof value.contentVersion === 'number' && value.contentVersion > FIRST_ROOM_CONTENT_VERSION) {
    return { ok: false, error: 'unsupported-version', state: createInitialArchiveState() };
  }

  const migrated = value.schemaVersion === 0;
  const state = migrated ? migrateLegacyV0(value) : readCurrentArchiveState(value);
  if (!state) {
    return { ok: false, error: 'invalid-save', state: createInitialArchiveState() };
  }

  return { ok: true, migrated, state };
}
