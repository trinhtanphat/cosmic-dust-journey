import { useCallback, useEffect, useRef, useState } from 'react';
import { chapters } from '../content/chapters';
import {
  initialPlaybackState,
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

const chapterIds = chapters.map((chapter) => chapter.id);

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

export function useJourneyNavigation(): JourneyNavigationController {
  const globalProgress = useExperienceStore((state) => state.globalProgress);
  const chapterId = useExperienceStore((state) => state.chapterId);
  const chapterIndex = useExperienceStore((state) => state.chapterIndex);
  const reducedMotion = useExperienceStore((state) => state.quality.reducedMotion);
  const [playback, setPlayback] = useState(initialPlaybackState);
  const pendingChapterRef = useRef<string | null>(null);

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
    if (playback.mode === 'completed' || globalProgress >= 1) {
      pendingChapterRef.current = chapters[0].id;
      const hash = canonicalChapterHash(chapters[0].id);
      window.history.replaceState(null, '', hash);
      scrollToProgress(0, 'auto');
    }
    dispatch('play');
  }, [dispatch, globalProgress, playback.mode, scrollToProgress]);

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
