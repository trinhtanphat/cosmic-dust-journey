import type { SceneId } from '../content/types.ts';

export type InteractionKind =
  | 'shockwave'
  | 'gravity'
  | 'ignition'
  | 'radiation'
  | 'convection'
  | 'gas-ripple'
  | 'dwarf-glow'
  | 'disk-disturbance'
  | 'none';

export interface InteractionImpulse {
  kind: InteractionKind;
  strength: number;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));

export function interactionImpulse(
  scene: SceneId,
  event: 'move' | 'click',
  localProgress: number,
  maxStrength = 1,
): InteractionImpulse {
  const p = clamp01(localProgress);
  const max = clamp01(maxStrength);
  const bounded = (kind: InteractionKind, value: number): InteractionImpulse => ({ kind, strength: Math.min(max, clamp01(value)) });

  if (scene === 'dust') return event === 'click' ? bounded('shockwave', 0.8 + p * 0.2) : bounded('none', 0);
  if (event !== 'move') return bounded('none', 0);
  switch (scene) {
    case 'collapse': return bounded('gravity', 0.35 + p * 0.65);
    case 'fusion': return bounded('ignition', 0.34 + Math.sin(p * Math.PI) * 0.52);
    case 'main-sequence': return bounded('radiation', 0.45 + p * 0.35);
    case 'red-giant': return bounded('convection', 0.3 + p * 0.5);
    case 'nebula': return bounded('gas-ripple', 0.28 + p * 0.48);
    case 'white-dwarf': return bounded('dwarf-glow', 0.18 + p * 0.28);
    case 'black-hole': return bounded('disk-disturbance', 0.4 + p * 0.4);
    case 'dust': return bounded('none', 0);
  }
}
