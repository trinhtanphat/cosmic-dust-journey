import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { chapters } from '../src/content/chapters';
import ChapterSection from '../src/components/ChapterSection';
import ExperienceShell from '../src/app/ExperienceShell';

vi.mock('../src/experience/ExperienceCanvas', () => ({ default: () => <div data-testid="mock-canvas" /> }));
vi.mock('../src/components/WebGLFallback', () => ({
  default: () => <div data-testid="mock-fallback" />,
  supportsWebGL: () => true,
}));
vi.mock('gsap', () => ({ gsap: { registerPlugin: vi.fn() } }));
vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {
    create: vi.fn(() => ({ kill: vi.fn() })),
    refresh: vi.fn(),
  },
}));

describe('V2 narrative staging', () => {
  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps chapter narrative and semantic scene metadata visible', () => {
    const chapter = chapters[4];
    const { container } = render(<ChapterSection chapter={chapter} index={4} />);
    expect(screen.getByRole('heading', { name: chapter.title })).toBeVisible();
    expect(screen.getByText(chapter.body)).toBeVisible();
    expect(screen.getByText(chapter.interactionCue!)).toBeVisible();
    expect(screen.getByText(chapter.clockLabel)).toBeVisible();
    const section = container.querySelector('[data-chapter-id="main-sequence"]');
    expect(section).toHaveAttribute('data-scene-id', 'main-sequence');
    expect(section).toHaveClass('chapter--main-sequence');
  });

  it('gives the nebula title an explicit readable foreground color', () => {
    const chapter = chapters.find((candidate) => candidate.scene === 'nebula');
    expect(chapter).toBeDefined();
    render(<ChapterSection chapter={chapter!} index={6} />);
    expect(screen.getByRole('heading', { name: chapter!.title })).toHaveStyle('color: #f3efff');
  });

  it('exposes cinematic phase without removing keyboard reachable controls', () => {
    const { container } = render(<ExperienceShell />);
    const shell = container.querySelector('.experience-shell');
    expect(shell).toHaveAttribute('data-cinematic-phase');
    expect(screen.getByRole('link', { name: /skip to story/i })).toBeVisible();
    expect(screen.getByRole('button', { name: /turn sound on/i })).toBeEnabled();
  });
});
