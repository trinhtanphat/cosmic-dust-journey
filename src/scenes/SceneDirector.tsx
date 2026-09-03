import type { ComponentType } from 'react';
import { chapters } from '../content/chapters';
import type { SceneId } from '../content/types';
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

const smoothstep = (t: number) => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};

export default function SceneDirector() {
  const chapterIndex = useExperienceStore((state) => state.chapterIndex);
  const progress = useExperienceStore((state) => state.localProgress);
  const quality = useExperienceStore((state) => state.quality);
  const pointer = useExperienceStore((state) => state.pointer);
  const impulse = useExperienceStore((state) => state.impulse);
  const chapter = chapters[Math.max(0, chapterIndex)] ?? chapters[0];
  const nextChapter = chapters[Math.min(chapters.length - 1, chapterIndex + 1)] ?? chapter;
  const currentScene = chapter.scene;
  const nextScene = nextChapter.scene;
  const transition = currentScene === nextScene ? 0 : smoothstep((progress - 0.76) / 0.24);
  const Current = components[currentScene];
  const Next = components[nextScene];
  const currentModel = sceneModel(currentScene, progress, quality);
  const nextModel = sceneModel(nextScene, Math.max(0, (progress - 0.76) / 0.24), quality);

  return (
    <>
      <Current model={currentModel} progress={progress} opacity={1 - transition} pointer={pointer} impulse={impulse} />
      {transition > 0.001 && (
        <Next model={nextModel} progress={Math.max(0, (progress - 0.76) / 0.24)} opacity={transition} pointer={pointer} impulse={impulse} />
      )}
    </>
  );
}
