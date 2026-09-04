import type { CinematicPhase, TransitionMode } from './cinematic.ts';

export interface TransitionState {
  mode: TransitionMode;
  amount: number;
  outgoingOpacity: number;
  incomingOpacity: number;
  radialScale: number;
  densityScale: number;
  flash: number;
  warp: number;
  shell: number;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
const smoothstep = (value: number) => {
  const x = clamp01(value);
  return x * x * (3 - 2 * x);
};

export function resolveTransition(
  requestedMode: TransitionMode,
  phase: CinematicPhase,
  phaseProgress: number,
  reducedMotion: boolean,
): TransitionState {
  const active = phase === 'transition';
  const amount = active ? smoothstep(phaseProgress) : 0;
  const mode: TransitionMode = reducedMotion && requestedMode !== 'crossfade' ? 'crossfade' : requestedMode;
  const base: TransitionState = {
    mode,
    amount,
    outgoingOpacity: 1 - amount,
    incomingOpacity: amount,
    radialScale: 1,
    densityScale: 1,
    flash: 0,
    warp: 0,
    shell: 0,
  };
  if (!active || mode === 'crossfade') return base;

  switch (mode) {
    case 'morph-density':
      return { ...base, densityScale: clamp01(1 - amount * 0.7) };
    case 'radial-collapse':
      return { ...base, radialScale: clamp01(1 - amount * 0.86), densityScale: clamp01(1 - amount * 0.35) };
    case 'radial-expansion':
      return { ...base, radialScale: clamp01(0.28 + amount * 0.72), densityScale: clamp01(0.55 + amount * 0.45) };
    case 'shell-ejection':
      return { ...base, radialScale: clamp01(0.5 + amount * 0.5), shell: amount };
    case 'flash-cut': {
      const flash = clamp01(Math.sin(amount * Math.PI));
      return {
        ...base,
        flash,
        outgoingOpacity: clamp01(1 - amount * 1.25),
        incomingOpacity: clamp01((amount - 0.18) / 0.82),
      };
    }
    case 'dissolve-to-point':
      return { ...base, radialScale: clamp01(1 - amount * 0.95), densityScale: clamp01(1 - amount * 0.82) };
    case 'accretion-warp':
      return { ...base, warp: amount, radialScale: clamp01(0.65 + amount * 0.35) };
    case 'crossfade':
      return base;
  }
}
