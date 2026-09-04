import type { ComponentType } from 'react';
import { chapters } from '../content/chapters';
import type { SceneId } from '../content/types';
import type { CinematicState } from '../experience/cinematicState';
import { useExperienceStore } from '../experience/store';
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
  const adaptedQuality = {
    ...quality,
    dpr: budget.dpr,
    particleBudget: Math.max(1200, Math.floor(budget.particleBudget * profile.particleMultiplier)),
    postprocessing: budget.postprocessing,
  };
  const Current = components[currentScene];
  const currentModel = sceneModel(currentScene, progress, adaptedQuality);

  if (currentScene === nextScene) {
    return <Current model={currentModel} progress={progress} opacity={1} pointer={pointer} impulse={impulse} cinematic={transition} />;
  }

  const Next = components[nextScene];
  const incomingProgress = transition.amount;
  const nextModel = sceneModel(nextScene, incomingProgress, adaptedQuality);
  return (
    <>
      <Current
        model={currentModel}
        progress={progress}
        opacity={transition.outgoingOpacity}
        pointer={pointer}
        impulse={impulse}
        cinematic={transition}
      />
      {transition.incomingOpacity > 0.001 && (
        <Next
          model={nextModel}
          progress={incomingProgress}
          opacity={transition.incomingOpacity}
          pointer={pointer}
          impulse={impulse}
          cinematic={transition}
        />
      )}
    </>
  );
}
