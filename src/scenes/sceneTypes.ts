import type { LiveImpulse, PointerState } from '../experience/store';
import type { TransitionState } from '../experience/transitions';
import type { SceneVisualModel } from './sceneModel';

export interface SceneProps {
  model: SceneVisualModel;
  progress: number;
  opacity?: number;
  pointer: PointerState;
  impulse: LiveImpulse;
  cinematic: TransitionState;
}
