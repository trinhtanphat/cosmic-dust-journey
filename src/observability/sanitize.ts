import type { ObservabilityContext } from './types.ts';

const idPattern = /^[a-z0-9-]{1,64}$/;
const errorPattern = /^[A-Za-z0-9_.:-]{1,80}$/;
const phases = new Set(['enter', 'settle', 'interact', 'transition']);
const qualityTiers = new Set(['low', 'medium', 'high']);
const viewportClasses = new Set(['small', 'medium', 'large']);

const finiteNumber = (value: unknown) => typeof value === 'number' && Number.isFinite(value);
const adaptive = (value: unknown): value is 0 | 1 | 2 | 3 =>
  Number.isInteger(value) && typeof value === 'number' && value >= 0 && value <= 3;

export function sanitizeContext(input: Record<string, unknown>): ObservabilityContext {
  const output: ObservabilityContext = {};
  if (typeof input.chapterId === 'string' && idPattern.test(input.chapterId)) output.chapterId = input.chapterId;
  if (typeof input.sceneId === 'string' && idPattern.test(input.sceneId)) output.sceneId = input.sceneId;
  if (typeof input.phase === 'string' && phases.has(input.phase)) output.phase = input.phase;
  if (typeof input.qualityTier === 'string' && qualityTiers.has(input.qualityTier)) {
    output.qualityTier = input.qualityTier as ObservabilityContext['qualityTier'];
  }
  if (adaptive(input.adaptiveLevel)) output.adaptiveLevel = input.adaptiveLevel;
  if (typeof input.viewportClass === 'string' && viewportClasses.has(input.viewportClass)) {
    output.viewportClass = input.viewportClass as ObservabilityContext['viewportClass'];
  }
  if (typeof input.errorClass === 'string' && errorPattern.test(input.errorClass)) output.errorClass = input.errorClass;
  if (finiteNumber(input.value)) output.value = Math.max(-1_000_000_000, Math.min(1_000_000_000, input.value as number));
  if (adaptive(input.fromLevel)) output.fromLevel = input.fromLevel;
  if (adaptive(input.toLevel)) output.toLevel = input.toLevel;
  return output;
}
