'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  List,
  Palette,
  Power,
  RotateCcw,
  SkipForward,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import {
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useSiteTheme } from '@/app/components/theme/SiteThemeProvider';
import {
  FIRST_ROOM_AMBIENT_INTERACTIONS,
  FIRST_ROOM_BOOT_SEQUENCE,
  FIRST_ROOM_CORE_NODES,
  FIRST_ROOM_HIDDEN_ECHOES,
} from '@/app/lib/archive/content';
import {
  ARCHIVE_SAVE_BACKUP_STORAGE_KEY,
  ARCHIVE_SAVE_STORAGE_KEY,
  ARCHIVE_SAVE_TEMP_STORAGE_KEY,
  BOOT_ORDER_SOLUTION,
  archiveReducer,
  createInitialArchiveState,
  deriveArchiveStatus,
  getNextMandatoryAction,
  parseArchiveState,
  serializeArchiveState,
  type ArchiveAction,
  type ArchiveState,
} from '@/app/lib/archive/state';
import type { ArchiveBootService, ArchivePuzzleId } from '@/app/lib/archive/types';
import { getNextSiteTheme, SITE_THEMES } from '@/app/lib/theme';
import styles from './ArchiveExperience.module.css';

type CoreNodeId = (typeof FIRST_ROOM_CORE_NODES)[number]['id'];
type AmbientNodeId = (typeof FIRST_ROOM_AMBIENT_INTERACTIONS)[number]['id'];
type HotspotId = CoreNodeId | AmbientNodeId;
type Facing = 'front' | 'back' | 'left' | 'right';

interface Position {
  x: number;
  y: number;
}

interface HotspotDefinition {
  id: HotspotId;
  x: number;
  y: number;
  approach: Position;
  tier: 'core' | 'ambient';
}

const INTRO_STORAGE_KEY = 'signal-archive:intro-seen';
const HANDOFF_STORAGE_KEY = 'signal-archive:handoff';

const HOTSPOTS: readonly HotspotDefinition[] = [
  { id: 'core.engineering-console', x: 31, y: 36, approach: { x: 39, y: 48 }, tier: 'core' },
  { id: 'core.agent-workstation', x: 62, y: 40, approach: { x: 57, y: 53 }, tier: 'core' },
  { id: 'core.product-blueprint', x: 27, y: 67, approach: { x: 42, y: 72 }, tier: 'core' },
  { id: 'core.field-notes', x: 65, y: 68, approach: { x: 55, y: 59 }, tier: 'core' },
  { id: 'core.server-node', x: 49, y: 55, approach: { x: 43, y: 60 }, tier: 'core' },
  { id: 'ambient.task-lamp', x: 20, y: 58, approach: { x: 40, y: 66 }, tier: 'ambient' },
  { id: 'ambient.work-drawer', x: 29, y: 82, approach: { x: 42, y: 77 }, tier: 'ambient' },
  { id: 'ambient.archive-box', x: 78, y: 33, approach: { x: 71, y: 49 }, tier: 'ambient' },
  { id: 'ambient.rain-window', x: 86, y: 26, approach: { x: 72, y: 43 }, tier: 'ambient' },
] as const;

const SAFE_ANCHORS: Record<string, Position> = {
  entry: { x: 47, y: 76 },
  ...Object.fromEntries(HOTSPOTS.map(hotspot => [hotspot.id, hotspot.approach])),
};

const OBSTACLES = [
  { left: 7, right: 37, top: 20, bottom: 49 },
  { left: 11, right: 39, top: 54, bottom: 85 },
  { left: 53, right: 70, top: 28, bottom: 52 },
  { left: 56, right: 89, top: 60, bottom: 88 },
  { left: 46, right: 54, top: 48, bottom: 63 },
  { left: 73, right: 94, top: 20, bottom: 55 },
] as const;

const BOOT_DETAILS: Record<ArchiveBootService, string> = {
  build: '准备可验证构建',
  test: '验证构建结果与边界',
  deploy: '交付已验证版本',
};

const BOOT_LABELS = Object.fromEntries(FIRST_ROOM_BOOT_SEQUENCE.map(step => [
  step.id,
  { title: step.label.en.toUpperCase(), detail: BOOT_DETAILS[step.id] },
])) as Record<ArchiveBootService, { title: string; detail: string }>;

const BOOT_SEQUENCE_LABEL = FIRST_ROOM_BOOT_SEQUENCE
  .map(step => step.label.en.toUpperCase())
  .join(' → ');

const PHASE_LABELS = {
  dormant: 'Explore',
  diagnosed: 'Diagnose',
  restoring: 'Repair',
  'boot-ready': 'Boot ready',
  booting: 'Booting',
  online: 'Online',
} as const;

const AMBIENT_RESOLVED_LABELS: Record<AmbientNodeId, string> = {
  'ambient.task-lamp': 'LIGHT ON',
  'ambient.work-drawer': 'DRAWER OPEN',
  'ambient.archive-box': 'INDEXED',
  'ambient.rain-window': 'RAIN HEARD',
};

const NEXT_ACTION_HINTS = {
  'diagnose-server': '工程控制台可以把离线状态拆成三条可修复路径。',
  'connect-power-link': '检查服务器旁的断开线路，依次选择供电端与机架端。',
  'arm-health-probe': 'Agent 工作站还没有可信的健康读数。',
  'clear-filter': '探针需要有效气流；清理工作站滤网。',
  'set-boot-order': `产品蓝图记录了 ${BOOT_SEQUENCE_LABEL} 的依赖。`,
  'start-boot': '三条环路已经恢复，回到服务器节点启动。',
  'complete-boot': '启动序列正在运行；可以跳过动画。',
  'enter-terminal': '档案节点在线，可以进入终端继续探索。',
} as const;

const NEXT_ACTION_HOTSPOT: Partial<Record<ReturnType<typeof getNextMandatoryAction>, HotspotId>> = {
  'diagnose-server': 'core.engineering-console',
  'connect-power-link': 'core.server-node',
  'arm-health-probe': 'core.agent-workstation',
  'clear-filter': 'core.agent-workstation',
  'set-boot-order': 'core.product-blueprint',
  'start-boot': 'core.server-node',
  'enter-terminal': 'core.server-node',
};

function isWalkable(position: Position): boolean {
  if (position.x < 14 || position.x > 88 || position.y < 31 || position.y > 88) return false;
  return !OBSTACLES.some(obstacle => (
    position.x > obstacle.left
    && position.x < obstacle.right
    && position.y > obstacle.top
    && position.y < obstacle.bottom
  ));
}

function uniqueActionId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function resolvedCoreNode(nodeId: CoreNodeId, state: ArchiveState): boolean {
  if (nodeId === 'core.engineering-console') return state.facts.serverDiagnosed;
  if (nodeId === 'core.agent-workstation') return state.facts.healthProbeArmed && state.facts.filterCleared;
  if (nodeId === 'core.product-blueprint') return state.facts.bootOrderResolved;
  if (nodeId === 'core.server-node') return state.facts.serverOnline;
  return state.discoveredClueIds.includes('clue.recovery-context');
}

function getUnlockedEchoIds(state: ArchiveState): string[] {
  return FIRST_ROOM_HIDDEN_ECHOES
    .filter(echo => (
      (!echo.requiresServerOnline || state.facts.serverOnline)
      && echo.requiredClueIds.every(clueId => state.discoveredClueIds.includes(clueId))
      && echo.requiredSignalIds.every(signalId => state.discoveredSignalIds.includes(signalId))
    ))
    .map(echo => echo.id);
}

export default function ArchiveExperience() {
  const router = useRouter();
  const { theme, changeTheme } = useSiteTheme();
  const [archiveState, setArchiveState] = useState<ArchiveState>(() => createInitialArchiveState());
  const stateRef = useRef(archiveState);
  const persistAllowedRef = useRef(true);
  const [saveReady, setSaveReady] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [entered, setEntered] = useState(false);
  const [revisitOpen, setRevisitOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<HotspotId>('core.engineering-console');
  const [contextOpen, setContextOpen] = useState(true);
  const [storyOpen, setStoryOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [powerEndpoints, setPowerEndpoints] = useState<Array<'supply' | 'rack'>>([]);
  const [bootDraft, setBootDraft] = useState<ArchiveBootService[]>(['deploy', 'test', 'build']);
  const [player, setPlayer] = useState<Position>(SAFE_ANCHORS.entry);
  const [facing, setFacing] = useState<Facing>('front');
  const [moving, setMoving] = useState(false);
  const [walkFrame, setWalkFrame] = useState<'a' | 'b'>('a');
  const [liveMessage, setLiveMessage] = useState('档案室已加载。');
  const [idleSeconds, setIdleSeconds] = useState(0);
  const [bootOverlay, setBootOverlay] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const movementTimerRef = useRef<number | null>(null);
  const bootTimerRef = useRef<number | null>(null);
  const sceneShellRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const sceneWorldRef = useRef<HTMLDivElement>(null);
  const contextPanelRef = useRef<HTMLElement>(null);
  const storyButtonRef = useRef<HTMLButtonElement>(null);
  const introOverlayRef = useRef<HTMLElement>(null);
  const revisitOverlayRef = useRef<HTMLElement>(null);
  const storyOverlayRef = useRef<HTMLElement>(null);
  const helpOverlayRef = useRef<HTMLElement>(null);
  const bootOverlayRef = useRef<HTMLElement>(null);
  const overlayReturnFocusRef = useRef<HTMLElement | null>(null);

  const status = useMemo(() => deriveArchiveStatus(archiveState), [archiveState]);
  const nextAction = useMemo(() => getNextMandatoryAction(archiveState), [archiveState]);
  const recommendedHotspotId = NEXT_ACTION_HOTSPOT[nextAction];
  const coreNode = FIRST_ROOM_CORE_NODES.find(node => node.id === selectedId);
  const ambientNode = FIRST_ROOM_AMBIENT_INTERACTIONS.find(node => node.id === selectedId);
  const currentTheme = SITE_THEMES.find(item => item.id === theme) ?? SITE_THEMES[0];
  const nextThemeId = getNextSiteTheme(theme);
  const nextTheme = SITE_THEMES.find(item => item.id === nextThemeId) ?? SITE_THEMES[0];
  const unlockedEchoIds = getUnlockedEchoIds(archiveState);
  const discoveredEcho = unlockedEchoIds.includes(FIRST_ROOM_HIDDEN_ECHOES[0].id);
  const discoveredAmbientCount = FIRST_ROOM_AMBIENT_INTERACTIONS
    .filter(node => archiveState.discoveredSignalIds.includes(node.id)).length;

  const commitAction = useCallback((action: ArchiveAction): ArchiveState => {
    const next = archiveReducer(stateRef.current, action);
    stateRef.current = next;
    setArchiveState(next);
    setIdleSeconds(0);
    return next;
  }, []);

  const commitActions = useCallback((actions: ArchiveAction[], message?: string): ArchiveState => {
    let next = stateRef.current;
    for (const action of actions) next = archiveReducer(next, action);
    stateRef.current = next;
    setArchiveState(next);
    setIdleSeconds(0);
    if (message) setLiveMessage(message);
    return next;
  }, []);

  const persistSnapshot = useCallback((snapshot: ArchiveState) => {
    if (!persistAllowedRef.current) {
      setSaveError(true);
      return;
    }
    try {
      const serialized = serializeArchiveState(snapshot);
      if (!parseArchiveState(serialized).ok) throw new Error('invalid archive snapshot');
      const current = window.localStorage.getItem(ARCHIVE_SAVE_STORAGE_KEY);
      if (current && current !== serialized && parseArchiveState(current).ok) {
        window.localStorage.setItem(ARCHIVE_SAVE_BACKUP_STORAGE_KEY, current);
      }
      window.localStorage.setItem(ARCHIVE_SAVE_TEMP_STORAGE_KEY, serialized);
      if (window.localStorage.getItem(ARCHIVE_SAVE_TEMP_STORAGE_KEY) !== serialized) {
        throw new Error('archive snapshot verification failed');
      }
      window.localStorage.setItem(ARCHIVE_SAVE_STORAGE_KEY, serialized);
      window.localStorage.removeItem(ARCHIVE_SAVE_TEMP_STORAGE_KEY);
      setSaveError(false);
    } catch {
      setSaveError(true);
    }
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      let rawSave: string | null = null;
      let rawPending: string | null = null;
      let rawBackup: string | null = null;
      let introSeen = false;
      try {
        rawSave = window.localStorage.getItem(ARCHIVE_SAVE_STORAGE_KEY);
        rawPending = window.localStorage.getItem(ARCHIVE_SAVE_TEMP_STORAGE_KEY);
        rawBackup = window.localStorage.getItem(ARCHIVE_SAVE_BACKUP_STORAGE_KEY);
        introSeen = window.localStorage.getItem(INTRO_STORAGE_KEY) === 'true';
      } catch {
        setSaveError(true);
      }
      const primaryParsed = parseArchiveState(rawSave);
      const pendingParsed = parseArchiveState(rawPending);
      const backupParsed = parseArchiveState(rawBackup);
      let parsed = primaryParsed;
      let recoveredFrom: 'pending' | 'backup' | null = null;
      if (!primaryParsed.ok && primaryParsed.error === 'unsupported-version') {
        persistAllowedRef.current = false;
      }
      for (const candidate of [
        { source: 'pending' as const, result: pendingParsed },
        { source: 'backup' as const, result: backupParsed },
      ]) {
        if (!candidate.result.ok) continue;
        if (!parsed.ok || candidate.result.state.revision > parsed.state.revision) {
          parsed = candidate.result;
          recoveredFrom = candidate.source;
        }
      }
      stateRef.current = parsed.state;
      setArchiveState(parsed.state);
      setPlayer(SAFE_ANCHORS[parsed.state.lastSafeAnchor] ?? SAFE_ANCHORS.entry);
      setBootDraft(
        parsed.state.puzzles['boot-order'].order.length === 3
          ? [...parsed.state.puzzles['boot-order'].order]
          : ['deploy', 'test', 'build'],
      );
      setEntered(parsed.state.facts.serverOnline ? false : introSeen);
      setRevisitOpen(parsed.state.facts.serverOnline);
      if (window.matchMedia('(max-width: 700px)').matches) setContextOpen(false);
      setSaveReady(true);
      if (!persistAllowedRef.current) {
        setLiveMessage('检测到由更新版本写入的存档；原文件已保留，本次探索不会覆盖它。');
      } else if (recoveredFrom) {
        setLiveMessage(recoveredFrom === 'pending'
            ? '检测到更新的未完成写入，已从最新校验快照恢复。'
          : '主存档不可用，已从上一份有效存档恢复。');
      } else if (!parsed.ok && parsed.error !== 'empty') {
        setLiveMessage('未能读取旧存档，已进入安全的新会话；终端仍可直接访问。');
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const activeOverlay = bootOverlay
      ? bootOverlayRef.current
      : helpOpen
        ? helpOverlayRef.current
        : storyOpen
          ? storyOverlayRef.current
          : revisitOpen
            ? revisitOverlayRef.current
            : saveReady && !entered
              ? introOverlayRef.current
              : null;
    if (!activeOverlay) return;

    const getFocusable = () => Array.from(activeOverlay.querySelectorAll<HTMLElement>(
      'a[href], button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])',
    )).filter(element => element.getClientRects().length > 0);
    getFocusable()[0]?.focus({ preventScroll: true });

    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const focusable = getFocusable();
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement;
      if (event.shiftKey && (current === first || !activeOverlay.contains(current))) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && (current === last || !activeOverlay.contains(current))) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    };

    activeOverlay.addEventListener('keydown', trapFocus);
    return () => {
      activeOverlay.removeEventListener('keydown', trapFocus);
    };
  }, [bootOverlay, entered, helpOpen, revisitOpen, saveReady, storyOpen]);

  useEffect(() => {
    stateRef.current = archiveState;
    if (saveReady) window.queueMicrotask(() => persistSnapshot(archiveState));
  }, [archiveState, persistSnapshot, saveReady]);

  useEffect(() => {
    if (!saveReady || !entered || storyOpen || helpOpen || bootOverlay || archiveState.facts.serverOnline) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setIdleSeconds(seconds => seconds + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [archiveState.facts.serverOnline, bootOverlay, entered, helpOpen, saveReady, storyOpen]);

  useEffect(() => () => {
    if (movementTimerRef.current !== null) window.clearTimeout(movementTimerRef.current);
    if (bootTimerRef.current !== null) window.clearTimeout(bootTimerRef.current);
  }, []);

  useEffect(() => {
    if (!entered || !window.matchMedia('(max-width: 700px)').matches) return;
    const frame = window.requestAnimationFrame(() => {
      const shell = sceneShellRef.current;
      const scene = sceneRef.current;
      if (!shell || !scene) return;
      const targetLeft = scene.offsetLeft + (scene.offsetWidth * player.x) / 100 - shell.clientWidth / 2;
      shell.scrollTo({ left: Math.max(0, targetLeft), behavior: reducedMotion ? 'auto' : 'smooth' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [entered, player.x, player.y, reducedMotion]);

  const movePlayerTo = useCallback((nextPosition: Position) => {
    const bounded = {
      x: Math.max(14, Math.min(88, nextPosition.x)),
      y: Math.max(31, Math.min(88, nextPosition.y)),
    };
    if (!isWalkable(bounded)) {
      setLiveMessage('这里被设备挡住了；沿着地面的信号线移动。');
      return;
    }

    const deltaX = bounded.x - player.x;
    const deltaY = bounded.y - player.y;
    if (Math.abs(deltaX) >= Math.abs(deltaY)) setFacing(deltaX >= 0 ? 'right' : 'left');
    else setFacing(deltaY >= 0 ? 'front' : 'back');

    setPlayer(bounded);
    setMoving(true);
    setWalkFrame(frame => frame === 'a' ? 'b' : 'a');
    if (movementTimerRef.current !== null) window.clearTimeout(movementTimerRef.current);
    movementTimerRef.current = window.setTimeout(() => setMoving(false), reducedMotion ? 40 : 240);
  }, [player.x, player.y, reducedMotion]);

  const selectHotspot = useCallback((hotspot: HotspotDefinition, move = true) => {
    setSelectedId(hotspot.id);
    setContextOpen(true);
    if (move) movePlayerTo(hotspot.approach);
    if (isWalkable(hotspot.approach)) commitAction({ type: 'set-safe-anchor', anchorId: hotspot.id });
    const title = FIRST_ROOM_CORE_NODES.find(node => node.id === hotspot.id)?.title.zh
      ?? FIRST_ROOM_AMBIENT_INTERACTIONS.find(node => node.id === hotspot.id)?.title.zh
      ?? '未知节点';
    setLiveMessage(`已选择：${title}。`);
    window.requestAnimationFrame(() => contextPanelRef.current?.focus({ preventScroll: true }));
  }, [commitAction, movePlayerTo]);

  const handleStagePointer = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!entered || storyOpen || helpOpen || bootOverlay) return;
    if ((event.target as HTMLElement).closest('button, a')) return;
    const rect = sceneWorldRef.current?.getBoundingClientRect() ?? event.currentTarget.getBoundingClientRect();
    movePlayerTo({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    });
    if (window.matchMedia('(max-width: 700px)').matches) setContextOpen(false);
    event.currentTarget.focus({ preventScroll: true });
  };

  const interactNearest = useCallback(() => {
    const nearest = [...HOTSPOTS].sort((left, right) => {
      const leftDistance = Math.hypot(left.approach.x - player.x, left.approach.y - player.y);
      const rightDistance = Math.hypot(right.approach.x - player.x, right.approach.y - player.y);
      return leftDistance - rightDistance;
    })[0];
    if (!nearest) return;
    const distance = Math.hypot(nearest.approach.x - player.x, nearest.approach.y - player.y);
    if (distance > 9) {
      setLiveMessage('距离设备还太远；沿信号线靠近后再查看。');
      return;
    }
    selectHotspot(nearest, false);
  }, [player.x, player.y, selectHotspot]);

  const handleStageKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    const key = event.key.toLowerCase();
    const step = event.shiftKey ? 3.2 : 1.7;
    let nextPosition: Position | null = null;
    if (key === 'arrowleft' || key === 'a') nextPosition = { x: player.x - step, y: player.y };
    if (key === 'arrowright' || key === 'd') nextPosition = { x: player.x + step, y: player.y };
    if (key === 'arrowup' || key === 'w') nextPosition = { x: player.x, y: player.y - step };
    if (key === 'arrowdown' || key === 's') nextPosition = { x: player.x, y: player.y + step };
    if (nextPosition) {
      event.preventDefault();
      movePlayerTo(nextPosition);
      return;
    }
    if (key === 'e' || key === 'enter') {
      event.preventDefault();
      interactNearest();
    }
  };

  const discoverCore = useCallback((nodeId: CoreNodeId) => {
    const node = FIRST_ROOM_CORE_NODES.find(item => item.id === nodeId);
    if (!node) return;
    const actions: ArchiveAction[] = [
      { type: 'discover-signal', signalId: node.id, actionId: `discover-${node.id}` },
    ];
    if (node.discoveredClueId) {
      actions.push({ type: 'discover-clue', clueId: node.discoveredClueId, actionId: `discover-${node.discoveredClueId}` });
    }
    if (nodeId === 'core.engineering-console') actions.unshift({ type: 'diagnose-server', actionId: 'diagnose-first-room' });
    if (nodeId === 'core.agent-workstation') actions.unshift({ type: 'arm-health-probe', actionId: 'arm-health-probe' });
    commitActions(actions, node.resolvedFeedback.zh);
  }, [commitActions]);

  const discoverAmbient = useCallback((nodeId: AmbientNodeId) => {
    const node = FIRST_ROOM_AMBIENT_INTERACTIONS.find(item => item.id === nodeId);
    if (!node) return;
    commitAction({ type: 'discover-signal', signalId: node.id, actionId: `discover-${node.id}` });
    setLiveMessage(node.feedback.zh);
  }, [commitAction]);

  const togglePowerEndpoint = (endpoint: 'supply' | 'rack') => {
    setPowerEndpoints(current => current.includes(endpoint)
      ? current.filter(item => item !== endpoint)
      : [...current, endpoint]);
  };

  const connectPower = useCallback(() => {
    if (!powerEndpoints.includes('supply') || !powerEndpoints.includes('rack')) {
      setLiveMessage('先选择供电端与机架端，再建立连接。');
      return;
    }
    commitActions([
      { type: 'connect-power-link', actionId: 'connect-first-room-power' },
      { type: 'discover-signal', signalId: 'repair.power-link', actionId: 'discover-repair-power' },
      { type: 'discover-signal', signalId: 'core.server-node', actionId: 'discover-core-server-node' },
      { type: 'discover-clue', clueId: 'clue.safe-terminal', actionId: 'discover-clue-safe-terminal' },
    ], '电源链路已连接。恢复进度已更新。');
  }, [commitActions, powerEndpoints]);

  const clearFilter = useCallback(() => {
    commitActions([
      { type: 'clear-filter', actionId: 'clear-first-room-filter' },
      { type: 'discover-signal', signalId: 'repair.health-loop', actionId: 'discover-repair-health' },
    ], '滤网已清理；健康循环会在探针就绪后自动稳定。');
  }, [commitActions]);

  const armProbe = useCallback(() => {
    commitActions([
      { type: 'arm-health-probe', actionId: 'arm-health-probe' },
      { type: 'discover-clue', clueId: 'clue.agent-observability', actionId: 'discover-clue-agent-observability' },
      { type: 'discover-signal', signalId: 'core.agent-workstation', actionId: 'discover-core-agent-workstation' },
    ], archiveState.facts.filterCleared
      ? '探针已经建立可信基线；健康循环恢复。'
      : '探针已启动；等待滤网恢复有效气流。');
  }, [archiveState.facts.filterCleared, commitActions]);

  const moveBootToken = (index: number, direction: -1 | 1) => {
    setBootDraft(current => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  };

  const validateBootOrder = useCallback(() => {
    const next = commitActions([
      { type: 'set-boot-order', order: bootDraft, actionId: uniqueActionId('boot-order-attempt') },
      { type: 'discover-clue', clueId: 'clue.boot-dependency', actionId: 'discover-clue-boot-dependency' },
      { type: 'discover-signal', signalId: 'core.product-blueprint', actionId: 'discover-core-product-blueprint' },
    ]);
    if (next.facts.bootOrderResolved) {
      setLiveMessage(`启动依赖成立：${BOOT_SEQUENCE_LABEL}。`);
    } else {
      const attempts = next.puzzles['boot-order'].attemptCount;
      setLiveMessage(attempts >= 2
        ? '仍有依赖冲突：构建产物必须先存在，验证通过后才能交付。'
        : '顺序尚未成立；检查每一步依赖的输入。');
    }
  }, [bootDraft, commitActions]);

  const currentPuzzleId = useMemo<ArchivePuzzleId | null>(() => {
    if (nextAction === 'connect-power-link') return 'power';
    if (nextAction === 'arm-health-probe' || nextAction === 'clear-filter') return 'health';
    if (nextAction === 'set-boot-order') return 'boot-order';
    return null;
  }, [nextAction]);

  const requestHint = useCallback(() => {
    overlayReturnFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : sceneRef.current;
    if (currentPuzzleId) {
      const next = commitAction({
        type: 'request-hint',
        puzzleId: currentPuzzleId,
        actionId: uniqueActionId(`hint-${currentPuzzleId}`),
      });
      setLiveMessage(`${NEXT_ACTION_HINTS[nextAction]}（提示 ${next.puzzles[currentPuzzleId].hintLevel}/5）`);
    } else {
      setLiveMessage(NEXT_ACTION_HINTS[nextAction]);
    }
    setHelpOpen(true);
  }, [commitAction, currentPuzzleId, nextAction]);

  const showSignalPath = useCallback(() => {
    const targetId = NEXT_ACTION_HOTSPOT[nextAction];
    const target = HOTSPOTS.find(hotspot => hotspot.id === targetId);
    if (target) selectHotspot(target);
    overlayReturnFocusRef.current = null;
    setHelpOpen(false);
  }, [nextAction, selectHotspot]);

  const assistCurrentStep = useCallback(() => {
    if (currentPuzzleId) {
      const actions: ArchiveAction[] = [
        { type: 'assist-puzzle', puzzleId: currentPuzzleId, actionId: uniqueActionId(`assist-${currentPuzzleId}`) },
      ];
      if (currentPuzzleId === 'power') {
        actions.push(
          { type: 'discover-signal', signalId: 'repair.power-link', actionId: 'assist-discover-repair-power' },
          { type: 'discover-signal', signalId: 'core.server-node', actionId: 'assist-discover-server-node' },
          { type: 'discover-clue', clueId: 'clue.safe-terminal', actionId: 'assist-discover-safe-terminal' },
        );
      } else if (currentPuzzleId === 'health') {
        actions.push(
          { type: 'discover-signal', signalId: 'repair.health-loop', actionId: 'assist-discover-repair-health' },
          { type: 'discover-signal', signalId: 'core.agent-workstation', actionId: 'assist-discover-agent-workstation' },
          { type: 'discover-clue', clueId: 'clue.agent-observability', actionId: 'assist-discover-agent-observability' },
        );
      } else {
        actions.push(
          { type: 'discover-signal', signalId: 'repair.boot-order', actionId: 'assist-discover-repair-boot-order' },
          { type: 'discover-signal', signalId: 'core.product-blueprint', actionId: 'assist-discover-product-blueprint' },
          { type: 'discover-clue', clueId: 'clue.boot-dependency', actionId: 'assist-discover-boot-dependency' },
        );
      }
      const next = commitActions(actions);
      if (currentPuzzleId === 'boot-order') setBootDraft([...BOOT_ORDER_SOLUTION]);
      setLiveMessage(`已辅助完成当前步骤。恢复进度 ${deriveArchiveStatus(next).restoreCount}/3。`);
    } else if (nextAction === 'diagnose-server') {
      discoverCore('core.engineering-console');
    }
    overlayReturnFocusRef.current = null;
    setHelpOpen(false);
    window.requestAnimationFrame(() => contextPanelRef.current?.focus({ preventScroll: true }));
  }, [commitActions, currentPuzzleId, discoverCore, nextAction]);

  const handoffToTerminal = useCallback((snapshot = stateRef.current) => {
    persistSnapshot(snapshot);
    if (snapshot.facts.serverOnline) {
      const handoffId = window.crypto.randomUUID?.() ?? uniqueActionId('handoff');
      try {
        window.sessionStorage.setItem(HANDOFF_STORAGE_KEY, JSON.stringify({
          handoffId,
          source: 'signal-archive',
          roomId: snapshot.roomId,
          serverState: 'online',
          repairSummary: ['power', 'health', 'boot order'],
          discoveredStoryIds: [...new Set([
            ...snapshot.discoveredSignalIds,
            ...getUnlockedEchoIds(snapshot),
          ])],
        }));
      } catch {
        // Storage is optional; navigation to the terminal must remain available.
      }
    }
    router.push('/?archive=online');
  }, [persistSnapshot, router]);

  const finishBoot = useCallback(() => {
    if (bootTimerRef.current !== null) window.clearTimeout(bootTimerRef.current);
    const online = commitAction({ type: 'complete-boot', actionId: 'complete-first-room-boot' });
    persistSnapshot(online);
    setLiveMessage('本地档案节点已上线，正在进入终端。');
    setBootOverlay(false);
    window.setTimeout(() => handoffToTerminal(online), reducedMotion ? 0 : 420);
  }, [commitAction, handoffToTerminal, persistSnapshot, reducedMotion]);

  const beginBoot = useCallback(() => {
    const booting = commitAction({ type: 'start-boot', actionId: 'start-first-room-boot' });
    if (!booting.facts.bootStarted) {
      setLiveMessage('启动门槛尚未满足；查看右下角的三项恢复状态。');
      return;
    }
    persistSnapshot(booting);
    setBootOverlay(true);
    setLiveMessage('启动序列开始。按 Escape 或“跳过动画”可直接完成。');
    bootTimerRef.current = window.setTimeout(finishBoot, reducedMotion ? 140 : 3800);
  }, [commitAction, finishBoot, persistSnapshot, reducedMotion]);

  useEffect(() => {
    if (!saveReady || !archiveState.facts.bootStarted || archiveState.facts.serverOnline || bootOverlay) return;
    const resumeTimer = window.setTimeout(() => {
      setBootOverlay(true);
      bootTimerRef.current = window.setTimeout(finishBoot, reducedMotion ? 140 : 1200);
    }, 0);
    return () => window.clearTimeout(resumeTimer);
  }, [archiveState.facts.bootStarted, archiveState.facts.serverOnline, bootOverlay, finishBoot, reducedMotion, saveReady]);

  useEffect(() => {
    if (!bootOverlay) return;
    const skipOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') finishBoot();
    };
    window.addEventListener('keydown', skipOnEscape);
    return () => window.removeEventListener('keydown', skipOnEscape);
  }, [bootOverlay, finishBoot]);

  const beginExplore = (openStory = false) => {
    try {
      window.localStorage.setItem(INTRO_STORAGE_KEY, 'true');
    } catch {
      setSaveError(true);
    }
    if (openStory) overlayReturnFocusRef.current = storyButtonRef.current ?? sceneRef.current;
    setEntered(true);
    setStoryOpen(openStory);
    setLiveMessage(openStory ? '已打开故事列表模式。' : '使用方向键、WASD 或点击地面移动；靠近设备后按 E。');
    if (!openStory) window.requestAnimationFrame(() => sceneRef.current?.focus({ preventScroll: true }));
  };

  const closeStory = () => {
    setStoryOpen(false);
    window.requestAnimationFrame(() => {
      const target = overlayReturnFocusRef.current ?? storyButtonRef.current ?? sceneRef.current;
      overlayReturnFocusRef.current = null;
      target?.focus({ preventScroll: true });
    });
  };

  const closeHelp = () => {
    setHelpOpen(false);
    window.requestAnimationFrame(() => {
      const target = overlayReturnFocusRef.current ?? sceneRef.current;
      overlayReturnFocusRef.current = null;
      target?.focus({ preventScroll: true });
    });
  };

  const resetArchive = () => {
    if (!window.confirm('重置首房的修复、线索与探索记录？终端仍可直接访问。')) return false;
    const initial = createInitialArchiveState();
    persistAllowedRef.current = true;
    stateRef.current = initial;
    setArchiveState(initial);
    setPlayer(SAFE_ANCHORS.entry);
    setSelectedId('core.engineering-console');
    setBootDraft(['deploy', 'test', 'build']);
    setPowerEndpoints([]);
    try {
      window.localStorage.setItem(ARCHIVE_SAVE_STORAGE_KEY, serializeArchiveState(initial));
      window.localStorage.removeItem(ARCHIVE_SAVE_BACKUP_STORAGE_KEY);
      window.localStorage.removeItem(ARCHIVE_SAVE_TEMP_STORAGE_KEY);
      setSaveError(false);
    } catch {
      setSaveError(true);
    }
    setLiveMessage('首房已经重置。');
    return true;
  };

  const continueRevisit = () => {
    setRevisitOpen(false);
    setEntered(true);
    setLiveMessage(discoveredEcho
      ? '隐藏回响已对齐；你可以继续检查房间，或从服务器返回终端。'
      : '节点保持在线。房间中还有不影响启动的环境记录与隐藏回响。');
    window.requestAnimationFrame(() => sceneRef.current?.focus({ preventScroll: true }));
  };

  const replayArchive = () => {
    if (!resetArchive()) return;
    setRevisitOpen(false);
    setEntered(true);
    setContextOpen(!window.matchMedia('(max-width: 700px)').matches);
    window.requestAnimationFrame(() => sceneRef.current?.focus({ preventScroll: true }));
  };

  const playerSprite = `/game/signal-archive/characters/archivist/runtime/${moving ? `walk-${facing}-${walkFrame}` : `idle-${facing}`}.png`;
  const autoHintVisible = idleSeconds >= 45;
  const backgroundInert = !entered || revisitOpen || storyOpen || helpOpen || bootOverlay;

  const renderPowerControls = (scope: string) => (
    <div className={styles.puzzleBlock} aria-label="电源链路维修">
      <div className={styles.endpointGrid}>
        <button
          type="button"
          className={styles.endpointButton}
          data-selected={powerEndpoints.includes('supply')}
          aria-pressed={powerEndpoints.includes('supply')}
          onClick={() => togglePowerEndpoint('supply')}
        >
          <Zap size={15} aria-hidden="true" /> 供电端
        </button>
        <button
          type="button"
          className={styles.endpointButton}
          data-selected={powerEndpoints.includes('rack')}
          aria-pressed={powerEndpoints.includes('rack')}
          onClick={() => togglePowerEndpoint('rack')}
        >
          <Power size={15} aria-hidden="true" /> 机架端
        </button>
      </div>
      <button
        id={`${scope}-connect-power`}
        type="button"
        className={styles.primaryAction}
        onClick={connectPower}
        disabled={archiveState.facts.powerLinkConnected}
      >
        {archiveState.facts.powerLinkConnected ? <><Check size={15} /> 电源已连接</> : <><ArrowRight size={15} /> 建立连接</>}
      </button>
    </div>
  );

  const renderBootOrder = (scope: string) => (
    <div className={styles.puzzleBlock} aria-label="启动顺序维修">
      <p className={styles.puzzleLead}>把三个阶段调整为有效依赖，再验证顺序。</p>
      <ol className={styles.bootOrderList}>
        {bootDraft.map((token, index) => (
          <li key={token} className={styles.bootToken}>
            <span className={styles.bootIndex}>{index + 1}</span>
            <span>
              <strong>{BOOT_LABELS[token].title}</strong>
              <small>{BOOT_LABELS[token].detail}</small>
            </span>
            <span className={styles.reorderActions}>
              <button
                type="button"
                aria-label={`上移 ${BOOT_LABELS[token].title}`}
                onClick={() => moveBootToken(index, -1)}
                disabled={index === 0 || archiveState.facts.bootOrderResolved}
              >
                <ChevronUp size={15} aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label={`下移 ${BOOT_LABELS[token].title}`}
                onClick={() => moveBootToken(index, 1)}
                disabled={index === bootDraft.length - 1 || archiveState.facts.bootOrderResolved}
              >
                <ChevronDown size={15} aria-hidden="true" />
              </button>
            </span>
          </li>
        ))}
      </ol>
      <button
        id={`${scope}-validate-boot-order`}
        type="button"
        className={styles.primaryAction}
        onClick={validateBootOrder}
        disabled={archiveState.facts.bootOrderResolved}
      >
        {archiveState.facts.bootOrderResolved ? <><Check size={15} /> 顺序已确认</> : <><ArrowRight size={15} /> 验证顺序</>}
      </button>
    </div>
  );

  const renderNodeControls = (nodeId: CoreNodeId, scope: string) => {
    if (nodeId === 'core.engineering-console') {
      return (
        <button type="button" className={styles.primaryAction} onClick={() => discoverCore(nodeId)} disabled={archiveState.facts.serverDiagnosed}>
          {archiveState.facts.serverDiagnosed ? <><Check size={15} /> 信号已扫描</> : <><ArrowRight size={15} /> 扫描信号</>}
        </button>
      );
    }
    if (nodeId === 'core.agent-workstation') {
      return (
        <div className={styles.actionStack}>
          <button type="button" className={styles.primaryAction} onClick={armProbe} disabled={archiveState.facts.healthProbeArmed}>
            {archiveState.facts.healthProbeArmed ? <><Check size={15} /> 探针已启动</> : <><ArrowRight size={15} /> 启动健康探针</>}
          </button>
          <button type="button" className={styles.secondaryAction} onClick={clearFilter} disabled={archiveState.facts.filterCleared}>
            {archiveState.facts.filterCleared ? <><Check size={15} /> 滤网已清理</> : '清理滤网'}
          </button>
        </div>
      );
    }
    if (nodeId === 'core.product-blueprint') return renderBootOrder(scope);
    if (nodeId === 'core.field-notes') {
      return (
        <button type="button" className={styles.primaryAction} onClick={() => discoverCore(nodeId)} disabled={archiveState.discoveredClueIds.includes('clue.recovery-context')}>
          {archiveState.discoveredClueIds.includes('clue.recovery-context') ? <><Check size={15} /> 记录已对齐</> : <><ArrowRight size={15} /> 对齐记录</>}
        </button>
      );
    }
    return (
      <div className={styles.actionStack}>
        {renderPowerControls(scope)}
        {status.bootReady ? (
          <button type="button" className={styles.bootAction} onClick={beginBoot}>
            <Power size={16} aria-hidden="true" /> 启动并进入终端
          </button>
        ) : archiveState.facts.serverOnline ? (
          <button type="button" className={styles.bootAction} onClick={() => handoffToTerminal()}>
            <ArrowRight size={16} aria-hidden="true" /> 打开在线终端
          </button>
        ) : (
          <button type="button" className={styles.secondaryAction} onClick={() => discoverCore(nodeId)}>
            检查节点状态
          </button>
        )}
      </div>
    );
  };

  return (
    <main className={styles.archive} data-phase={status.phase} data-reduced-motion={reducedMotion}>
      {entered && contextOpen && !storyOpen && !helpOpen && !bootOverlay ? (
        <a className={styles.skipLink} href="#archive-actions">跳到档案操作</a>
      ) : null}

      <header className={styles.archiveHeader} inert={backgroundInert}>
        <div className={styles.brandBlock}>
          <Link href="/" className={styles.brand}>ccsert<span>.dev</span></Link>
          <span className={styles.archiveTitle}>THE SIGNAL ARCHIVE</span>
        </div>

        <ol className={styles.phaseRail} aria-label="档案室恢复阶段">
          {['Explore', 'Diagnose', 'Repair', 'Boot'].map((phase, index) => {
            const activeIndex = status.phase === 'dormant' ? 0
              : status.phase === 'diagnosed' ? 1
                : status.phase === 'restoring' ? 2
                  : 3;
            return (
              <li key={phase} data-active={index === activeIndex} data-complete={index < activeIndex || status.phase === 'online'}>
                <span>{phase}</span>
              </li>
            );
          })}
        </ol>

        <nav className={styles.headerActions} aria-label="档案室全局操作">
          <button
            ref={storyButtonRef}
            type="button"
            className={styles.iconAction}
            onClick={() => {
              overlayReturnFocusRef.current = storyButtonRef.current;
              setStoryOpen(true);
            }}
            aria-label="打开故事列表模式"
            title="故事列表模式"
          >
            <List size={17} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={styles.iconAction}
            onClick={event => changeTheme(nextThemeId, { origin: { x: event.clientX, y: event.clientY } })}
            aria-label={`当前主题：${currentTheme.label}；切换到：${nextTheme.label}`}
            title={`Theme: ${currentTheme.label} → ${nextTheme.label}`}
          >
            <Palette size={17} aria-hidden="true" />
          </button>
          <Link href="/" className={styles.terminalLink}>
            <ArrowLeft size={15} aria-hidden="true" /> 返回终端
          </Link>
        </nav>
      </header>

      <section ref={sceneShellRef} className={styles.sceneShell} aria-label="失联节点档案室" inert={backgroundInert}>
        <div
          ref={sceneRef}
          className={styles.scene}
          tabIndex={entered && !storyOpen && !helpOpen && !bootOverlay ? 0 : -1}
          role="application"
          aria-label="档案室场景。使用方向键或 WASD 移动，E 或 Enter 查看最近设备，Tab 可进入设备按钮。"
          onClick={handleStagePointer}
          onKeyDown={handleStageKeyDown}
          data-online={archiveState.facts.serverOnline}
          data-booting={bootOverlay}
          data-task-lamp={archiveState.discoveredSignalIds.includes('ambient.task-lamp')}
          data-rain-heard={archiveState.discoveredSignalIds.includes('ambient.rain-window')}
        >
          <div ref={sceneWorldRef} className={styles.sceneWorld}>
            <Image
              src="/game/signal-archive/scenes/archive-room-base-v1.png"
              alt=""
              width={1486}
              height={1058}
              priority
              sizes="(max-width: 900px) 760px, 1800px"
              className={styles.sceneImage}
              aria-hidden="true"
            />

            <div className={styles.signalPath} aria-hidden="true" data-visible={status.restoreCount > 0 || idleSeconds >= 60} />

            {HOTSPOTS.map(hotspot => {
              const node = FIRST_ROOM_CORE_NODES.find(item => item.id === hotspot.id)
                ?? FIRST_ROOM_AMBIENT_INTERACTIONS.find(item => item.id === hotspot.id);
              const selected = selectedId === hotspot.id;
              const resolved = hotspot.tier === 'core'
                ? resolvedCoreNode(hotspot.id as CoreNodeId, archiveState)
                : archiveState.discoveredSignalIds.includes(hotspot.id);
              const keyboardReachable = Math.hypot(
                hotspot.approach.x - player.x,
                hotspot.approach.y - player.y,
              ) <= 9;
              return (
                <button
                  key={hotspot.id}
                  type="button"
                  className={styles.hotspot}
                  style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
                  data-tier={hotspot.tier}
                  data-selected={selected}
                  data-resolved={resolved}
                  data-recommended={recommendedHotspotId === hotspot.id && idleSeconds >= 20}
                  tabIndex={!contextOpen && keyboardReachable ? 0 : -1}
                  disabled={!entered || storyOpen || helpOpen || bootOverlay}
                  onClick={() => selectHotspot(hotspot)}
                  aria-label={`${node?.title.zh ?? '未知设备'}${resolved ? '，已处理' : ''}`}
                >
                  <span className={styles.hotspotDot} aria-hidden="true" />
                  <span className={styles.hotspotLabel}>
                    {node?.title.en ?? node?.title.zh}
                    {resolved && hotspot.tier === 'ambient'
                      ? ` · ${AMBIENT_RESOLVED_LABELS[hotspot.id as AmbientNodeId]}`
                      : ''}
                  </span>
                </button>
              );
            })}

            <div
              className={styles.player}
              style={{ left: `${player.x}%`, top: `${player.y}%` }}
              data-moving={moving}
              aria-hidden="true"
            >
              <Image src={playerSprite} alt="" width={64} height={96} priority unoptimized className={styles.playerSprite} />
            </div>
          </div>

          {entered && contextOpen && !storyOpen && !helpOpen && !bootOverlay ? (
            <aside
              ref={contextPanelRef}
              id="archive-actions"
              className={styles.contextPanel}
              aria-label="当前档案对象"
              tabIndex={-1}
            >
              <button
                type="button"
                className={styles.panelClose}
                onClick={() => {
                  setContextOpen(false);
                  window.requestAnimationFrame(() => sceneRef.current?.focus({ preventScroll: true }));
                }}
                aria-label="收起档案面板"
              >
                <X size={17} aria-hidden="true" />
              </button>
              {coreNode ? (
                <>
                  <div className={styles.panelEyebrow}>CORE SIGNAL · {PHASE_LABELS[status.phase]}</div>
                  <h1>{coreNode.title.zh}</h1>
                  <p>{coreNode.prompt.zh}</p>
                  {archiveState.discoveredSignalIds.includes(coreNode.id) ? (
                    <blockquote>{coreNode.storyReveal.zh}</blockquote>
                  ) : null}
                  {renderNodeControls(coreNode.id, 'panel')}
                </>
              ) : ambientNode ? (
                <>
                  <div className={styles.panelEyebrow}>AMBIENT SIGNAL · OPTIONAL</div>
                  <h1>{ambientNode.title.zh}</h1>
                  <p>{archiveState.discoveredSignalIds.includes(ambientNode.id) ? ambientNode.feedback.zh : '这不是启动服务器的必需步骤，但会补足房间的语境。'}</p>
                  <div className={styles.ambientState} data-resolved={archiveState.discoveredSignalIds.includes(ambientNode.id)}>
                    <span>{archiveState.discoveredSignalIds.includes(ambientNode.id) ? AMBIENT_RESOLVED_LABELS[ambientNode.id] : 'UNDISCOVERED'}</span>
                    <strong>{discoveredAmbientCount} / {FIRST_ROOM_AMBIENT_INTERACTIONS.length}</strong>
                  </div>
                  <button
                    type="button"
                    className={styles.primaryAction}
                    onClick={() => discoverAmbient(ambientNode.id)}
                    disabled={archiveState.discoveredSignalIds.includes(ambientNode.id)}
                  >
                    {archiveState.discoveredSignalIds.includes(ambientNode.id) ? <><Check size={15} /> 已记录</> : <><Sparkles size={15} /> {ambientNode.primaryAction.zh}</>}
                  </button>
                </>
              ) : null}
            </aside>
          ) : null}
        </div>
      </section>

      <footer className={styles.archiveFooter} inert={backgroundInert}>
        <div className={styles.controlHints} aria-hidden="true">
          <span>WASD / 方向键移动</span><i>·</i><span>E / Enter 查看</span><i>·</i><span>点击地面移动</span>
        </div>
        <div className={styles.footerActions}>
          <button type="button" onClick={requestHint} className={styles.hintButton}>
            <CircleHelp size={15} aria-hidden="true" /> 提示
          </button>
          <div className={styles.restoreStatus} aria-label={`恢复进度 ${status.restoreCount}/3`}>
            <span>RESTORE <strong>{status.restoreCount}</strong> / 3</span>
            <span className={styles.restoreDots} aria-hidden="true">
              <i data-complete={status.repairs.power} />
              <i data-complete={status.repairs.health} />
              <i data-complete={status.repairs.bootOrder} />
            </span>
          </div>
        </div>
      </footer>

      {autoHintVisible && entered && !storyOpen && !helpOpen && !bootOverlay ? (
        <button type="button" className={styles.autoHint} onClick={requestHint}>
          <span>{NEXT_ACTION_HINTS[nextAction]}</span>
          <strong>{idleSeconds >= 90 ? '需要我带你完成？' : '显示下一条线索'}</strong>
        </button>
      ) : null}

      {revisitOpen && saveReady ? (
        <section
          ref={revisitOverlayRef}
          className={styles.introOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="archive-revisit-title"
        >
          <div className={styles.introCard}>
            <span className={styles.introKicker}>RETURNING SIGNAL · A-17 ONLINE</span>
            <h1 id="archive-revisit-title">节点还在运行。你想从哪里继续？</h1>
            <p>维修进度已经保留。你可以回到房间寻找可选记录，直接续接在线终端，或重新体验完整修复流程。</p>
            <div className={styles.introActions}>
              <button type="button" className={styles.introPrimary} onClick={continueRevisit}>
                继续探索房间 <ArrowRight size={17} aria-hidden="true" />
              </button>
              <button type="button" className={styles.introSecondary} onClick={() => handoffToTerminal()}>
                打开在线终端
              </button>
              <button type="button" className={styles.introTextAction} onClick={replayArchive}>
                重新体验首房
              </button>
            </div>
            <small>
              已恢复 3 / 3 · 环境记录 {discoveredAmbientCount} / {FIRST_ROOM_AMBIENT_INTERACTIONS.length}
              {discoveredEcho ? ' · 隐藏回响已发现' : ' · 仍有隐藏回响'}
            </small>
          </div>
        </section>
      ) : null}

      {!entered && !revisitOpen && saveReady ? (
        <section
          ref={introOverlayRef}
          className={styles.introOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="archive-intro-title"
        >
          <div className={styles.introCard}>
            <span className={styles.introKicker}>INCOMING SIGNAL · A-17</span>
            <h1 id="archive-intro-title">让一座沉睡的档案重新发声。</h1>
            <p>这里不是黑客挑战。你将观察一间失联房间，恢复三条系统链路，并从显示器进入现有终端。不会命令行也能完整探索。</p>
            <div className={styles.introActions}>
              <button type="button" className={styles.introPrimary} onClick={() => beginExplore(false)}>
                开始探索 <ArrowRight size={17} aria-hidden="true" />
              </button>
              <Link href="/" className={styles.introSecondary}>直接进入终端</Link>
              <button type="button" className={styles.introTextAction} onClick={() => beginExplore(true)}>
                使用故事列表模式
              </button>
            </div>
            <small>核心路线约 3–5 分钟 · 无失败惩罚 · 自动保存</small>
          </div>
        </section>
      ) : null}

      {storyOpen ? (
        <section
          ref={storyOverlayRef}
          className={styles.storyOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="story-mode-title"
          onKeyDown={event => {
            if (event.key === 'Escape') closeStory();
          }}
        >
          <header className={styles.storyHeader}>
            <div>
              <span>ACCESSIBLE SURFACE · SHARED PROGRESS</span>
              <h1 id="story-mode-title">故事列表模式</h1>
              <p>不操控角色也能完成相同的观察、修复与启动。</p>
            </div>
            <button
              type="button"
              className={styles.closeButton}
              onClick={closeStory}
              aria-label="关闭故事列表模式"
            >
              <X size={19} aria-hidden="true" />
            </button>
          </header>
          <div className={styles.storyGrid}>
            {FIRST_ROOM_CORE_NODES.map((node, index) => (
              <article key={node.id} className={styles.storyCard} data-resolved={resolvedCoreNode(node.id, archiveState)}>
                <div className={styles.storyNumber}>{String(index + 1).padStart(2, '0')}</div>
                <div className={styles.storyBody}>
                  <div className={styles.storyTitleRow}>
                    <h2>{node.title.zh}</h2>
                    <span>{resolvedCoreNode(node.id, archiveState) ? '已处理' : '可探索'}</span>
                  </div>
                  <p>{node.prompt.zh}</p>
                  {archiveState.discoveredSignalIds.includes(node.id) ? <blockquote>{node.storyReveal.zh}</blockquote> : null}
                  {renderNodeControls(node.id, `story-${index}`)}
                </div>
              </article>
            ))}
            {archiveState.facts.serverOnline ? (
              <article className={styles.storyCard} data-resolved={discoveredEcho}>
                <div className={styles.storyNumber}>∞</div>
                <div className={styles.storyBody}>
                  <div className={styles.storyTitleRow}>
                    <h2>{FIRST_ROOM_HIDDEN_ECHOES[0].title.zh}</h2>
                    <span>{discoveredEcho ? '已发现' : '尚有记录未对齐'}</span>
                  </div>
                  <p>{discoveredEcho ? FIRST_ROOM_HIDDEN_ECHOES[0].reveal.zh : '这条回响不会阻挡主流程；打开任务灯，并翻看档案箱的公开索引即可对齐。'}</p>
                </div>
              </article>
            ) : null}
          </div>
          <footer className={styles.storyFooter}>
            <button type="button" className={styles.secondaryAction} onClick={resetArchive}>
              <RotateCcw size={15} aria-hidden="true" /> 重置首房
            </button>
            <Link href="/" className={styles.terminalLink}>直接进入终端</Link>
          </footer>
        </section>
      ) : null}

      {helpOpen ? (
        <section
          ref={helpOverlayRef}
          className={styles.helpOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="help-title"
          onKeyDown={event => {
            if (event.key === 'Escape') closeHelp();
          }}
        >
          <div className={styles.helpCard}>
            <button type="button" className={styles.closeButton} onClick={closeHelp} aria-label="关闭提示">
              <X size={18} aria-hidden="true" />
            </button>
            <span>ADAPTIVE HINT · NO PENALTY</span>
            <h2 id="help-title">下一条信号</h2>
            <p>{NEXT_ACTION_HINTS[nextAction]}</p>
            <div className={styles.helpActions}>
              <button type="button" className={styles.primaryAction} onClick={showSignalPath}>
                显示信号路径
              </button>
              {currentPuzzleId || nextAction === 'diagnose-server' ? (
                <button type="button" className={styles.secondaryAction} onClick={assistCurrentStep}>
                  带我完成当前步骤
                </button>
              ) : null}
            </div>
            <small>使用提示不会减少内容、改变结局或锁住隐藏记录。</small>
          </div>
        </section>
      ) : null}

      {bootOverlay ? (
        <section
          ref={bootOverlayRef}
          className={styles.bootOverlay}
          role="dialog"
          aria-modal="true"
          aria-live="assertive"
          aria-label="服务器启动序列"
        >
          <div className={styles.bootSequence}>
            <span>LOCAL NODE A-17</span>
            <strong>RESTORING SIGNAL</strong>
            <ol>
              <li><Check size={15} /> POWER LINK</li>
              <li><Check size={15} /> HEALTH LOOP</li>
              <li><Check size={15} /> BOOT ORDER</li>
            </ol>
            <button type="button" onClick={finishBoot}>
              <SkipForward size={16} aria-hidden="true" /> 跳过动画并进入终端
            </button>
          </div>
        </section>
      ) : null}

      <div className="sr-only" aria-live="polite" aria-atomic="true">{liveMessage}</div>
      {saveError ? <div className={styles.saveWarning}>本次探索可能无法在刷新后恢复，但不会阻止进入终端。</div> : null}
    </main>
  );
}
