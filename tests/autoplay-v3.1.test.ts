import { describe, expect, it } from 'vitest';
import {
  advancePlaybackProgress,
  initialPlaybackState,
  nextReducedMotionChapterIndex,
  reducePlayback,
} from '../src/experience/autoplay';

describe('V3.1 autoplay state model', () => {
  it('moves through play pause resume takeover and completion states', () => {
    expect(initialPlaybackState).toEqual({ mode: 'manual' });
    expect(reducePlayback({ mode: 'manual' }, 'play')).toEqual({ mode: 'playing' });
    expect(reducePlayback({ mode: 'playing' }, 'pause')).toEqual({ mode: 'paused' });
    expect(reducePlayback({ mode: 'paused' }, 'resume')).toEqual({ mode: 'playing' });
    expect(reducePlayback({ mode: 'playing' }, 'takeover')).toEqual({ mode: 'manual' });
    expect(reducePlayback({ mode: 'paused' }, 'takeover')).toEqual({ mode: 'manual' });
    expect(reducePlayback({ mode: 'playing' }, 'complete')).toEqual({ mode: 'completed' });
    expect(reducePlayback({ mode: 'completed' }, 'play')).toEqual({ mode: 'playing' });
  });

  it('keeps unsupported transitions unchanged', () => {
    expect(reducePlayback({ mode: 'manual' }, 'pause')).toEqual({ mode: 'manual' });
    expect(reducePlayback({ mode: 'paused' }, 'play')).toEqual({ mode: 'paused' });
    expect(reducePlayback({ mode: 'completed' }, 'resume')).toEqual({ mode: 'completed' });
  });

  it('advances normalized progress deterministically by elapsed time', () => {
    expect(advancePlaybackProgress(0.25, 1000, 4000)).toBe(0.5);
    expect(advancePlaybackProgress(0.9, 1000, 4000)).toBe(1);
    expect(advancePlaybackProgress(0.25, -100, 4000)).toBe(0.25);
    expect(advancePlaybackProgress(Number.NaN, 1000, 4000)).toBe(0.25);
    expect(advancePlaybackProgress(0.25, 1000, Number.NaN)).toBe(1);
  });

  it('advances reduced-motion playback one bounded chapter at a time', () => {
    expect(nextReducedMotionChapterIndex(0, 10)).toBe(1);
    expect(nextReducedMotionChapterIndex(8, 10)).toBe(9);
    expect(nextReducedMotionChapterIndex(9, 10)).toBe(9);
    expect(nextReducedMotionChapterIndex(-20, 10)).toBe(1);
    expect(nextReducedMotionChapterIndex(4, 0)).toBe(0);
  });
});
