export type ArchiveRoomPhase =
  | 'dormant'
  | 'diagnosed'
  | 'restoring'
  | 'boot-ready'
  | 'booting'
  | 'online';

export interface ArchiveFacts {
  serverDiagnosed: boolean;
  powerLinkConnected: boolean;
  healthProbeArmed: boolean;
  filterCleared: boolean;
  bootOrderResolved: boolean;
  bootStarted: boolean;
  serverOnline: boolean;
}

export interface ArchiveState {
  schemaVersion: number;
  contentVersion: number;
  roomId: string;
  revision: number;
  processedActionIds: string[];
  discoveredClueIds: string[];
  discoveredSignalIds: string[];
  lastSafeAnchor: string;
  facts: ArchiveFacts;
  puzzles: {
    power: ArchivePuzzleRuntime;
    health: ArchivePuzzleRuntime;
    'boot-order': ArchiveBootOrderRuntime;
  };
}

export interface ArchiveDerivedStatus {
  phase: ArchiveRoomPhase;
  bootReady: boolean;
  restoreCount: number;
  repairs: {
    power: boolean;
    health: boolean;
    bootOrder: boolean;
  };
}

export type ArchivePuzzleId = 'power' | 'health' | 'boot-order';
export type ArchiveCompletionMode = 'unaided' | 'hinted' | 'assisted';
export type ArchiveBootService = 'build' | 'test' | 'deploy';
export type ArchiveMandatoryAction =
  | 'diagnose-server'
  | 'connect-power-link'
  | 'arm-health-probe'
  | 'clear-filter'
  | 'set-boot-order'
  | 'start-boot'
  | 'complete-boot'
  | 'enter-terminal';

export interface ArchivePuzzleRuntime {
  attemptCount: number;
  hintLevel: number;
  completionMode: ArchiveCompletionMode | null;
}

export interface ArchiveBootOrderRuntime extends ArchivePuzzleRuntime {
  order: ArchiveBootService[];
}

export type ArchiveLoadError =
  | 'empty'
  | 'invalid-json'
  | 'invalid-save'
  | 'unsupported-version';

export type ArchiveParseResult =
  | { ok: true; migrated: boolean; state: ArchiveState }
  | { ok: false; error: ArchiveLoadError; state: ArchiveState };

export type ArchiveAction =
  | { type: 'diagnose-server'; actionId?: string }
  | { type: 'connect-power-link'; actionId?: string }
  | { type: 'arm-health-probe'; actionId?: string }
  | { type: 'clear-filter'; actionId?: string }
  | { type: 'set-boot-order'; order: ArchiveBootService[]; actionId?: string }
  | { type: 'request-hint'; puzzleId: ArchivePuzzleId; actionId?: string }
  | { type: 'reset-puzzle'; puzzleId: ArchivePuzzleId; actionId?: string }
  | { type: 'assist-puzzle'; puzzleId: ArchivePuzzleId; actionId?: string }
  | { type: 'discover-clue'; clueId: string; actionId?: string }
  | { type: 'discover-signal'; signalId: string; actionId?: string }
  | { type: 'set-safe-anchor'; anchorId: string; actionId?: string }
  | { type: 'start-boot'; actionId?: string }
  | { type: 'complete-boot'; actionId?: string };
