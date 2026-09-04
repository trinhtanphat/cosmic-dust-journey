import { useCallback, useEffect, useRef, useState } from 'react';
import { chapters } from '../content/chapters';
import {
  advancePlaybackProgress,
  initialPlaybackState,
  nextReducedMotionChapterIndex,
  reducePlayback,
  type PlaybackEvent,
  type PlaybackMode,
} from './autoplay';
import { chapterTimeline } from './chapterRegistry';
import {
  canonicalChapterHash,
  chapterIdFromHash,
  chapterStartProgress,
  progressToScrollY,
} from './navigation';
import { useExperienceStore } from './store';

export const AUTOPLAY_TOTAL_DURATION_MS = 120_000;
export const REDUCED_MOTION_CHAPTER_HOLD_MS = 6_000;

const chapterIds = chapters.map((chapter) => chapter.id);
const navigationKeys = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ']);

type NavigationHistory = 'none' | 'push' | 'replace';

interface NavigateOptions {
  behavior: ScrollBehavior;
  history: NavigationHistory;
  takeover: boolean;
}

export interface JourneyNavigationController {
  mode: PlaybackMode;
  play(): void;
  pause(): void;
  resume(): void;
  previous(): void;
  next(): void;
  goToChapter(chapterId: string): void;
}

function documentScrollHeight() {
  return Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight ?? 0);
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return target instanceof HTMLInputElement
    || target instanceof HTMLTextAreaElement
    || target instanceof HTMLSelectElement;
}

export function useJourneyNavigation(): JourneyNavigationController {
  const chapterId = useExperienceStore((state) => state.chapterId);
  const chapterIndex = useExperienceStore((state) => state.chapterIndex);
  const reducedMotion = useExperienceStore((state) => state.quality.reducedMotion);
  const [playback, setPlayback] = useState(initialPlaybackState);
  const pendingChapterRef = useRef<string | null>(null);
  const playbackStartProgressRef = useRef<number | null>(null);

  const dispatch = useCallback((event: PlaybackEvent) => {
    setPlayback((state) => reducePlayback(state, event));
  }, []);

  const scrollToProgress = useCallback((progress: number, behavior: ScrollBehavior) => {
    window.scrollTo({
      top: progressToScrollY(progress, documentScrollHeight(), window.innerHeight),
      behavior,
    });
  }, []);

  const navigateToChapter = useCallback((targetChapterId: string, options: NavigateOptions) => {
    const progress = chapterStartProgress(chapterTimeline, targetChapterId);
    if (progress === null) return;

    if (options.takeover) dispatch('takeover');

    const hash = canonicalChapterHash(targetChapterId);
    pendingChapterRef.current = targetChapterId;

    if (options.history === 'push' && window.location.hash !== hash) {
      window.history.pushState(null, '', hash);
    } else if (options.history === 'replace' && window.location.hash !== hash) {
      window.history.replaceState(null, '', hash);
    }

    scrollToProgress(progress, options.behavior);
  }, [dispatch, scrollToProgress]);

  const goToChapter = useCallback((targetChapterId: string) => {
    navigateToChapter(targetChapterId, {
      behavior: reducedMotion ? 'auto' : 'smooth',
      history: 'push',
      takeover: true,
    });
  }, [navigateToChapter, reducedMotion]);

  const previous = useCallback(() => {
    if (chapterIndex <= 0) return;
    goToChapter(chapters[chapterIndex - 1].id);
  }, [chapterIndex, goToChapter]);

  const next = useCallback(() => {
    if (chapterIndex >= chapters.length - 1) return;
    goToChapter(chapters[chapterIndex + 1].id);
  }, [chapterIndex, goToChapter]);

  const play = useCallback(() => {
    const liveProgress = useExperienceStore.getState().globalProgress;
    if (playback.mode === 'completed' || liveProgress >= 1) {
      playbackStartProgressRef.current = 0;
      pendingChapterRef.current = chapters[0].id;
      const hash = canonicalChapterHash(chapters[0].id);
      window.history.replaceState(null, '', hash);
      scrollToProgress(0, 'auto');
    }
    dispatch('play');
  }, [dispatch, playback.mode, scrollToProgress]);

  const pause = useCallback(() => dispatch('pause'), [dispatch]);
  const resume = useCallback(() => dispatch('resume'), [dispatch]);

  useEffect(() => {
    const targetChapterId = chapterIdFromHash(window.location.hash, chapterIds);
    if (!targetChapterId) return;
    navigateToChapter(targetChapterId, {
      behavior: 'auto',
      history: 'none',
      takeover: false,
    });
  }, [navigateToChapter]);

  useEffect(() => {
    const onHashChange = () => {
      const targetChapterId = chapterIdFromHash(window.location.hash, chapterIds);
      if (!targetChapterId) return;
      navigateToChapter(targetChapterId, {
        behavior: 'auto',
        history: 'none',
        takeover: true,
      });
    };

    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [navigateToChapter]);

  useEffect(() => {
    const pendingChapter = pendingChapterRef.current;
    if (pendingChapter) {
      if (pendingChapter !== chapterId) return;
      pendingChapterRef.current = null;
    }

    const hash = canonicalChapterHash(chapterId);
    if (window.location.hash !== hash) {
      window.history.replaceState(null, '', hash);
    }
  }, [chapterId]);

  useEffect(() => {
    if (playback.mode !== 'playing' || reducedMotion) return;

    let cancelled = false;
    let frameId = 0;
    let previousTimestamp: number | null = null;
    let progress = playbackStartProgressRef.current
      ?? useExperienceStore.getState().globalProgress;
    playbackStartProgressRef.current = null;

    const frame = (timestamp: number) => {
      if (cancelled) return;
      const deltaMs = previousTimestamp === null ? 0 : Math.max(0, timestamp - previousTimestamp);
      previousTimestamp = timestamp;
      progress = advancePlaybackProgress(progress, deltaMs, AUTOPLAY_TOTAL_DURATION_MS);
      scrollToProgress(progress, 'auto');

      if (progress >= 1) {
        dispatch('complete');
        return;
      }
      frameId = window.requestAnimationFrame(frame);
    };

    frameId = window.requestAnimationFrame(frame);
    return () => {
      cancelled = true;
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, [dispatch, playback.mode, reducedMotion, scrollToProgress]);

  useEffect(() => {
    if (playback.mode !== 'playing' || !reducedMotion) return;

    let cancelled = false;
    let timerId = 0;
    let currentIndex = useExperienceStore.getState().chapterIndex;

    const scheduleStep = () => {
      timerId = window.setTimeout(() => {
        if (cancelled) return;
        const targetIndex = nextReducedMotionChapterIndex(currentIndex, chapters.length);
        if (targetIndex === currentIndex) {
          dispatch('complete');
          return;
        }

        currentIndex = targetIndex;
        navigateToChapter(chapters[currentIndex].id, {
          behavior: 'auto',
          history: 'replace',
          takeover: false,
        });

        if (currentIndex >= chapters.length - 1) {
          dispatch('complete');
          return;
        }
        scheduleStep();
      }, REDUCED_MOTION_CHAPTER_HOLD_MS);
    };

    if (currentIndex >= chapters.length - 1) {
      dispatch('complete');
    } else {
      scheduleStep();
    }

    return () => {
      cancelled = true;
      if (timerId) window.clearTimeout(timerId);
    };
  }, [dispatch, navigateToChapter, playback.mode, reducedMotion]);

  useEffect(() => {
    if (playback.mode !== 'playing' && playback.mode !== 'paused') return;

    const takeover = () => dispatch('takeover');
    const onKeyDown = (event: KeyboardEvent) => {
      if (!navigationKeys.has(event.key) || isEditableTarget(event.target)) return;
      takeover();
    };

    window.addEventListener('wheel', takeover, { passive: true });
    window.addEventListener('touchstart', takeover, { passive: true });
    window.addEventListener('touchmove', takeover, { passive: true });
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('wheel', takeover);
      window.removeEventListener('touchstart', takeover);
      window.removeEventListener('touchmove', takeover);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [dispatch, playback.mode]);

  return {
    mode: playback.mode,
    play,
    pause,
    resume,
    previous,
    next,
    goToChapter,
  };
}
