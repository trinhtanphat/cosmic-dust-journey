export type PlaybackMode = 'manual' | 'playing' | 'paused' | 'completed';
export type PlaybackEvent = 'play' | 'pause' | 'resume' | 'takeover' | 'complete';

export interface PlaybackState {
  mode: PlaybackMode;
}

export const initialPlaybackState: PlaybackState = { mode: 'manual' };

const finiteOrZero = (value: number) => (Number.isFinite(value) ? value : 0);
const clamp01 = (value: number) => Math.min(1, Math.max(0, finiteOrZero(value)));

export function reducePlayback(state: PlaybackState, event: PlaybackEvent): PlaybackState {
  switch (state.mode) {
    case 'manual':
      return event === 'play' ? { mode: 'playing' } : state;
    case 'playing':
      if (event === 'pause') return { mode: 'paused' };
      if (event === 'takeover') return { mode: 'manual' };
      if (event === 'complete') return { mode: 'completed' };
      return state;
    case 'paused':
      if (event === 'resume') return { mode: 'playing' };
      if (event === 'takeover') return { mode: 'manual' };
      return state;
    case 'completed':
      return event === 'play' ? { mode: 'playing' } : state;
  }
}

export function advancePlaybackProgress(
  progress: number,
  deltaMs: number,
  totalDurationMs: number,
): number {
  const current = clamp01(progress);
  const delta = Math.max(0, finiteOrZero(deltaMs));
  const duration = Math.max(1, finiteOrZero(totalDurationMs));
  return clamp01(current + delta / duration);
}

export function nextReducedMotionChapterIndex(currentIndex: number, chapterCount: number): number {
  const count = Math.max(0, Math.trunc(finiteOrZero(chapterCount)));
  if (count <= 0) return 0;
  const current = Math.min(count - 1, Math.max(0, Math.trunc(finiteOrZero(currentIndex))));
  return Math.min(count - 1, current + 1);
}
