import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { chapterTimeline } from '../src/experience/chapterRegistry';
import { chapterStartProgress } from '../src/experience/navigation';
import { useJourneyNavigation } from '../src/experience/useJourneyNavigation';
import { useExperienceStore } from '../src/experience/store';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.history.replaceState(null, '', '/');
});

describe('V3.1 journey navigation controller', () => {
  let scrollTo: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: 3000,
    });
    Object.defineProperty(document.body, 'scrollHeight', {
      configurable: true,
      value: 3000,
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 1000,
    });
    scrollTo = vi.fn();
    Object.defineProperty(window, 'scrollTo', {
      configurable: true,
      value: scrollTo,
    });
    useExperienceStore.getState().setGlobalProgress(0);
    const quality = useExperienceStore.getState().quality;
    useExperienceStore.getState().setQuality({ ...quality, reducedMotion: false });
    window.history.replaceState(null, '', '/');
  });

  it('hydrates a known canonical deep-link with an instant jump', () => {
    window.history.replaceState(null, '', '/#chapter-red-giant');

    renderHook(() => useJourneyNavigation());

    const target = chapterStartProgress(chapterTimeline, 'red-giant');
    expect(target).not.toBeNull();
    expect(scrollTo).toHaveBeenCalledWith({
      top: (target ?? 0) * 2000,
      behavior: 'auto',
    });
    expect(window.location.hash).toBe('#chapter-red-giant');
  });

  it('ignores malformed and unknown hashes without moving the journey', () => {
    window.history.replaceState(null, '', '/#chapter-not-real');

    renderHook(() => useJourneyNavigation());

    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('pushes a canonical hash and scrolls through one guided navigation path', () => {
    const pushState = vi.spyOn(window.history, 'pushState');
    const { result } = renderHook(() => useJourneyNavigation());
    scrollTo.mockClear();

    act(() => result.current.goToChapter('white-dwarf'));

    const target = chapterStartProgress(chapterTimeline, 'white-dwarf');
    expect(pushState).toHaveBeenCalledWith(null, '', '#chapter-white-dwarf');
    expect(window.location.hash).toBe('#chapter-white-dwarf');
    expect(scrollTo).toHaveBeenCalledWith({
      top: (target ?? 0) * 2000,
      behavior: 'smooth',
    });
    expect(result.current.mode).toBe('manual');
  });

  it('moves previous and next from the live chapter and clamps at journey ends', () => {
    const { result } = renderHook(() => useJourneyNavigation());
    scrollTo.mockClear();

    act(() => result.current.previous());
    expect(scrollTo).not.toHaveBeenCalled();

    act(() => result.current.next());
    expect(window.location.hash).toBe('#chapter-cold-cloud');

    act(() => useExperienceStore.getState().setGlobalProgress(1));
    scrollTo.mockClear();
    act(() => result.current.next());
    expect(scrollTo).not.toHaveBeenCalled();

    act(() => result.current.previous());
    expect(window.location.hash).toBe('#chapter-elsewhere');
  });

  it('routes external hash changes through the same controller and returns to manual mode', () => {
    const { result } = renderHook(() => useJourneyNavigation());
    act(() => result.current.play());
    expect(result.current.mode).toBe('playing');
    scrollTo.mockClear();

    window.history.replaceState(null, '', '/#chapter-red-giant');
    act(() => window.dispatchEvent(new HashChangeEvent('hashchange')));

    expect(result.current.mode).toBe('manual');
    expect(scrollTo).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: 'auto' }),
    );
  });
});
