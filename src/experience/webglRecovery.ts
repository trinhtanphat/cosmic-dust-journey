export type WebGLRecoveryMode = 'healthy' | 'restoring' | 'fallback';

export interface WebGLRecoveryState {
  mode: WebGLRecoveryMode;
  losses: number;
  generation: number;
}

export function createWebGLRecoveryState(): WebGLRecoveryState {
  return { mode: 'healthy', losses: 0, generation: 0 };
}

export function reduceWebGLRecovery(
  state: WebGLRecoveryState,
  event: 'lost' | 'restored' | 'restore-timeout',
): WebGLRecoveryState {
  if (state.mode === 'fallback') return state;
  if (event === 'lost') {
    const losses = state.losses + 1;
    if (losses >= 2) return { ...state, mode: 'fallback', losses };
    return { ...state, mode: 'restoring', losses };
  }
  if (event === 'restored' && state.mode === 'restoring') {
    return { ...state, mode: 'healthy', generation: state.generation + 1 };
  }
  if (event === 'restore-timeout' && state.mode === 'restoring') {
    return { ...state, mode: 'fallback' };
  }
  return state;
}
