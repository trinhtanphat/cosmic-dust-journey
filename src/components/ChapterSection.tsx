import type { CSSProperties } from 'react';
import type { Chapter } from '../content/types';

export default function ChapterSection({ chapter, index }: { chapter: Chapter; index: number }) {
  const style = { '--chapter-length': chapter.scrollLength } as CSSProperties;
  return (
    <section
      id={`chapter-${chapter.id}`}
      className={`chapter chapter--${chapter.scene}`}
      data-chapter-id={chapter.id}
      data-chapter-index={index}
      data-scene-id={chapter.scene}
      style={style}
      aria-labelledby={`chapter-title-${chapter.id}`}
    >
      <div className="chapter__sticky">
        <div className="chapter__copy">
          <p className="chapter__eyebrow">{chapter.eyebrow}</p>
          <h2 id={`chapter-title-${chapter.id}`}>{chapter.title}</h2>
          <p className="chapter__body">{chapter.body}</p>
          {chapter.interactionCue && <p className="chapter__cue">{chapter.interactionCue}</p>}
          <p className="chapter__clock">{chapter.clockLabel}</p>
        </div>
      </div>
    </section>
  );
}
