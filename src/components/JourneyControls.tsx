import type { PlaybackMode } from '../experience/autoplay';

export interface JourneyControlsProps {
  mode: PlaybackMode;
  canPrevious: boolean;
  canNext: boolean;
  onPlay(): void;
  onPause(): void;
  onResume(): void;
  onPrevious(): void;
  onNext(): void;
}

const statusByMode: Record<PlaybackMode, string> = {
  manual: 'Manual navigation',
  playing: 'Autoplay playing',
  paused: 'Autoplay paused',
  completed: 'Autoplay completed',
};

export default function JourneyControls({
  mode,
  canPrevious,
  canNext,
  onPlay,
  onPause,
  onResume,
  onPrevious,
  onNext,
}: JourneyControlsProps) {
  const primary = mode === 'playing'
    ? { label: 'Pause autoplay', action: onPause }
    : mode === 'paused'
      ? { label: 'Resume autoplay', action: onResume }
      : mode === 'completed'
        ? { label: 'Play from beginning', action: onPlay }
        : { label: 'Play journey', action: onPlay };

  return (
    <div className="journey-controls" aria-label="Journey controls">
      <span className="journey-controls__status" role="status" aria-live="polite">
        {statusByMode[mode]}
      </span>
      <div className="journey-controls__actions">
        <button type="button" onClick={onPrevious} disabled={!canPrevious} aria-label="Previous chapter">
          Previous
        </button>
        <button type="button" onClick={primary.action} className="journey-controls__primary">
          {primary.label}
        </button>
        <button type="button" onClick={onNext} disabled={!canNext} aria-label="Next chapter">
          Next
        </button>
      </div>
    </div>
  );
}
