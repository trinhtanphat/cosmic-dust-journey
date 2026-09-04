import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { resolveCinematicState } from '../src/experience/cinematicState';
import { useExperienceStore } from '../src/experience/store';

const sceneStub = (scene: string) => (props: { opacity?: number; continuity?: { blend: { transfer: number } } }) => (
  <div
    data-testid={`scene-${scene}`}
    data-opacity={String(props.opacity ?? 1)}
    data-transfer={props.continuity ? String(props.continuity.blend.transfer) : 'missing'}
  />
);

vi.mock('../src/scenes/DustCloudScene', () => ({ default: sceneStub('dust') }));
vi.mock('../src/scenes/CollapseScene', () => ({ default: sceneStub('collapse') }));
vi.mock('../src/scenes/FusionScene', () => ({ default: sceneStub('fusion') }));
vi.mock('../src/scenes/MainSequenceScene', () => ({ default: sceneStub('main-sequence') }));
vi.mock('../src/scenes/RedGiantScene', () => ({ default: sceneStub('red-giant') }));
vi.mock('../src/scenes/NebulaScene', () => ({ default: sceneStub('nebula') }));
vi.mock('../src/scenes/WhiteDwarfScene', () => ({ default: sceneStub('white-dwarf') }));
vi.mock('../src/scenes/BlackHoleScene', () => ({ default: sceneStub('black-hole') }));

import SceneDirector from '../src/scenes/SceneDirector';

const quality = { tier: 'medium' as const, dpr: 1, particleBudget: 28000, reducedMotion: false, postprocessing: false };

function renderAt(chapterIndex: number, localProgress: number) {
  useExperienceStore.setState({
    chapterIndex,
    localProgress,
    quality,
    pointer: { x: 0, y: 0 },
    impulse: { kind: 'none', strength: 0, at: 0 },
  });
  const chapterIds = ['overture','cold-cloud','collapse','ignition','main-sequence','red-giant','shedding','white-dwarf','elsewhere','epilogue'];
  const sceneIds = ['dust','dust','collapse','fusion','main-sequence','red-giant','nebula','white-dwarf','black-hole','dust'] as const;
  const cinematicState = resolveCinematicState({
    chapterId: chapterIds[chapterIndex],
    scene: sceneIds[chapterIndex],
    localProgress,
    pointer: { x: 0, y: 0 },
    quality,
    adaptiveLevel: 0,
  });
  return render(<SceneDirector cinematicState={cinematicState} />);
}

afterEach(() => cleanup());

describe('V3 SceneDirector continuity ownership', () => {
  test('passes one bounded continuity transfer into current and next scene families', () => {
    renderAt(1, 0.95);
    const current = screen.getByTestId('scene-dust');
    const next = screen.getByTestId('scene-collapse');
    expect(current.dataset.transfer).not.toBe('missing');
    expect(next.dataset.transfer).toBe(current.dataset.transfer);
    const transfer = Number(current.dataset.transfer);
    expect(transfer).toBeGreaterThanOrEqual(0);
    expect(transfer).toBeLessThanOrEqual(1);
    for (const node of [current, next]) {
      const opacity = Number(node.dataset.opacity);
      expect(opacity).toBeGreaterThanOrEqual(0);
      expect(opacity).toBeLessThanOrEqual(1);
    }
  });

  test('mounts no more than current and next authored scene families', () => {
    const view = renderAt(5, 0.95);
    expect(view.container.querySelectorAll('[data-testid^="scene-"]')).toHaveLength(2);
  });

  test('keeps the white-dwarf to black-hole bridge physically isolated', () => {
    renderAt(7, 0.95);
    const dwarf = screen.getByTestId('scene-white-dwarf');
    const blackHole = screen.getByTestId('scene-black-hole');
    expect(blackHole.dataset.transfer).toBe(dwarf.dataset.transfer);
    expect(Number(blackHole.dataset.transfer)).toBeLessThanOrEqual(0.08);
  });
});
