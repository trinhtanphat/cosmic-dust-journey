import type { ComponentType } from 'react';
import { chapters } from '../content/chapters';
import type { SceneId } from '../content/types';
import type { CinematicState } from '../experience/cinematicState';
import { useExperienceStore } from '../experience/store';
import { resolveVisualContinuity } from '../experience/visualContinuity';
import BlackHoleScene from './BlackHoleScene';
import CollapseScene from './CollapseScene';
import DustCloudScene from './DustCloudScene';
import FusionScene from './FusionScene';
import MainSequenceScene from './MainSequenceScene';
import NebulaScene from './NebulaScene';
import RedGiantScene from './RedGiantScene';
import { sceneModel } from './sceneModel';
import type { SceneProps } from './sceneTypes';
import WhiteDwarfScene from './WhiteDwarfScene';

const components: Record<SceneId, ComponentType<SceneProps>> = {
  dust: DustCloudScene,
  collapse: CollapseScene,
  fusion: FusionScene,
  'main-sequence': MainSequenceScene,
  'red-giant': RedGiantScene,
  nebula: NebulaScene,
  'white-dwarf': WhiteDwarfScene,
  'black-hole': BlackHoleScene,
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));

export default function SceneDirector({ cinematicState }: { cinematicState: CinematicState }) {
  const chapterIndex = useExperienceStore((state) => state.chapterIndex);
  const progress = useExperienceStore((state) => state.localProgress);
  const quality = useExperienceStore((state) => state.quality);
  const pointer = useExperienceStore((state) => state.pointer);
  const impulse = useExperienceStore((state) => state.impulse);
  const chapter = chapters[Math.max(0, chapterIndex)] ?? chapters[0];
  const nextChapter = chapters[Math.min(chapters.length - 1, chapterIndex + 1)] ?? chapter;
  const currentScene = chapter.scene;
  const nextScene = nextChapter.scene;
  const { transition, budget, profile } = cinematicState;
  const continuity = resolveVisualContinuity({
    chapterIndex,
    localProgress: progress,
    reducedMotion: quality.reducedMotion,
  });
  const adaptedQuality = {
    ...quality,
    dpr: budget.dpr,
    particleBudget: Math.max(1200, Math.floor(budget.particleBudget * profile.particleMultiplier)),
    postprocessing: budget.postprocessing,
  };
  const Current = components[currentScene];
  const currentModel = sceneModel(currentScene, progress, adaptedQuality);

  if (currentScene === nextScene) {
    return (
      <Current
        model={currentModel}
        progress={progress}
        opacity={1}
        pointer={pointer}
        impulse={impulse}
        cinematic={transition}
        continuity={continuity}
      />
    );
  }

  const Next = components[nextScene];
  const incomingProgress = transition.amount;
  const nextModel = sceneModel(nextScene, incomingProgress, adaptedQuality);
  const currentOpacity = clamp01(transition.outgoingOpacity * (0.7 + continuity.blend.outgoingWeight * 0.3));
  const incomingOpacity = clamp01(Math.max(transition.incomingOpacity, continuity.blend.incomingWeight));

  return (
    <>
      <Current
        model={currentModel}
        progress={progress}
        opacity={currentOpacity}
        pointer={pointer}
        impulse={impulse}
        cinematic={transition}
        continuity={continuity}
      />
      {incomingOpacity > 0.001 && (
        <Next
          model={nextModel}
          progress={incomingProgress}
          opacity={incomingOpacity}
          pointer={pointer}
          impulse={impulse}
          cinematic={transition}
          continuity={continuity}
        />
      )}
    </>
  );
}
