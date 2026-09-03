import type { SceneId } from '../content/types.ts';

export type InteractionKind = 'shockwave' | 'gravity' | 'radiation' | 'disk-disturbance' | 'none';
export interface InteractionImpulse { kind: InteractionKind; strength: number; }

export function interactionImpulse(scene: SceneId, event: 'move' | 'click', localProgress: number): InteractionImpulse {
  const p = Math.min(1, Math.max(0, localProgress));
  if (scene === 'dust' && event === 'click') return { kind: 'shockwave', strength: 0.8 + p * 0.2 };
  if (scene === 'collapse' && event === 'move') return { kind: 'gravity', strength: 0.35 + p * 0.65 };
  if (scene === 'main-sequence' && event === 'move') return { kind: 'radiation', strength: 0.45 + p * 0.35 };
  if (scene === 'black-hole' && event === 'move') return { kind: 'disk-disturbance', strength: 0.4 + p * 0.4 };
  return { kind: 'none', strength: 0 };
}
