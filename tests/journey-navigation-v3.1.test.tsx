import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { chapterTimeline } from '../src/experience/chapterRegistry';
import { chapterStartProgress } from '../src/experience/navigation';
import { useJourneyNavigation } from '../src/experience/useJourneyNavigation';
import { useExperienceStore } from '../src/experience/store';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
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
      behavior: 'instant',
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
      expect.objectContaining({ behavior: 'instant' }),
    );
  });

  it('drives ordinary autoplay with one delta-time requestAnimationFrame loop', () => {
    const frames: FrameRequestCallback[] = [];
    const requestFrame = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frames.push(callback);
      return frames.length;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
    const { result } = renderHook(() => useJourneyNavigation());
    scrollTo.mockClear();

    act(() => result.current.play());
    expect(result.current.mode).toBe('playing');
    expect(requestFrame).toHaveBeenCalledTimes(1);

    act(() => frames.shift()?.(0));
    act(() => frames.shift()?.(1000));

    const lastCall = scrollTo.mock.calls.at(-1)?.[0] as ScrollToOptions | undefined;
    expect(lastCall?.behavior).toBe('instant');
    expect(lastCall?.top).toBeGreaterThan(0);
  });

  it('pauses the autoplay loop and resumes from live store progress', () => {
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frames.push(callback);
      return frames.length;
    });
    const cancelFrame = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {
      frames.shift();
    });
    const { result } = renderHook(() => useJourneyNavigation());

    act(() => result.current.play());
    act(() => frames.shift()?.(0));
    act(() => frames.shift()?.(1000));
    act(() => result.current.pause());

    expect(result.current.mode).toBe('paused');
    expect(cancelFrame).toHaveBeenCalled();

    act(() => useExperienceStore.getState().setGlobalProgress(0.4));
    scrollTo.mockClear();
    act(() => result.current.resume());
    act(() => frames.shift()?.(2000));
    act(() => frames.shift()?.(3000));

    const resumedCall = scrollTo.mock.calls.at(-1)?.[0] as ScrollToOptions | undefined;
    expect(result.current.mode).toBe('playing');
    expect(resumedCall?.top).toBeGreaterThan(800);
  });

  it('relinquishes autoplay immediately to wheel, touch, and navigation-key intent', () => {
    const requestFrame = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1);
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
    const { result } = renderHook(() => useJourneyNavigation());

    act(() => result.current.play());
    expect(requestFrame).toHaveBeenCalled();
    act(() => window.dispatchEvent(new WheelEvent('wheel')));
    expect(result.current.mode).toBe('manual');

    act(() => result.current.play());
    act(() => window.dispatchEvent(new TouchEvent('touchstart')));
    expect(result.current.mode).toBe('manual');

    act(() => result.current.play());
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' })));
    expect(result.current.mode).toBe('manual');
  });

  it('does not treat programmatic scroll or editable keyboard input as takeover', () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1);
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
    const { result } = renderHook(() => useJourneyNavigation());

    act(() => result.current.play());
    act(() => window.dispatchEvent(new Event('scroll')));
    expect(result.current.mode).toBe('playing');

    const input = document.createElement('input');
    document.body.appendChild(input);
    act(() => input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })));
    expect(result.current.mode).toBe('playing');
    input.remove();
  });

  it('uses bounded chapter-step autoplay under reduced motion and never starts rAF scrolling', () => {
    vi.useFakeTimers();
    const requestFrame = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1);
    const quality = useExperienceStore.getState().quality;
    useExperienceStore.getState().setQuality({ ...quality, reducedMotion: true });
    const { result } = renderHook(() => useJourneyNavigation());
    scrollTo.mockClear();

    act(() => result.current.play());
    expect(result.current.mode).toBe('playing');
    expect(requestFrame).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(6000));
    expect(window.location.hash).toBe('#chapter-cold-cloud');
    expect(scrollTo).toHaveBeenLastCalledWith(
      expect.objectContaining({ behavior: 'instant' }),
    );

    act(() => vi.advanceTimersByTime(6000 * 8));
    expect(window.location.hash).toBe('#chapter-epilogue');
    expect(result.current.mode).toBe('completed');
    expect(requestFrame).not.toHaveBeenCalled();
  });
});
