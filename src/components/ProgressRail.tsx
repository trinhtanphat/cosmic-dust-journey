import { chapters } from '../content/chapters';
import { useExperienceStore } from '../experience/store';

export default function ProgressRail() {
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
              onClick={() => document.getElementById(`chapter-${chapter.id}`)?.scrollIntoView({ behavior: 'smooth' })}
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
