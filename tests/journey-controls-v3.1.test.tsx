import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import JourneyControls from '../src/components/JourneyControls';
import ProgressRail from '../src/components/ProgressRail';
import { useExperienceStore } from '../src/experience/store';

afterEach(() => cleanup());

describe('V3.1 guided journey controls', () => {
  beforeEach(() => {
    useExperienceStore.getState().setGlobalProgress(0);
  });

  it('delegates progress-rail chapter navigation through one shared callback', () => {
    const onNavigate = vi.fn();
    render(<ProgressRail onNavigate={onNavigate} />);

    fireEvent.click(
      screen.getByRole('button', { name: /go to a cloud starts to remember its center/i }),
    );

    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(onNavigate).toHaveBeenCalledWith('cold-cloud');
  });

  it('renders Play in manual mode with an accessible manual status', () => {
    const onPlay = vi.fn();
    render(
      <JourneyControls
        mode="manual"
        canPrevious={false}
        canNext
        onPlay={onPlay}
        onPause={vi.fn()}
        onResume={vi.fn()}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Manual navigation');
    fireEvent.click(screen.getByRole('button', { name: /play journey/i }));
    expect(onPlay).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: /previous chapter/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /next chapter/i })).toBeEnabled();
  });

  it('renders Pause while playing and Resume while paused', () => {
    const onPause = vi.fn();
    const { rerender } = render(
      <JourneyControls
        mode="playing"
        canPrevious
        canNext
        onPlay={vi.fn()}
        onPause={onPause}
        onResume={vi.fn()}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Autoplay playing');
    fireEvent.click(screen.getByRole('button', { name: /pause autoplay/i }));
    expect(onPause).toHaveBeenCalledTimes(1);

    const onResume = vi.fn();
    rerender(
      <JourneyControls
        mode="paused"
        canPrevious
        canNext
        onPlay={vi.fn()}
        onPause={vi.fn()}
        onResume={onResume}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Autoplay paused');
    fireEvent.click(screen.getByRole('button', { name: /resume autoplay/i }));
    expect(onResume).toHaveBeenCalledTimes(1);
  });

  it('offers an explicit restart action after completion', () => {
    const onPlay = vi.fn();
    render(
      <JourneyControls
        mode="completed"
        canPrevious
        canNext={false}
        onPlay={onPlay}
        onPause={vi.fn()}
        onResume={vi.fn()}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Autoplay completed');
    fireEvent.click(screen.getByRole('button', { name: /play from beginning/i }));
    expect(onPlay).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: /next chapter/i })).toBeDisabled();
  });
});
