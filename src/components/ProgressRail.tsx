import { chapters } from '../content/chapters';
import { useExperienceStore } from '../experience/store';

export interface ProgressRailProps {
  onNavigate?(chapterId: string): void;
}

export default function ProgressRail({ onNavigate = () => undefined }: ProgressRailProps) {
  const activeIndex = useExperienceStore((state) => state.chapterIndex);
  const progress = useExperienceStore((state) => state.globalProgress);

  return (
    <nav className="progress-rail" aria-label="Journey progress">
      <div className="progress-rail__track" aria-hidden="true">
        <span style={{ transform: `scaleY(${progress})` }} />
      </div>
      <ol>
        {chapters.map((chapter, index) => (
          <li key={chapter.id}>
            <button
              type="button"
              className={index === activeIndex ? 'is-active' : ''}
              aria-label={`Go to ${chapter.title}`}
              aria-current={index === activeIndex ? 'step' : undefined}
              onClick={() => onNavigate(chapter.id)}
            >
              <span className="progress-rail__dot" aria-hidden="true" />
              <span className="progress-rail__label">{chapter.eyebrow}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
