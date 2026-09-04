# Cosmic Dust Journey V2 Cinematic Fidelity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade V1 into a clean-room V2 with chapter-specific cinematic choreography, richer authored stellar visuals, bounded scene-semantic interactions, adaptive runtime rendering quality, optional scene-aware sound, and deterministic production QA across GitHub Pages, Vercel, and Cloudflare.

**Architecture:** Keep the existing semantic DOM narrative, normalized scroll timeline, Zustand store, and persistent React Three Fiber canvas. Add pure data-driven cinematic modules in `src/experience/` that resolve phase, camera, transitions, postFX parameters, and adaptive quality; scene components remain isolated render units and receive resolved state through explicit props.

**Tech Stack:** React 19, TypeScript 5.9, Vite 8, Three.js 0.185, React Three Fiber 9, GSAP ScrollTrigger 3.15, Zustand 5, Node core tests, Vitest, Playwright, Three.js `addons/postprocessing` modules, WebAudio.

**Spec:** `docs/superpowers/specs/2026-09-04-v2-cinematic-fidelity-design.md`

## Global Constraints

- V2 remains clean-room: do not copy, de-minify, recover, or transplant proprietary reference JavaScript, GLSL, audio, or unknown-rights artwork.
- Preserve the ten existing chapter ids and eight existing `SceneId` values.
- Scroll remains the only source of narrative progress; pointer/touch input may only add bounded visual interaction.
- Cinematic rendering state must be deterministic from chapter id, normalized local progress, quality state, and bounded pointer/impulse input. Elapsed time may animate local shader texture/noise only; it must not select narrative state.
- `prefers-reduced-motion` must select a dedicated lower-motion path, not merely reduce duration.
- No critical information may exist only in WebGL.
- Sound remains muted until explicit user gesture; audio failure must not break scroll or WebGL.
- Do not add a post-processing package; use modules shipped with pinned Three.js (`three/addons/postprocessing/*`).
- GitHub Pages builds keep `VITE_BASE_PATH=/cosmic-dust-journey/`; Vercel and Cloudflare builds keep root base `/`.
- Keep the Pages artifact guard that requires `/cosmic-dust-journey/assets/` and rejects `/src/main.tsx`.
- Work stays on `feature/v2-cinematic-fidelity` or short-lived child branches; no force/bypass merge.

## Module Map

New modules:
- `src/experience/cinematic.ts` — complete cinematic types + phase resolver.
- `src/experience/cinematicProfiles.ts` — ten chapter profiles.
- `src/experience/cameraTrack.ts` — deterministic camera interpolation.
- `src/experience/transitions.ts` — deterministic transition state.
- `src/experience/runtimeQuality.ts` — frame-time hysteresis.
- `src/experience/postfx.ts` — postFX parameter resolver.
- `src/experience/PostProcessingRig.tsx` — Three.js composer integration.
- `src/experience/cinematicState.ts` — pure integration resolver consumed by Canvas/Director.
- `src/audio/sceneAudio.ts` — per-scene procedural audio envelopes.
- `src/shaders/noise.ts` — authored reusable GLSL helpers.

Primary modified modules:
- `src/experience/store.ts`, `ExperienceCanvas.tsx`, `interactions.ts`.
- `src/scenes/sceneTypes.ts`, `sceneModel.ts`, `SceneDirector.tsx`, `ParticleCloud.tsx`, `StellarCore.tsx`, `AccretionDisk.tsx`, all eight scene components.
- `src/shaders/particleMaterial.ts`, `starMaterial.ts`, `diskMaterial.ts`.
- `src/app/quality.ts`, `ExperienceShell.tsx`.
- `src/components/ChapterSection.tsx`, `SoundToggle.tsx`.
- `src/audio/ambient.ts`, `src/styles/global.css`, `playwright.config.ts`, `.github/workflows/deploy-pages.yml`, `README.md`.

---

### Task 1: Complete cinematic profile schema and four-phase resolver

**Files:**
- Create: `src/experience/cinematic.ts`
- Create: `src/experience/cinematicProfiles.ts`
- Create: `tests/core/cinematic.test.ts`

**Interfaces produced in this task:**

```ts
export type CinematicPhase = 'enter' | 'settle' | 'interact' | 'transition';
export type TransitionMode =
  | 'crossfade' | 'morph-density' | 'radial-collapse' | 'radial-expansion'
  | 'shell-ejection' | 'flash-cut' | 'dissolve-to-point' | 'accretion-warp';
export type Vec3 = readonly [number, number, number];
export interface PhaseStops { enterEnd: number; settleEnd: number; interactEnd: number }
export interface CameraKeyframe { at: number; position: Vec3; target: Vec3; fov: number }
export interface CameraTrackSpec {
  keyframes: readonly CameraKeyframe[];
  pointerInfluence: readonly [number, number];
  microParallax: number;
  reducedMotionScale: number;
}
export interface PostFxIntent {
  bloom: number;
  exposure: number;
  vignette: number;
  chromaticFringe: number;
}
export interface CinematicChapterProfile {
  chapterId: string;
  transition: TransitionMode;
  phaseStops: PhaseStops;
  camera: CameraTrackSpec;
  postFx: PostFxIntent;
  particleMultiplier: number;
  interactionMax: number;
}
export function resolveCinematicPhase(
  profile: CinematicChapterProfile,
  localProgress: number,
): { phase: CinematicPhase; phaseProgress: number };
export function cinematicProfileFor(chapterId: string): CinematicChapterProfile;
```

- [ ] **Step 1: Write failing tests**

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { cinematicProfileFor, resolveCinematicPhase } from '../../src/experience/cinematic.ts';

const ids = ['overture','cold-cloud','collapse','ignition','main-sequence','red-giant','shedding','white-dwarf','elsewhere','epilogue'];

test('all ten chapters have valid profiles', () => {
  for (const id of ids) {
    const profile = cinematicProfileFor(id);
    assert.equal(profile.chapterId, id);
    assert.ok(profile.camera.keyframes.length >= 2);
    assert.ok(profile.interactionMax >= 0 && profile.interactionMax <= 1);
  }
});

test('resolver exposes enter settle interact transition', () => {
  const profile = cinematicProfileFor('main-sequence');
  assert.equal(resolveCinematicPhase(profile, 0.05).phase, 'enter');
  assert.equal(resolveCinematicPhase(profile, 0.30).phase, 'settle');
  assert.equal(resolveCinematicPhase(profile, 0.60).phase, 'interact');
  assert.equal(resolveCinematicPhase(profile, 0.95).phase, 'transition');
});
```

- [ ] **Step 2: Run RED**

`node --experimental-strip-types --test tests/core/cinematic.test.ts`

Expected: FAIL because cinematic modules do not exist.

- [ ] **Step 3: Implement schema, validation-by-construction, and resolver**

Use clamped 0..1 progress. Require `0 < enterEnd < settleEnd < interactEnd < 1`; profile creation throws on invalid stops or unordered camera keyframes. Implement all ten profiles now so later tasks never invent missing data.

Transition intents:
- overture -> `morph-density`
- cold-cloud -> `radial-collapse`
- collapse -> `flash-cut`
- ignition -> `crossfade`
- main-sequence -> `radial-expansion`
- red-giant -> `shell-ejection`
- shedding -> `dissolve-to-point`
- white-dwarf -> `crossfade`
- elsewhere -> `accretion-warp`
- epilogue -> `crossfade`

- [ ] **Step 4: Run GREEN**

`node --experimental-strip-types --test tests/core/cinematic.test.ts tests/core/timeline.test.ts tests/core/content.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/experience/cinematic.ts src/experience/cinematicProfiles.ts tests/core/cinematic.test.ts
git commit -m "feat: add V2 cinematic chapter profiles"
```

---

### Task 2: Deterministic chapter-specific camera sampler

**Files:**
- Create: `src/experience/cameraTrack.ts`
- Modify: `src/experience/cinematicProfiles.ts`
- Create: `tests/core/camera-track.test.ts`

**Consumes:** `CameraTrackSpec`, `Vec3` from Task 1.

**Produces:**

```ts
export interface CameraPose { position: Vec3; target: Vec3; fov: number }
export function sampleCameraTrack(
  track: CameraTrackSpec,
  progress: number,
  pointer: { x: number; y: number },
  reducedMotion: boolean,
): CameraPose;
```

- [ ] **Step 1: Write failing tests with a concrete fixture**

```ts
const track: CameraTrackSpec = {
  keyframes: [
    { at: 0, position: [0,0,10], target: [0,0,0], fov: 46 },
    { at: 1, position: [0.2,0.1,8], target: [0,0,0], fov: 42 },
  ],
  pointerInfluence: [0.3,0.2],
  microParallax: 0.1,
  reducedMotionScale: 0.15,
};
const pose = sampleCameraTrack(track, 0.5, { x: 9, y: -9 }, false);
assert.ok(pose.position[0] <= 0.5 && pose.position[0] >= -0.5);
assert.ok(pose.fov >= 42 && pose.fov <= 46);
const reduced = sampleCameraTrack(track, 0.5, { x: 1, y: 1 }, true);
assert.ok(Math.abs(reduced.position[0] - 0.1) < Math.abs(pose.position[0] - 0.1));
```

- [ ] **Step 2: Run RED**

`node --experimental-strip-types --test tests/core/camera-track.test.ts`

- [ ] **Step 3: Implement interpolation**

Clamp progress and pointer; find surrounding ordered keyframes; smoothstep segment-local progress; lerp position/target/FOV. Apply bounded pointer influence after base interpolation. Reduced motion multiplies pointer and micro-parallax amplitude by `reducedMotionScale`; it does not alter scroll/phase timing.

- [ ] **Step 4: Refine all ten profile tracks**

Observable direction:
- overture/cold cloud: wide slow entry;
- collapse: dolly inward;
- ignition: compressed framing then modest FOV release;
- main sequence: stable low-amplitude framing;
- red giant: pull back as radius grows;
- shedding: wide reveal;
- white dwarf: centered/quiet;
- elsewhere: low-angle accretion-disk reveal;
- epilogue: drift away.

- [ ] **Step 5: Run GREEN and commit**

`node --experimental-strip-types --test tests/core/camera-track.test.ts tests/core/cinematic.test.ts`

```bash
git add src/experience/cameraTrack.ts src/experience/cinematicProfiles.ts tests/core/camera-track.test.ts
git commit -m "feat: add chapter camera choreography"
```

---

### Task 3: Transition resolver and SceneDirector migration

**Files:**
- Create: `src/experience/transitions.ts`
- Create: `tests/core/transitions.test.ts`
- Modify: `src/scenes/sceneTypes.ts`
- Modify: `src/scenes/SceneDirector.tsx`

**Produces:**

```ts
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
export function resolveTransition(
  mode: TransitionMode,
  phase: CinematicPhase,
  phaseProgress: number,
  reducedMotion: boolean,
): TransitionState;
```

`SceneProps` gains required `cinematic: TransitionState`.

- [ ] **Step 1: Write RED tests**

```ts
const flash = resolveTransition('flash-cut', 'transition', 0.5, false);
assert.ok(flash.flash > 0.5);
const reduced = resolveTransition('accretion-warp', 'transition', 1, true);
assert.equal(reduced.mode, 'crossfade');
assert.equal(reduced.warp, 0);
```

- [ ] **Step 2: Run RED**

`node --experimental-strip-types --test tests/core/transitions.test.ts`

- [ ] **Step 3: Implement all eight modes with every scalar clamped 0..1**

Reduced motion resolves non-crossfade modes to crossfade semantics with identical phase timing.

- [ ] **Step 4: Replace SceneDirector's hard-coded `0.76/0.24` transition**

```ts
const profile = cinematicProfileFor(chapter.id);
const phase = resolveCinematicPhase(profile, progress);
const transition = resolveTransition(profile.transition, phase.phase, phase.phaseProgress, quality.reducedMotion);
```

Use transition opacities for current/next scenes and pass `cinematic={transition}`. If next chapter has the same scene id, do not instantiate a duplicate scene; keep a single scene with transition amount available for local effects.

- [ ] **Step 5: Run GREEN/typecheck and commit**

`node --experimental-strip-types --test tests/core/transitions.test.ts tests/core/cinematic.test.ts && npm run typecheck`

```bash
git add src/experience/transitions.ts tests/core/transitions.test.ts src/scenes/sceneTypes.ts src/scenes/SceneDirector.tsx
git commit -m "feat: add cinematic scene transitions"
```

---

### Task 4: Expand bounded interaction semantics to all scene families

**Files:**
- Modify: `src/experience/interactions.ts`
- Modify: `tests/core/interactions.test.ts`
- Modify: `src/scenes/ParticleCloud.tsx`
- Modify: `src/shaders/particleMaterial.ts`

**Interface:**

```ts
export type InteractionKind =
  | 'shockwave' | 'gravity' | 'ignition' | 'radiation'
  | 'convection' | 'gas-ripple' | 'dwarf-glow' | 'disk-disturbance' | 'none';
export function interactionImpulse(
  scene: SceneId,
  event: 'move' | 'click',
  localProgress: number,
  maxStrength?: number,
): InteractionImpulse;
```

- [ ] **Step 1: Extend tests before implementation**

```ts
assert.equal(interactionImpulse('fusion','move',0.5).kind, 'ignition');
assert.equal(interactionImpulse('red-giant','move',0.5).kind, 'convection');
assert.equal(interactionImpulse('nebula','move',0.5).kind, 'gas-ripple');
assert.equal(interactionImpulse('white-dwarf','move',0.5).kind, 'dwarf-glow');
for (const scene of sceneIds) {
  const result = interactionImpulse(scene, 'move', 4, 0.7);
  assert.ok(result.strength >= 0 && result.strength <= 0.7);
}
```

- [ ] **Step 2: Run RED**

`node --experimental-strip-types --test tests/core/interactions.test.ts`

- [ ] **Step 3: Implement mapping + authored shader modes**

Shockwave remains click-only. Pointer interaction never writes global/chapter progress. Update `modeFor()` and particle shader branches for all kinds, using finite-distance clamps to avoid singularities.

- [ ] **Step 4: Run GREEN/typecheck and commit**

`node --experimental-strip-types --test tests/core/interactions.test.ts && npm run typecheck`

```bash
git add src/experience/interactions.ts tests/core/interactions.test.ts src/scenes/ParticleCloud.tsx src/shaders/particleMaterial.ts
git commit -m "feat: expand scene semantic interactions"
```

---

### Task 5: Runtime quality adaptation with explicit hysteresis

**Files:**
- Create: `src/experience/runtimeQuality.ts`
- Create: `tests/core/runtime-quality.test.ts`
- Modify: `src/app/quality.ts`
- Modify: `tests/core/quality.test.ts`
- Modify: `src/experience/store.ts`
- Modify: `src/experience/ExperienceCanvas.tsx`

**Produces:**

```ts
export type AdaptiveLevel = 0 | 1 | 2 | 3;
export interface RuntimeQualityState { level: AdaptiveLevel; slowFrames: number; fastFrames: number }
export interface RenderBudget {
  dpr: number;
  particleBudget: number;
  postprocessing: boolean;
  secondaryLayers: boolean;
  shaderComplexity: 'full' | 'reduced';
}
export function createRuntimeQualityState(): RuntimeQualityState;
export function observeFrame(state: RuntimeQualityState, frameMs: number): RuntimeQualityState;
export function renderBudgetFor(profile: QualityProfile, level: AdaptiveLevel): RenderBudget;
```

Store gains `adaptiveLevel` and `setAdaptiveLevel(level)`.

- [ ] **Step 1: Write hysteresis RED test**

Threshold contract:
- slow sample `>=24ms`;
- fast sample `<=17ms`;
- downgrade after 45 consecutive/accumulated slow samples without a fast reset;
- recover one level only after 240 fast samples;
- clamp level 0..3.

```ts
let state = createRuntimeQualityState();
for (let i = 0; i < 45; i++) state = observeFrame(state, 30);
assert.equal(state.level, 1);
for (let i = 0; i < 239; i++) state = observeFrame(state, 12);
assert.equal(state.level, 1);
state = observeFrame(state, 12);
assert.equal(state.level, 0);
```

- [ ] **Step 2: Run RED**

`node --experimental-strip-types --test tests/core/runtime-quality.test.ts`

- [ ] **Step 3: Implement cost reduction order**

Level 0 = static profile. Degrade in order: disable/reduce postFX -> particle budget -> DPR -> secondary layers; level 3 also selects reduced shader complexity. Do not modify chapter timing.

- [ ] **Step 4: Add `FrameQualityProbe` inside Canvas**

Use `delta * 1000`, keep the rolling state in a ref, and write Zustand only when adaptive level changes—not every frame.

- [ ] **Step 5: Run GREEN/build and commit**

`node --experimental-strip-types --test tests/core/runtime-quality.test.ts tests/core/quality.test.ts && npm run build`

```bash
git add src/experience/runtimeQuality.ts tests/core/runtime-quality.test.ts src/app/quality.ts tests/core/quality.test.ts src/experience/store.ts src/experience/ExperienceCanvas.tsx
git commit -m "feat: add adaptive runtime render quality"
```

---

### Task 6: PostFX resolver and Three.js composer integration

**Files:**
- Create: `src/experience/postfx.ts`
- Create: `tests/core/postfx.test.ts`
- Create: `src/experience/PostProcessingRig.tsx`
- Modify: `src/experience/ExperienceCanvas.tsx`

**Produces:**

```ts
export interface PostFxState {
  enabled: boolean;
  bloomStrength: number;
  bloomRadius: number;
  bloomThreshold: number;
  exposure: number;
  vignetteOpacity: number;
  chromaticFringe: number;
}
export function resolvePostFx(
  scene: SceneId,
  phase: CinematicPhase,
  transition: TransitionState,
  intent: PostFxIntent,
  budget: RenderBudget,
  reducedMotion: boolean,
): PostFxState;
```

- [ ] **Step 1: Write RED tests with fully defined fixtures**

```ts
const neutral: TransitionState = {
  mode:'crossfade', amount:0, outgoingOpacity:1, incomingOpacity:0,
  radialScale:1, densityScale:1, flash:0, warp:0, shell:0,
};
const budgetLow: RenderBudget = {
  dpr:1, particleBudget:9000, postprocessing:false,
  secondaryLayers:false, shaderComplexity:'reduced',
};
const budgetHigh: RenderBudget = {
  dpr:1.5, particleBudget:50000, postprocessing:true,
  secondaryLayers:true, shaderComplexity:'full',
};
const intent: PostFxIntent = { bloom:0.8, exposure:1.05, vignette:0.5, chromaticFringe:0.08 };
assert.equal(resolvePostFx('dust','settle',neutral,intent,budgetLow,false).enabled, false);
const flashState = { ...neutral, mode:'flash-cut' as const, amount:0.5, flash:1 };
const ignition = resolvePostFx('fusion','transition',flashState,intent,budgetHigh,false);
assert.ok(ignition.bloomStrength > 0.7);
assert.ok(ignition.chromaticFringe <= 0.12);
```

- [ ] **Step 2: Run RED**

`node --experimental-strip-types --test tests/core/postfx.test.ts`

- [ ] **Step 3: Implement pure bounded resolver**

Low/reduced-motion returns `enabled:false`. Chromatic fringe is `<=0.12` and nonzero only for high-energy ignition/accretion transitions.

- [ ] **Step 4: Implement `PostProcessingRig` without a new dependency**

```ts
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
```

Create/dispose composer with renderer/scene/camera lifecycle, resize with viewport, render using R3F render priority only when enabled, and leave CSS `.vignette` as non-WebGL framing fallback. Implement chromatic fringe as a small authored ShaderPass only if `chromaticFringe > 0`; otherwise do not pay the pass cost.

- [ ] **Step 5: Run GREEN/build and commit**

`node --experimental-strip-types --test tests/core/postfx.test.ts && npm run build`

```bash
git add src/experience/postfx.ts tests/core/postfx.test.ts src/experience/PostProcessingRig.tsx src/experience/ExperienceCanvas.tsx
git commit -m "feat: add adaptive cinematic post processing"
```

---

### Task 7: Upgrade dust, collapse, fusion, and main-sequence rendering

**Files:**
- Create: `src/shaders/noise.ts`
- Modify: `src/shaders/starMaterial.ts`
- Modify: `src/shaders/particleMaterial.ts`
- Modify: `src/scenes/StellarCore.tsx`
- Modify: `src/scenes/ParticleCloud.tsx`
- Modify: `src/scenes/sceneModel.ts`
- Modify: `tests/core/scene-model.test.ts`
- Modify: `src/scenes/DustCloudScene.tsx`
- Modify: `src/scenes/CollapseScene.tsx`
- Modify: `src/scenes/FusionScene.tsx`
- Modify: `src/scenes/MainSequenceScene.tsx`

**SceneVisualModel additions:**

```ts
surfaceTurbulence: number; // 0..1
shellInstability: number;  // 0..1
ejection: number;          // 0..1
lensing: number;           // 0..1
glowResponse: number;      // 0..1
```

`StellarCore` gains optional `turbulence`, `flash`, `qualityScale`. `ParticleCloud` gains optional `densityMorph`, `radialMotion`, `layerDepth`.

- [ ] **Step 1: Add model RED assertions**

Test late collapse spread < early collapse; ignition `glowResponse` peaks around ignition instead of staying maxed; main-sequence turbulence is finite/stable; every new scalar is 0..1 for every scene at progress `[-1,0,.5,1,2]` after clamping.

- [ ] **Step 2: Run RED**

`node --experimental-strip-types --test tests/core/scene-model.test.ts`

- [ ] **Step 3: Implement model fields + authored GLSL noise helpers**

Do not paste reference shaders. Use `noise.ts` to share newly-authored hash/value/fbm helpers across star/particle shaders.

- [ ] **Step 4: Implement required visual outcomes**

- Dust: three depth layers, parallax/density variation, click shockwave.
- Collapse: spiral + radial contraction, center brightening, increasing inward momentum.
- Fusion: finite flash, corona expansion, outward burst.
- Main sequence: granular star surface, procedural corona, orbit depth, radiation-pressure response, longest settle feeling.

- [ ] **Step 5: Verify and commit**

`node --experimental-strip-types --test tests/core/scene-model.test.ts tests/core/interactions.test.ts && npm run typecheck && npm run build`

```bash
git add src/shaders/noise.ts src/shaders/starMaterial.ts src/shaders/particleMaterial.ts src/scenes/StellarCore.tsx src/scenes/ParticleCloud.tsx src/scenes/sceneModel.ts tests/core/scene-model.test.ts src/scenes/DustCloudScene.tsx src/scenes/CollapseScene.tsx src/scenes/FusionScene.tsx src/scenes/MainSequenceScene.tsx
git commit -m "feat: upgrade early stellar phases"
```

---

### Task 8: Upgrade red giant, nebula, white dwarf, and black-hole rendering

**Files:**
- Modify: `src/scenes/RedGiantScene.tsx`
- Modify: `src/scenes/NebulaScene.tsx`
- Modify: `src/scenes/WhiteDwarfScene.tsx`
- Modify: `src/scenes/BlackHoleScene.tsx`
- Modify: `src/scenes/AccretionDisk.tsx`
- Modify: `src/shaders/diskMaterial.ts`
- Modify: `src/scenes/sceneModel.ts`
- Modify: `tests/core/scene-model.test.ts`

**AccretionDisk interface becomes:**

```ts
{ opacity: number; disturbance: number; warp: number; qualityScale: number; pointer: {x:number;y:number} }
```

- [ ] **Step 1: Add RED assertions**

Late red giant `shellInstability` rises; nebula `ejection` rises while stellar radius drops; white-dwarf radius contracts and glow stays finite; black-hole `lensing` is nonzero/bounded.

- [ ] **Step 2: Run RED**

`node --experimental-strip-types --test tests/core/scene-model.test.ts`

- [ ] **Step 3: Implement outcomes**

- Red giant: visible radius growth, turbulent convection, late shell instability.
- Nebula: at least three independently scaled gas/shell layers, outward advection, visible residual core, wider spatial reveal.
- White dwarf: compact hot core, low motion, residual nebula fading.
- Black hole: layered accretion disk, shader-based lensing-like halo/distortion approximation, pointer modifies disk turbulence only; no physically exact ray tracing.

- [ ] **Step 4: Verify and commit**

`node --experimental-strip-types --test tests/core/scene-model.test.ts tests/core/interactions.test.ts && npm run typecheck && npm run build`

```bash
git add src/scenes/RedGiantScene.tsx src/scenes/NebulaScene.tsx src/scenes/WhiteDwarfScene.tsx src/scenes/BlackHoleScene.tsx src/scenes/AccretionDisk.tsx src/shaders/diskMaterial.ts src/scenes/sceneModel.ts tests/core/scene-model.test.ts
git commit -m "feat: upgrade late stellar phases"
```

---

### Task 9: Pure cinematic integration state + Canvas/Director wiring

**Files:**
- Create: `src/experience/cinematicState.ts`
- Create: `tests/core/cinematic-state.test.ts`
- Modify: `src/experience/ExperienceCanvas.tsx`
- Modify: `src/experience/store.ts`
- Modify: `src/scenes/SceneDirector.tsx`
- Modify: `src/scenes/StarField.tsx`

**Produces:**

```ts
export interface CinematicState {
  profile: CinematicChapterProfile;
  phase: CinematicPhase;
  phaseProgress: number;
  camera: CameraPose;
  transition: TransitionState;
  budget: RenderBudget;
  postFx: PostFxState;
}
export function resolveCinematicState(input: {
  chapterId: string;
  scene: SceneId;
  localProgress: number;
  pointer: {x:number;y:number};
  quality: QualityProfile;
  adaptiveLevel: AdaptiveLevel;
}): CinematicState;
```

- [ ] **Step 1: Write RED integration tests**

```ts
const a = resolveCinematicState({ chapterId:'collapse', scene:'collapse', localProgress:.6, pointer:{x:0,y:0}, quality:high, adaptiveLevel:0 });
const b = resolveCinematicState({ chapterId:'collapse', scene:'collapse', localProgress:.6, pointer:{x:0,y:0}, quality:high, adaptiveLevel:0 });
assert.deepEqual(a, b);
const reduced = resolveCinematicState({ chapterId:'elsewhere', scene:'black-hole', localProgress:.95, pointer:{x:1,y:1}, quality:{...high,reducedMotion:true}, adaptiveLevel:0 });
assert.equal(reduced.transition.warp, 0);
```

Define `high` inside the test as:

```ts
const high = { tier:'high', dpr:1.5, particleBudget:64000, reducedMotion:false, postprocessing:true } as const;
```

- [ ] **Step 2: Run RED**

`node --experimental-strip-types --test tests/core/cinematic-state.test.ts`

- [ ] **Step 3: Implement pure composition resolver**

It calls Tasks 1/2/3/5/6 pure functions only. No React, Three.js renderer, Date, random, or elapsed-time dependency.

- [ ] **Step 4: Replace old global CameraRig with resolved chapter camera pose**

Lerp actual camera toward deterministic pose for visual smoothness; set `camera.fov` from pose and update projection only on material change. Canvas derives `RenderBudget`, StarField count, postFX and SceneDirector state from the same `CinematicState` to avoid divergence.

- [ ] **Step 5: Verify and commit**

`node --experimental-strip-types --test tests/core/cinematic-state.test.ts tests/core/cinematic.test.ts tests/core/camera-track.test.ts tests/core/transitions.test.ts tests/core/runtime-quality.test.ts tests/core/postfx.test.ts && npm run build`

```bash
git add src/experience/cinematicState.ts tests/core/cinematic-state.test.ts src/experience/ExperienceCanvas.tsx src/experience/store.ts src/scenes/SceneDirector.tsx src/scenes/StarField.tsx
git commit -m "feat: integrate V2 cinematic renderer"
```

---

### Task 10: Scene-aware procedural WebAudio envelopes

**Files:**
- Create: `src/audio/sceneAudio.ts`
- Create: `tests/core/scene-audio.test.ts`
- Modify: `src/audio/ambient.ts`
- Modify: `src/components/SoundToggle.tsx`

**Produces:**

```ts
export interface SceneAudioEnvelope { lowHz: number; highHz: number; filterHz: number; gain: number; noise: number }
export function sceneAudioEnvelope(scene: SceneId, localProgress: number): SceneAudioEnvelope;
```

`AmbientDriver` gains optional `setEnvelope?(envelope: SceneAudioEnvelope): void`; `AmbientController` gains `setEnvelope(envelope): void`. Existing injected test drivers remain valid.

- [ ] **Step 1: Write RED tests**

```ts
const main = sceneAudioEnvelope('main-sequence', .5);
const black = sceneAudioEnvelope('black-hole', .5);
assert.ok(black.lowHz < main.lowHz);
assert.ok(main.gain >= 0 && main.gain <= .06);
```

Extend `audio.test.ts` to prove constructor still does not autoplay and `setEnvelope()` before enable does not start audio.

- [ ] **Step 2: Run RED**

`node --experimental-strip-types --test tests/core/audio.test.ts tests/core/scene-audio.test.ts`

- [ ] **Step 3: Implement bounded envelopes and WebAudio parameter ramps**

Use oscillator/filter/gain changes only after user-enabled audio. No network audio fetch and no copied audio asset.

- [ ] **Step 4: Wire SoundToggle to active scene/progress while enabled**

Read `chapterIndex`/`localProgress` from store, derive current `SceneId` from `chapters`, and call `controller.setEnvelope(...)` from an effect. Do not recreate the controller on chapter changes.

- [ ] **Step 5: Verify and commit**

`node --experimental-strip-types --test tests/core/audio.test.ts tests/core/scene-audio.test.ts && npm run test:run`

```bash
git add src/audio/sceneAudio.ts tests/core/scene-audio.test.ts src/audio/ambient.ts src/components/SoundToggle.tsx
git commit -m "feat: add scene aware procedural audio"
```

---

### Task 11: Fidelity-oriented DOM staging, typography, mobile, and reduced-motion polish

**Files:**
- Modify: `src/styles/global.css`
- Modify: `src/components/ChapterSection.tsx`
- Modify: `src/app/ExperienceShell.tsx`
- Create: `tests/chapter-section-v2.test.tsx`

**DOM contract:**
- retain all ten semantic sections;
- expose current `data-cinematic-phase` on `.experience-shell` for deterministic QA;
- ChapterSection may expose its index/scene/id only as data attributes; narrative remains real text.

- [ ] **Step 1: Write RED DOM tests**

Render `ChapterSection` with a known chapter and assert its heading/body/cue/clock remain visible and `data-chapter-id`/scene class remain correct. Render `ExperienceShell` with `ExperienceCanvas` mocked to a harmless div and assert `data-cinematic-phase` exists, skip link exists, and sound button remains keyboard-addressable.

- [ ] **Step 2: Run RED**

`npm run test:run -- tests/chapter-section-v2.test.tsx`

- [ ] **Step 3: Implement scroll-derived phase exposure + CSS polish**

Requirements:
- stronger editorial scale/composition without copying reference CSS/source;
- phase-aware copy opacity/translate from data/CSS variables, never timers;
- keep 320px minimum layout;
- <=760px: bottom-weighted readable copy, reachable controls, reduced decorative cost;
- `prefers-reduced-motion`: no grain animation, smooth scrolling, or transform-driven copy choreography.

- [ ] **Step 4: Verify and commit**

`npm run test:run -- tests/chapter-section-v2.test.tsx && npm run build`

```bash
git add src/styles/global.css src/components/ChapterSection.tsx src/app/ExperienceShell.tsx tests/chapter-section-v2.test.tsx
git commit -m "feat: polish V2 narrative staging"
```

---

### Task 12: Playwright desktop/mobile/reduced-motion browser QA and visual checkpoints

**Files:**
- Create: `tests/e2e/v2-experience.spec.ts`
- Modify: `playwright.config.ts`
- Keep: `tests/e2e/experience.spec.ts`

**Projects:**
- `chromium-desktop` = Desktop Chrome.
- `chromium-mobile` = `devices['Pixel 7']`.
- Reduced-motion uses `page.emulateMedia({ reducedMotion: 'reduce' })` inside a test.

- [ ] **Step 1: Add browser tests**

Each path captures both `pageerror` and console messages of type `error`, opens `/`, verifies main + ten chapters, traverses the full scroll, and expects zero breaking errors. Desktop verifies the black-hole `elsewhere` chapter. Mobile verifies final chapter and sound control reachability. Reduced-motion verifies full journey reachability and a lower-motion phase state.

- [ ] **Step 2: Add deterministic human-review screenshots**

Capture stable scroll checkpoints named:
- `dust-settle.png`
- `collapse-late.png`
- `fusion-after.png`
- `main-sequence-settle.png`
- `red-giant-expanded.png`
- `nebula-wide.png`
- `white-dwarf.png`
- `black-hole.png`

Attach them as Playwright run artifacts; do not commit pixel-golden baselines in V2.

- [ ] **Step 3: Run browser suite**

`npx playwright install chromium && npm run test:e2e`

Expected: all configured Chromium paths PASS with zero page/console breaking errors.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/v2-experience.spec.ts playwright.config.ts
git commit -m "test: add V2 browser and visual QA"
```

---

### Task 13: Preserve deployment compatibility and add deterministic predeploy gate

**Files:**
- Modify: `.github/workflows/deploy-pages.yml`
- Modify: `tests/core/github-pages-config.test.ts`
- Modify: `README.md`

- [ ] **Step 1: Extend Pages regression test first**

Keep assertions for:
- `VITE_BASE_PATH: /cosmic-dust-journey/`
- `npm run build`
- `Verify Pages artifact`
- positive `/cosmic-dust-journey/assets/` grep
- negative `/src/main.tsx` grep

Add an assertion that `npm run test:core` occurs before artifact upload.

- [ ] **Step 2: Run RED**

`node --experimental-strip-types --test tests/core/github-pages-config.test.ts`

Expected: FAIL because the workflow does not yet call `test:core`.

- [ ] **Step 3: Add exact deterministic core gate**

```yaml
- name: Core regression tests
  run: npm run test:core
```

Place it after dependency install and before build/upload. Do not make Playwright a Pages blocking gate until repeated CI runs prove it stable.

- [ ] **Step 4: Update README**

Document V2 cinematic director, adaptive runtime quality, reduced-motion route, scene-aware audio, visual QA, and unchanged Vercel/Cloudflare root-base configuration.

- [ ] **Step 5: Verify and commit**

`npm run test:core && npm run check`

```bash
git add .github/workflows/deploy-pages.yml tests/core/github-pages-config.test.ts README.md
git commit -m "ci: gate V2 Pages deploy on core regressions"
```

---

### Task 14: Exact-head release verification, PR, visual review, and merge

**Files:** no planned production edits; fix any discovered defect in its owning module and rerun the affected gate.

- [ ] **Step 1: Fresh exact-head commands**

```bash
npm run test:core
npm run check
npm run test:e2e
git diff --check main...HEAD
```

Expected: zero failures/errors.

- [ ] **Step 2: Check every spec success criterion**

Explicitly verify:
1. distinct authored camera choreography for every major stellar phase;
2. transitions materially richer than V1 crossfade-only behavior;
3. all eight scene families upgraded;
4. interactions bounded/optional/scene-semantic;
5. reduced-motion and mobile coherent;
6. runtime quality reduces rendering cost without narrative changes;
7. deterministic choreography/quality core tests present;
8. Playwright covers desktop/mobile/reduced-motion/black-hole path;
9. GitHub Pages/Vercel/Cloudflare build compatibility preserved;
10. clean-room constraint preserved.

- [ ] **Step 3: Human visual review**

Review all eight screenshots. Treat clipping, unreadable copy, transition discontinuity, excessive bloom/fringe, severe aliasing, or obstructed mobile controls as blockers.

- [ ] **Step 4: Open PR to `main`**

Title: `V2 cinematic fidelity and visual upgrade`

Body includes A fidelity + B visual upgrade + C production quality, exact verification results, visual-review status, and clean-room statement.

- [ ] **Step 5: Merge only on exact-head green + approved visual review**

Squash merge; no force/bypass. After merge, verify the GitHub Pages workflow for the resulting `main` SHA reaches success and its artifact still passes the base-path guard.
