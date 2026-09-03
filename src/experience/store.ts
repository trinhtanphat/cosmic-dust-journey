import { create } from 'zustand';
import type { QualityProfile } from '../app/quality';
import type { InteractionKind } from './interactions';
import { chapterTimeline } from './chapterRegistry';
import { locateProgress } from './timeline';

export interface PointerState {
  x: number;
  y: number;
}

export interface LiveImpulse {
  kind: InteractionKind;
  strength: number;
  at: number;
}

interface ExperienceState {
  globalProgress: number;
  chapterId: string;
  chapterIndex: number;
  localProgress: number;
  pointer: PointerState;
  impulse: LiveImpulse;
  soundEnabled: boolean;
  quality: QualityProfile;
  setGlobalProgress(progress: number): void;
  setPointer(pointer: PointerState): void;
  setImpulse(impulse: LiveImpulse): void;
  setSoundEnabled(enabled: boolean): void;
  setQuality(quality: QualityProfile): void;
}

const initialLocation = locateProgress(chapterTimeline, 0);

export const useExperienceStore = create<ExperienceState>((set) => ({
  globalProgress: 0,
  chapterId: initialLocation.chapterId,
  chapterIndex: initialLocation.index,
  localProgress: 0,
  pointer: { x: 0, y: 0 },
  impulse: { kind: 'none', strength: 0, at: 0 },
  soundEnabled: false,
  quality: { tier: 'medium', dpr: 1, particleBudget: 28000, reducedMotion: false, postprocessing: false },
  setGlobalProgress(progress) {
    const located = locateProgress(chapterTimeline, progress);
    set({
      globalProgress: located.globalProgress,
      chapterId: located.chapterId,
      chapterIndex: located.index,
      localProgress: located.localProgress,
    });
  },
  setPointer: (pointer) => set({ pointer }),
  setImpulse: (impulse) => set({ impulse }),
  setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
  setQuality: (quality) => set({ quality }),
}));
