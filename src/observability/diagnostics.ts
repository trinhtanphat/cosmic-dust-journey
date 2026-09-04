import type { ObservabilityEvent } from './types.ts';

export interface DiagnosticsSnapshot {
  schemaVersion: 1;
  frameCount: number;
  frameMs: { p50: number; p95: number; p99: number; max: number; over50Percent: number };
  longTasks: { over250: number; over1000: number; maxMs: number };
  qualityTransitions: number;
  timeAtAdaptiveLevelMs: readonly [number, number, number, number];
  adaptiveLevel: 0 | 1 | 2 | 3;
  webgl: { lost: number; restored: number; fallback: number };
  runtimeErrors: number;
  unhandledRejections: number;
  audioEvents: number;
  chaptersVisited: readonly string[];
  heapGrowthBytes?: number;
}

export interface DiagnosticsAccumulator {
  recordFrame(ms: number): void;
  recordLongTask(ms: number): void;
  recordQualityTransition(from: 0 | 1 | 2 | 3, to: 0 | 1 | 2 | 3, at: number): void;
  recordEvent(event: ObservabilityEvent): void;
  setHeapBaseline(bytes: number): void;
  setHeapCurrent(bytes: number): void;
  snapshot(now?: number): DiagnosticsSnapshot;
}

export type BudgetStatus = 'pass' | 'warn' | 'fail';
export interface BudgetReport { status: BudgetStatus; failures: string[]; warnings: string[] }

const MAX_FRAME_BUCKET = 1000;
const HEAP_HARD_LIMIT = 128 * 1024 * 1024;
const audioNames = new Set([
  'audio.enabled', 'audio.disabled', 'audio.suspended', 'audio.interrupted', 'audio.resumed',
]);

const safeMs = (value: number) => Number.isFinite(value) ? Math.max(0, value) : MAX_FRAME_BUCKET + 1;

export function createDiagnosticsAccumulator(now: () => number = Date.now): DiagnosticsAccumulator {
  const histogram = new Uint32Array(MAX_FRAME_BUCKET + 1);
  let overflow = 0;
  let frameCount = 0;
  let frameMax = 0;
  let framesOver50 = 0;
  let longOver250 = 0;
  let longOver1000 = 0;
  let longMax = 0;
  let qualityTransitions = 0;
  const timeAtLevel = [0, 0, 0, 0];
  let adaptiveLevel: 0 | 1 | 2 | 3 = 0;
  let levelStartedAt = now();
  const webgl = { lost: 0, restored: 0, fallback: 0 };
  let runtimeErrors = 0;
  let unhandledRejections = 0;
  let audioEvents = 0;
  const chaptersVisited: string[] = [];
  const chapterSet = new Set<string>();
  let heapBaseline: number | undefined;
  let heapCurrent: number | undefined;

  const percentile = (ratio: number) => {
    if (frameCount === 0) return 0;
    const rank = Math.max(1, Math.ceil(frameCount * ratio));
    let cumulative = 0;
    for (let index = 0; index < histogram.length; index += 1) {
      cumulative += histogram[index];
      if (cumulative >= rank) return index;
    }
    return overflow > 0 ? MAX_FRAME_BUCKET + 1 : frameMax;
  };

  return {
    recordFrame(value) {
      const ms = safeMs(value);
      frameCount += 1;
      frameMax = Math.max(frameMax, ms);
      if (ms > 50) framesOver50 += 1;
      const rounded = Math.round(ms);
      if (rounded > MAX_FRAME_BUCKET) overflow += 1;
      else histogram[rounded] += 1;
    },
    recordLongTask(value) {
      const ms = safeMs(value);
      longMax = Math.max(longMax, ms);
      if (ms > 250) longOver250 += 1;
      if (ms > 1000) longOver1000 += 1;
    },
    recordQualityTransition(_from, to, at) {
      const timestamp = Number.isFinite(at) ? Math.max(levelStartedAt, at) : levelStartedAt;
      timeAtLevel[adaptiveLevel] += timestamp - levelStartedAt;
      if (to !== adaptiveLevel) qualityTransitions += 1;
      adaptiveLevel = to;
      levelStartedAt = timestamp;
    },
    recordEvent(event) {
      switch (event.name) {
        case 'chapter.enter': {
          const id = event.context.chapterId;
          if (id && !chapterSet.has(id)) {
            chapterSet.add(id);
            chaptersVisited.push(id);
          }
          break;
        }
        case 'runtime.error': runtimeErrors += 1; break;
        case 'runtime.unhandled-rejection': unhandledRejections += 1; break;
        case 'webgl.context-lost': webgl.lost += 1; break;
        case 'webgl.context-restored': webgl.restored += 1; break;
        case 'webgl.fallback': webgl.fallback += 1; break;
        default:
          if (audioNames.has(event.name)) audioEvents += 1;
          break;
      }
    },
    setHeapBaseline(bytes) {
      if (Number.isFinite(bytes) && bytes >= 0) heapBaseline = bytes;
    },
    setHeapCurrent(bytes) {
      if (Number.isFinite(bytes) && bytes >= 0) heapCurrent = bytes;
    },
    snapshot(at = now()) {
      const times = timeAtLevel.slice() as [number, number, number, number];
      const timestamp = Number.isFinite(at) ? Math.max(levelStartedAt, at) : levelStartedAt;
      times[adaptiveLevel] += timestamp - levelStartedAt;
      const snapshot: DiagnosticsSnapshot = {
        schemaVersion: 1,
        frameCount,
        frameMs: {
          p50: percentile(0.5),
          p95: percentile(0.95),
          p99: percentile(0.99),
          max: frameMax,
          over50Percent: frameCount ? (framesOver50 / frameCount) * 100 : 0,
        },
        longTasks: { over250: longOver250, over1000: longOver1000, maxMs: longMax },
        qualityTransitions,
        timeAtAdaptiveLevelMs: times,
        adaptiveLevel,
        webgl: { ...webgl },
        runtimeErrors,
        unhandledRejections,
        audioEvents,
        chaptersVisited: chaptersVisited.slice(),
      };
      if (heapBaseline !== undefined && heapCurrent !== undefined) {
        snapshot.heapGrowthBytes = Math.max(0, heapCurrent - heapBaseline);
      }
      return snapshot;
    },
  };
}

export function evaluateDiagnostics(
  snapshot: DiagnosticsSnapshot,
  project: 'chromium-desktop' | 'chromium-mobile',
): BudgetReport {
  const failures: string[] = [];
  const warnings: string[] = [];

  if (snapshot.runtimeErrors > 0) failures.push(`runtime errors: ${snapshot.runtimeErrors}`);
  if (snapshot.unhandledRejections > 0) failures.push(`unhandled rejections: ${snapshot.unhandledRejections}`);
  if (snapshot.webgl.lost > 0) failures.push(`WebGL context losses: ${snapshot.webgl.lost}`);
  if (snapshot.longTasks.over1000 > 0) failures.push(`long tasks >1000ms: ${snapshot.longTasks.over1000}`);
  if ((snapshot.heapGrowthBytes ?? 0) > HEAP_HARD_LIMIT) {
    failures.push(`heap growth >128MB: ${snapshot.heapGrowthBytes}`);
  }

  if (project === 'chromium-desktop') {
    if (snapshot.frameMs.p95 > 35) warnings.push(`frame p95 ${snapshot.frameMs.p95}ms exceeds 35ms target`);
    if (snapshot.frameMs.over50Percent > 5) warnings.push(`frames >50ms ${snapshot.frameMs.over50Percent.toFixed(2)}% exceeds 5% target`);
    if (snapshot.longTasks.over250 > 2) warnings.push(`long tasks >250ms ${snapshot.longTasks.over250} exceeds target 2`);
  } else {
    if (snapshot.frameMs.p95 > 50) warnings.push(`frame p95 ${snapshot.frameMs.p95}ms exceeds 50ms target`);
    if (snapshot.frameMs.over50Percent > 10) warnings.push(`frames >50ms ${snapshot.frameMs.over50Percent.toFixed(2)}% exceeds 10% target`);
    if (snapshot.adaptiveLevel === 3) warnings.push('adaptive level 3 remains active at snapshot');
  }

  return {
    status: failures.length ? 'fail' : warnings.length ? 'warn' : 'pass',
    failures,
    warnings,
  };
}
