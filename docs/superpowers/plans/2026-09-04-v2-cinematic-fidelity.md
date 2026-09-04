# Cosmic Dust Journey V2 Cinematic Fidelity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade V1 into a clean-room V2 with chapter-specific cinematic choreography, richer authored stellar visuals, bounded scene-semantic interactions, adaptive runtime rendering quality, optional scene-aware sound, and deterministic production QA across GitHub Pages, Vercel, and Cloudflare.

**Architecture:** Keep the existing semantic DOM narrative, normalized scroll timeline, Zustand store, and persistent React Three Fiber canvas. Add pure data-driven cinematic modules in `src/experience/` that resolve phase, camera, transitions, postFX parameters, and adaptive quality; scene components remain isolated render units and receive resolved state through explicit props.

**Tech Stack:** React 19, TypeScript 5.9, Vite 8, Three.js 0.185, React Three Fiber 9, GSAP ScrollTrigger 3.15, Zustand 5, Node core tests, Vitest, Playwright, Three.js `addons/postprocessing` modules, WebAudio.

**Spec:** `docs/superpowers/specs/2026-09-04-v2-cinematic-fidelity-design.md`

## Global Constraints

- V2 remains clean-room: do not copy, de-minify, recover, or transplant proprietary reference JavaScript, GLSL, audio, or unknown-rights artwork.
- Preserve ten existing narrative chapters and eight existing `SceneId` values.
- Scroll remains the only source of narrative progress; pointer/touch input may only add bounded visual interaction.
- Every cinematic calculation used by rendering must be deterministic from chapter id, normalized local progress, quality state, and bounded pointer/impulse input.
- `prefers-reduced-motion` must select a dedicated lower-motion path, not merely reduce animation duration.
- No critical information may exist only in WebGL.
- Sound remains muted until explicit user gesture and audio failure must not break the experience.
- Do not add a new post-processing dependency; use modules shipped with the pinned Three.js package (`three/addons/postprocessing/*`) so the runtime dependency surface stays unchanged.
- GitHub Pages builds must keep `VITE_BASE_PATH=/cosmic-dust-journey/`; Vercel and Cloudflare builds default to `/`.
- The existing Pages artifact guard must remain intact and continue rejecting `/src/main.tsx` in `dist/index.html`.
- Implementation work stays on `feature/v2-cinematic-fidelity` or short-lived child branches; no force/bypass merge.

---

## File/Module Map

New focused modules:

- `src/experience/cinematic.ts` — cinematic phase/profile types and phase resolution.
- `src/experience/cinematicProfiles.ts` — one authored profile for each of the ten chapter ids.
- `src/experience/cameraTrack.ts` — deterministic camera/FOV interpolation with bounded pointer offsets.
- `src/experience/transitions.ts` — pure transition-state resolver for all V2 transition modes.
- `src/experience/runtimeQuality.ts` — frame-time hysteresis and adaptive rendering level.
- `src/experience/postfx.ts` — pure mapping from scene/cinematic/quality state to postFX parameters.
- `src/experience/PostProcessingRig.tsx` — R3F integration using Three.js EffectComposer/RenderPass/UnrealBloomPass.
- `src/audio/sceneAudio.ts` — deterministic per-scene audio envelope parameters.
- `src/shaders/noise.ts` — reusable authored GLSL noise helpers.
- `tests/core/cinematic.test.ts`, `camera-track.test.ts`, `transitions.test.ts`, `runtime-quality.test.ts`, `postfx.test.ts`, `scene-audio.test.ts` — dependency-light deterministic tests.
- `tests/e2e/v2-experience.spec.ts` — desktop/mobile/reduced-motion/alternate-route/browser-error coverage.

Modified integration modules:

- `src/experience/store.ts`, `ExperienceCanvas.tsx`, `interactions.ts`.
- `src/scenes/sceneTypes.ts`, `sceneModel.ts`, `SceneDirector.tsx`, `ParticleCloud.tsx`, `StellarCore.tsx`, `AccretionDisk.tsx`, and all eight scene components.
- `src/shaders/particleMaterial.ts`, `starMaterial.ts`, `diskMaterial.ts`.
- `src/app/quality.ts`, `ExperienceShell.tsx`.
- `src/components/ChapterSection.tsx`, `SoundToggle.tsx` only where V2 state must be exposed without moving orchestration into components.
- `src/audio/ambient.ts`, `src/styles/global.css`.
- `playwright.config.ts`, `.github/workflows/deploy-pages.yml`, `README.md`.

---

### Task 1: Cinematic chapter profiles and four-phase resolver

**Files:**
- Create: `src/experience/cinematic.ts`
- Create: `src/experience/cinematicProfiles.ts`
- Create: `tests/core/cinematic.test.ts`

**Interfaces:**
- Produces:
  - `type CinematicPhase = 'enter' | 'settle' | 'interact' | 'transition'`
  - `type TransitionMode = 'crossfade' | 'morph-density' | 'radial-collapse' | 'radial-expansion' | 'shell-ejection' | 'flash-cut' | 'dissolve-to-point' | 'accretion-warp'`
  - `interface PhaseStops { enterEnd: number; settleEnd: number; interactEnd: number }`
  - `interface CinematicChapterProfile { chapterId: string; transition: TransitionMode; phaseStops: PhaseStops; camera: CameraTrackSpec; postFx: PostFxIntent; particleMultiplier: number; interactionMax: number }`
  - `resolveCinematicPhase(profile, localProgress): { phase: CinematicPhase; phaseProgress: number }`
  - `cinematicProfileFor(chapterId): CinematicChapterProfile`

- [ ] **Step 1: Write the failing phase/profile tests**

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { cinematicProfileFor, resolveCinematicPhase } from '../../src/experience/cinematic.ts';

test('all narrative chapters have explicit cinematic profiles', () => {
  for (const id of ['overture','cold-cloud','collapse','ignition','main-sequence','red-giant','shedding','white-dwarf','elsewhere','epilogue']) {
    assert.equal(cinematicProfileFor(id).chapterId, id);
  }
});

test('phase resolver exposes enter settle interact transition', () => {
  const profile = cinematicProfileFor('main-sequence');
  assert.equal(resolveCinematicPhase(profile, 0.05).phase, 'enter');
  assert.equal(resolveCinematicPhase(profile, 0.3).phase, 'settle');
  assert.equal(resolveCinematicPhase(profile, 0.6).phase, 'interact');
  assert.equal(resolveCinematicPhase(profile, 0.95).phase, 'transition');
});
```

- [ ] **Step 2: Run RED**

Run: `node --experimental-strip-types --test tests/core/cinematic.test.ts`
Expected: FAIL because `src/experience/cinematic.ts` does not exist.

- [ ] **Step 3: Implement the pure types/resolver and ten explicit profiles**

Use phase normalization equivalent to:

```ts
export function resolveCinematicPhase(profile: CinematicChapterProfile, input: number) {
  const p = clamp01(input);
  const { enterEnd, settleEnd, interactEnd } = profile.phaseStops;
  if (p < enterEnd) return { phase: 'enter' as const, phaseProgress: p / enterEnd };
  if (p < settleEnd) return { phase: 'settle' as const, phaseProgress: (p - enterEnd) / (settleEnd - enterEnd) };
  if (p < interactEnd) return { phase: 'interact' as const, phaseProgress: (p - settleEnd) / (interactEnd - settleEnd) };
  return { phase: 'transition' as const, phaseProgress: (p - interactEnd) / (1 - interactEnd) };
}
```

Profiles must explicitly assign these V2 transition intents:
- `overture`: `morph-density`
- `cold-cloud`: `radial-collapse`
- `collapse`: `flash-cut`
- `ignition`: `crossfade`
- `main-sequence`: `radial-expansion`
- `red-giant`: `shell-ejection`
- `shedding`: `dissolve-to-point`
- `white-dwarf`: `crossfade`
- `elsewhere`: `accretion-warp`
- `epilogue`: `crossfade`

- [ ] **Step 4: Run GREEN plus existing core suite**

Run: `node --experimental-strip-types --test tests/core/cinematic.test.ts tests/core/timeline.test.ts tests/core/content.test.ts`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/experience/cinematic.ts src/experience/cinematicProfiles.ts tests/core/cinematic.test.ts
git commit -m "feat: add V2 cinematic chapter profiles"
```

---

### Task 2: Deterministic chapter-specific camera tracks

**Files:**
- Create: `src/experience/cameraTrack.ts`
- Modify: `src/experience/cinematic.ts`
- Modify: `src/experience/cinematicProfiles.ts`
- Create: `tests/core/camera-track.test.ts`

**Interfaces:**
- Consumes: `CinematicChapterProfile.camera` from Task 1.
- Produces:
  - `type Vec3 = readonly [number, number, number]`
  - `interface CameraKeyframe { at: number; position: Vec3; target: Vec3; fov: number }`
  - `interface CameraTrackSpec { keyframes: readonly CameraKeyframe[]; pointerInfluence: readonly [number, number]; microParallax: number; reducedMotionScale: number }`
  - `sampleCameraTrack(track, progress, pointer, reducedMotion): CameraPose`

- [ ] **Step 1: Write failing interpolation/bounds tests**

```ts
const pose = sampleCameraTrack(track, 0.5, { x: 9, y: -9 }, false);
assert.ok(pose.position[0] <= 0.5 && pose.position[0] >= -0.5);
assert.ok(pose.fov >= 38 && pose.fov <= 52);
const reduced = sampleCameraTrack(track, 0.5, { x: 1, y: 1 }, true);
assert.ok(Math.abs(reduced.position[0]) < Math.abs(pose.position[0]));
```

- [ ] **Step 2: Run RED**

Run: `node --experimental-strip-types --test tests/core/camera-track.test.ts`
Expected: FAIL because `sampleCameraTrack` is missing.

- [ ] **Step 3: Implement segment interpolation**

Clamp progress to 0..1, select the surrounding ordered keyframes, smoothstep the local segment, linearly interpolate position/target/FOV, clamp pointer to `[-1,1]`, then apply only the configured pointer influence. Reduced-motion multiplies pointer/micro-parallax amplitude by `reducedMotionScale` and does not change scroll timing.

- [ ] **Step 4: Populate distinct tracks for all ten profiles**

Required directionality:
- dust/overture: wide slow entry;
- collapse: progressive dolly-in;
- ignition: compressed framing plus brief FOV expansion;
- main sequence: stable low-amplitude orbit/parallax;
- red giant: pull-back as apparent radius expands;
- shedding/nebula: wide reveal;
- white dwarf: quiet centered framing;
- elsewhere/black hole: low-angle disk reveal;
- epilogue: slow drift away.

- [ ] **Step 5: Run GREEN**

Run: `node --experimental-strip-types --test tests/core/camera-track.test.ts tests/core/cinematic.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/experience/cameraTrack.ts src/experience/cinematic.ts src/experience/cinematicProfiles.ts tests/core/camera-track.test.ts
git commit -m "feat: add chapter camera choreography"
```

---

### Task 3: Transition-state resolver and SceneDirector integration

**Files:**
- Create: `src/experience/transitions.ts`
- Create: `tests/core/transitions.test.ts`
- Modify: `src/scenes/sceneTypes.ts`
- Modify: `src/scenes/SceneDirector.tsx`

**Interfaces:**
- Produces:
  - `interface TransitionState { mode: TransitionMode; amount: number; outgoingOpacity: number; incomingOpacity: number; radialScale: number; densityScale: number; flash: number; warp: number; shell: number }`
  - `resolveTransition(mode, phase, phaseProgress, reducedMotion): TransitionState`
- `SceneProps` gains `cinematic: TransitionState`.

- [ ] **Step 1: Write failing transition tests**

```ts
const flash = resolveTransition('flash-cut', 'transition', 0.5, false);
assert.ok(flash.flash > 0.5);
const reduced = resolveTransition('accretion-warp', 'transition', 1, true);
assert.equal(reduced.mode, 'crossfade');
assert.equal(reduced.warp, 0);
```

- [ ] **Step 2: Run RED**

Run: `node --experimental-strip-types --test tests/core/transitions.test.ts`
Expected: FAIL because module is missing.

- [ ] **Step 3: Implement pure transition mapping**

All modes return bounded 0..1 values. For reduced motion, any mode other than `crossfade` resolves to crossfade semantics while retaining the same phase duration.

- [ ] **Step 4: Replace the hard-coded `0.76/0.24` crossfade in `SceneDirector`**

Flow:

```ts
const profile = cinematicProfileFor(chapter.id);
const phase = resolveCinematicPhase(profile, progress);
const transition = resolveTransition(profile.transition, phase.phase, phase.phaseProgress, quality.reducedMotion);
```

Render current/next scenes using `outgoingOpacity`/`incomingOpacity`, pass the same resolved `cinematic` object into both scene components, and preserve the current fallback when the current and next chapter share the same scene id.

- [ ] **Step 5: Run GREEN and typecheck**

Run: `node --experimental-strip-types --test tests/core/transitions.test.ts tests/core/cinematic.test.ts && npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/experience/transitions.ts tests/core/transitions.test.ts src/scenes/sceneTypes.ts src/scenes/SceneDirector.tsx
git commit -m "feat: add cinematic scene transitions"
```

---

### Task 4: Expand bounded scene-semantic interactions

**Files:**
- Modify: `src/experience/interactions.ts`
- Modify: `tests/core/interactions.test.ts`
- Modify: `src/scenes/ParticleCloud.tsx`
- Modify: `src/shaders/particleMaterial.ts`

**Interfaces:**
- `InteractionKind` becomes:
  - `shockwave | gravity | ignition | radiation | convection | gas-ripple | dwarf-glow | disk-disturbance | none`
- `interactionImpulse(scene, event, localProgress, maxStrength = 1): InteractionImpulse`
- Strength must always satisfy `0 <= strength <= maxStrength <= 1`.

- [ ] **Step 1: Extend tests to every scene family and strength bounds**

```ts
assert.equal(interactionImpulse('fusion','move',0.5).kind, 'ignition');
assert.equal(interactionImpulse('red-giant','move',0.5).kind, 'convection');
assert.equal(interactionImpulse('nebula','move',0.5).kind, 'gas-ripple');
assert.equal(interactionImpulse('white-dwarf','move',0.5).kind, 'dwarf-glow');
for (const scene of sceneIds) assert.ok(interactionImpulse(scene,'move',9).strength <= 1);
```

- [ ] **Step 2: Run RED**

Run: `node --experimental-strip-types --test tests/core/interactions.test.ts`
Expected: FAIL for new kinds.

- [ ] **Step 3: Implement bounded mapping and shader modes**

Keep shockwave click-only. Map new particle shader modes to separate authored formulas; never use pointer input to alter chapter, route, or global progress.

- [ ] **Step 4: Run GREEN**

Run: `node --experimental-strip-types --test tests/core/interactions.test.ts && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/experience/interactions.ts tests/core/interactions.test.ts src/scenes/ParticleCloud.tsx src/shaders/particleMaterial.ts
git commit -m "feat: expand scene semantic interactions"
```

---

### Task 5: Runtime adaptive quality with hysteresis

**Files:**
- Create: `src/experience/runtimeQuality.ts`
- Create: `tests/core/runtime-quality.test.ts`
- Modify: `src/app/quality.ts`
- Modify: `tests/core/quality.test.ts`
- Modify: `src/experience/store.ts`
- Modify: `src/experience/ExperienceCanvas.tsx`

**Interfaces:**
- Produces:
  - `type AdaptiveLevel = 0 | 1 | 2 | 3`
  - `interface RuntimeQualityState { level: AdaptiveLevel; slowFrames: number; fastFrames: number }`
  - `observeFrame(state, frameMs): RuntimeQualityState`
  - `interface RenderBudget { dpr: number; particleBudget: number; postprocessing: boolean; secondaryLayers: boolean; shaderComplexity: 'full' | 'reduced' }`
  - `renderBudgetFor(profile, level): RenderBudget`
- Store gains `adaptiveLevel` and `setAdaptiveLevel(level)`.

- [ ] **Step 1: Write hysteresis tests**

Use explicit thresholds:
- slow sample: `frameMs >= 24`
- fast sample: `frameMs <= 17`
- downgrade after 45 slow samples;
- recovery only after 240 fast samples;
- level clamps 0..3.

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

Run: `node --experimental-strip-types --test tests/core/runtime-quality.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement pure quality state and budget scaling**

Cost reduction order must be encoded explicitly: postFX -> particles -> DPR -> secondary layers -> shader complexity. Narrative timing fields are not inputs to this module.

- [ ] **Step 4: Add a `FrameQualityProbe` R3F component**

Use `useFrame((_, delta) => ...)`, sample `delta * 1000`, call pure `observeFrame`, and only write to Zustand when `level` changes. Do not write state on every frame.

- [ ] **Step 5: Run GREEN plus build**

Run: `node --experimental-strip-types --test tests/core/runtime-quality.test.ts tests/core/quality.test.ts && npm run build`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/experience/runtimeQuality.ts tests/core/runtime-quality.test.ts src/app/quality.ts tests/core/quality.test.ts src/experience/store.ts src/experience/ExperienceCanvas.tsx
git commit -m "feat: add adaptive runtime render quality"
```

---

### Task 6: Pure postFX intent and Three.js composer integration

**Files:**
- Create: `src/experience/postfx.ts`
- Create: `tests/core/postfx.test.ts`
- Create: `src/experience/PostProcessingRig.tsx`
- Modify: `src/experience/ExperienceCanvas.tsx`

**Interfaces:**
- Produces `interface PostFxState { enabled: boolean; bloomStrength: number; bloomRadius: number; bloomThreshold: number; exposure: number; vignetteOpacity: number; chromaticFringe: number }`
- `resolvePostFx(scene, phase, transition, budget): PostFxState`

- [ ] **Step 1: Write failing pure mapping tests**

```ts
assert.equal(resolvePostFx('dust','settle',neutral,budgetLow).enabled, false);
const ignition = resolvePostFx('fusion','transition',flashState,budgetHigh);
assert.ok(ignition.bloomStrength > 0.7);
assert.ok(ignition.chromaticFringe <= 0.12);
```

- [ ] **Step 2: Run RED**

Run: `node --experimental-strip-types --test tests/core/postfx.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement bounded postFX parameters**

High/medium may enable composer effects; low and reduced-motion return `enabled:false`. Chromatic fringe remains `<=0.12` and is nonzero only during ignition/accretion high-energy transitions.

- [ ] **Step 4: Implement `PostProcessingRig` with Three.js addons**

Use:

```ts
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
```

Construct/dispose composer on renderer/scene/camera changes, resize with viewport, update bloom/exposure from resolved state, and render with `useFrame(..., 1)` only when enabled. Keep CSS `.vignette` as the accessibility-safe framing fallback.

- [ ] **Step 5: Run GREEN/build**

Run: `node --experimental-strip-types --test tests/core/postfx.test.ts && npm run build`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/experience/postfx.ts tests/core/postfx.test.ts src/experience/PostProcessingRig.tsx src/experience/ExperienceCanvas.tsx
git commit -m "feat: add adaptive cinematic post processing"
```

---

### Task 7: Stellar surface, dust, collapse, ignition, and main-sequence visual upgrade

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

**Interfaces:**
- Extend `SceneVisualModel` with `surfaceTurbulence`, `shellInstability`, `ejection`, `lensing`, `glowResponse`, each bounded 0..1.
- `StellarCore` gains optional `turbulence`, `flash`, `qualityScale` props.
- `ParticleCloud` gains optional `densityMorph`, `radialMotion`, `layerDepth` props.

- [ ] **Step 1: Extend scene-model tests before render work**

Assert:
- late collapse spread < early collapse spread;
- ignition flash peaks around middle progress rather than staying permanently high;
- main sequence turbulence remains bounded/stable;
- every newly added scalar is finite and within 0..1.

- [ ] **Step 2: Run RED**

Run: `node --experimental-strip-types --test tests/core/scene-model.test.ts`
Expected: FAIL for missing model fields.

- [ ] **Step 3: Implement model fields and authored shader helpers**

`noise.ts` exports GLSL strings/functions authored in-repo; do not paste reference shader code. Upgrade star shader granulation with low-frequency plus cellular-like noise, controlled by quality scale.

- [ ] **Step 4: Upgrade the four scenes**

Required observable outcomes:
- Dust: 3 depth layers, subtle parallax, click shockwave.
- Collapse: spiral/radial contraction and center brightening.
- Fusion: finite ignition flash/corona burst.
- Main sequence: stable granular star, corona, orbit depth, radiation-pressure particle response.

- [ ] **Step 5: Run core/type/build gates**

Run: `node --experimental-strip-types --test tests/core/scene-model.test.ts tests/core/interactions.test.ts && npm run typecheck && npm run build`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/shaders/noise.ts src/shaders/starMaterial.ts src/shaders/particleMaterial.ts src/scenes/StellarCore.tsx src/scenes/ParticleCloud.tsx src/scenes/sceneModel.ts tests/core/scene-model.test.ts src/scenes/DustCloudScene.tsx src/scenes/CollapseScene.tsx src/scenes/FusionScene.tsx src/scenes/MainSequenceScene.tsx
git commit -m "feat: upgrade early stellar phases"
```

---

### Task 8: Red giant, nebula, white dwarf, and black-hole visual upgrade

**Files:**
- Modify: `src/scenes/RedGiantScene.tsx`
- Modify: `src/scenes/NebulaScene.tsx`
- Modify: `src/scenes/WhiteDwarfScene.tsx`
- Modify: `src/scenes/BlackHoleScene.tsx`
- Modify: `src/scenes/AccretionDisk.tsx`
- Modify: `src/shaders/diskMaterial.ts`
- Modify: `src/scenes/sceneModel.ts`
- Modify: `tests/core/scene-model.test.ts`

**Interfaces:**
- Uses Task 7 model fields plus Task 3 `TransitionState`.
- `AccretionDisk` gains `warp`, `qualityScale`, and `pointer` inputs; distortion remains an authored approximation, not ray tracing.

- [ ] **Step 1: Add RED model assertions**

Assert:
- red giant `shellInstability` rises late;
- nebula `ejection` rises while stellar radius falls;
- white dwarf radius contracts and glow remains finite;
- black hole `lensing` is nonzero and bounded.

- [ ] **Step 2: Run RED**

Run: `node --experimental-strip-types --test tests/core/scene-model.test.ts`
Expected: FAIL until values are implemented.

- [ ] **Step 3: Implement scene/model changes**

Required outcomes:
- red giant: visible radius growth plus turbulent envelope and late instability;
- nebula: at least three independently scaled shell/gas layers with outward advection and retained remnant;
- white dwarf: compact hot core with progressively quieter residual nebula;
- black hole: layered accretion disk, lensing-like halo/distortion, pointer-driven turbulence only.

- [ ] **Step 4: Run GREEN/type/build**

Run: `node --experimental-strip-types --test tests/core/scene-model.test.ts tests/core/interactions.test.ts && npm run typecheck && npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/scenes/RedGiantScene.tsx src/scenes/NebulaScene.tsx src/scenes/WhiteDwarfScene.tsx src/scenes/BlackHoleScene.tsx src/scenes/AccretionDisk.tsx src/shaders/diskMaterial.ts src/scenes/sceneModel.ts tests/core/scene-model.test.ts
git commit -m "feat: upgrade late stellar phases"
```

---

### Task 9: Wire chapter camera rig, resolved cinematic state, and runtime budgets into Canvas

**Files:**
- Modify: `src/experience/ExperienceCanvas.tsx`
- Modify: `src/experience/store.ts`
- Modify: `src/scenes/SceneDirector.tsx`
- Modify: `src/scenes/StarField.tsx`

**Interfaces:**
- Consumes Tasks 1–6.
- Store exposes the current quality profile + adaptive level; derived budget may remain local and should not be duplicated into multiple stores.

- [ ] **Step 1: Add a small DOM/Vitest integration assertion**

Create `tests/experience-v2.test.tsx` asserting `ExperienceCanvas` wiring does not mutate chapter state from pointer events and that reduced-motion quality can render the shell without throwing.

- [ ] **Step 2: Run RED**

Run: `npm run test:run -- tests/experience-v2.test.tsx`
Expected: FAIL until new cinematic hooks are wired.

- [ ] **Step 3: Replace old global `CameraRig` behavior**

Resolve the active chapter profile and call `sampleCameraTrack(profile.camera, localProgress, pointer, reducedMotion)` every frame. Smooth only the actual Three.js camera toward the deterministic sampled pose; do not derive pose from elapsed time. Set camera FOV and call `updateProjectionMatrix()` only when FOV materially changes.

- [ ] **Step 4: Apply runtime render budget**

Use budget DPR, particle count multiplier, StarField count, optional secondary layers, postFX enablement, and shader quality scale. Keep narrative progress unchanged when adaptive level changes.

- [ ] **Step 5: Run GREEN/full unit gate**

Run: `npm run test:run && npm run typecheck && npm run build`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/experience/ExperienceCanvas.tsx src/experience/store.ts src/scenes/SceneDirector.tsx src/scenes/StarField.tsx tests/experience-v2.test.tsx
git commit -m "feat: integrate V2 cinematic renderer"
```

---

### Task 10: Scene-aware optional WebAudio envelopes

**Files:**
- Create: `src/audio/sceneAudio.ts`
- Create: `tests/core/scene-audio.test.ts`
- Modify: `src/audio/ambient.ts`
- Modify: `src/components/SoundToggle.tsx`
- Modify: `src/app/ExperienceShell.tsx`

**Interfaces:**
- Produces `interface SceneAudioEnvelope { lowHz: number; highHz: number; filterHz: number; gain: number; noise: number }`
- `sceneAudioEnvelope(scene, localProgress): SceneAudioEnvelope`
- `AmbientDriver` gains optional `setEnvelope(envelope): void`; existing injected test drivers remain valid by making it optional.

- [ ] **Step 1: Write failing deterministic envelope tests**

```ts
const main = sceneAudioEnvelope('main-sequence', 0.5);
const black = sceneAudioEnvelope('black-hole', 0.5);
assert.ok(black.lowHz < main.lowHz);
assert.ok(main.gain <= 0.06);
```

- [ ] **Step 2: Run RED**

Run: `node --experimental-strip-types --test tests/core/scene-audio.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement envelopes and WebAudio parameter ramps**

Use oscillator/filter/gain parameter changes only after audio has already been user-enabled. No autoplay, fetch, or bundled copied audio.

- [ ] **Step 4: Wire active scene/local progress to the running controller**

The controller remains created once; expose a safe `setEnvelope` forwarding method and call it only when sound is enabled. Audio initialization failure continues to force `soundEnabled=false` without affecting scroll/WebGL.

- [ ] **Step 5: Run GREEN**

Run: `node --experimental-strip-types --test tests/core/audio.test.ts tests/core/scene-audio.test.ts && npm run test:run`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/audio/sceneAudio.ts tests/core/scene-audio.test.ts src/audio/ambient.ts src/components/SoundToggle.tsx src/app/ExperienceShell.tsx
git commit -m "feat: add scene aware procedural audio"
```

---

### Task 11: Fidelity-oriented typography, staging, mobile, and reduced-motion polish

**Files:**
- Modify: `src/styles/global.css`
- Modify: `src/components/ChapterSection.tsx`
- Modify: `src/app/ExperienceShell.tsx`
- Modify: `tests/experience-v2.test.tsx`

**Interfaces:**
- DOM remains semantic and contains the full narrative.
- Add non-semantic data attributes only for deterministic QA, e.g. `data-cinematic-phase` on the shell when useful.

- [ ] **Step 1: Add RED DOM assertions**

Assert active chapter/phase attributes are present, all ten sections remain in the DOM, the sound control is keyboard reachable, and no Canvas-only copy is required.

- [ ] **Step 2: Run RED**

Run: `npm run test:run -- tests/experience-v2.test.tsx`
Expected: FAIL for new V2 state attributes.

- [ ] **Step 3: Apply CSS/DOM polish**

Requirements:
- stronger editorial scale and chapter-specific copy placement while keeping authored copy unchanged;
- transition-aware copy opacity/translate driven by CSS custom properties or data attributes, not timers;
- preserve minimum 320px layout;
- at <=760px use bottom-weighted readable copy and suppress expensive decorative layers;
- in `prefers-reduced-motion: reduce`, remove grain animation, scroll smoothing, transform-driven copy motion, and nonessential transition effects.

- [ ] **Step 4: Run GREEN and accessibility smoke tests**

Run: `npm run test:run && npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/styles/global.css src/components/ChapterSection.tsx src/app/ExperienceShell.tsx tests/experience-v2.test.tsx
git commit -m "feat: polish V2 narrative staging"
```

---

### Task 12: Playwright desktop/mobile/reduced-motion/alternate-route QA and visual checkpoints

**Files:**
- Create: `tests/e2e/v2-experience.spec.ts`
- Modify: `playwright.config.ts`
- Keep: `tests/e2e/experience.spec.ts`

**Interfaces:**
- Add Playwright projects:
  - `chromium-desktop`
  - `chromium-mobile` using `devices['Pixel 7']`
  - reduced-motion is a test-level `page.emulateMedia({ reducedMotion: 'reduce' })`, not a separate browser binary.

- [ ] **Step 1: Add desktop/mobile/reduced-motion tests**

Each test must capture `pageerror` and console `error`, visit `/`, verify 10 chapters, traverse all chapters, and assert no breaking errors. Mobile verifies sound control reachability and final chapter visibility. Reduced-motion checks the shell exposes reduced-motion quality/state and still reaches the epilogue.

- [ ] **Step 2: Add deterministic screenshot checkpoints for human review**

At stable scroll positions capture:
- `dust-settle.png`
- `collapse-late.png`
- `fusion-after.png`
- `main-sequence-settle.png`
- `red-giant-expanded.png`
- `nebula-wide.png`
- `white-dwarf.png`
- `black-hole.png`

Store them as Playwright run artifacts, not committed golden images. Do not use pixel-diff assertions in V2.

- [ ] **Step 3: Run browser RED/GREEN locally**

Run: `npx playwright install chromium && npm run test:e2e`
Expected after implementation: all configured Chromium projects PASS with no page/console breaking errors.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/v2-experience.spec.ts playwright.config.ts
git commit -m "test: add V2 browser and visual QA"
```

---

### Task 13: Preserve deploy gates and add V2 pre-deploy verification

**Files:**
- Modify: `.github/workflows/deploy-pages.yml`
- Modify: `tests/core/github-pages-config.test.ts`
- Modify: `README.md`

**Interfaces:**
- Existing exact Pages guard remains unchanged in meaning.
- Add a deterministic predeploy command in `package.json` only if the preceding test suite proves stable; otherwise keep workflow commands explicit.

- [ ] **Step 1: Extend the Pages config regression test first**

Assert workflow still contains:
- `VITE_BASE_PATH: /cosmic-dust-journey/`
- production `npm run build`
- `Verify Pages artifact`
- positive `/cosmic-dust-journey/assets/` grep
- negative `/src/main.tsx` grep

Also assert the workflow runs `npm run test:core` before uploading the Pages artifact.

- [ ] **Step 2: Run RED**

Run: `node --experimental-strip-types --test tests/core/github-pages-config.test.ts`
Expected: FAIL because workflow does not yet run `test:core`.

- [ ] **Step 3: Add deterministic core gate before build/upload**

Insert:

```yaml
- name: Core regression tests
  run: npm run test:core
```

Do not make Playwright a blocking Pages deploy gate in this task; browser CI may be added separately only after repeatability is demonstrated.

- [ ] **Step 4: Update README V2 behavior/deploy notes**

Document cinematic director, adaptive runtime quality, reduced-motion path, scene-aware sound, visual QA, and unchanged Vercel/Cloudflare root-base deployment.

- [ ] **Step 5: Run GREEN/full check**

Run: `npm run test:core && npm run check`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add .github/workflows/deploy-pages.yml tests/core/github-pages-config.test.ts README.md
git commit -m "ci: gate V2 Pages deploy on core regressions"
```

---

### Task 14: Final exact-head verification, review, PR, and merge gate

**Files:**
- No implementation files unless verification exposes a defect.
- Review spec: `docs/superpowers/specs/2026-09-04-v2-cinematic-fidelity-design.md`
- Review plan: `docs/superpowers/plans/2026-09-04-v2-cinematic-fidelity.md`

**Interfaces:**
- Final carrier: `feature/v2-cinematic-fidelity`.

- [ ] **Step 1: Run full fresh verification on exact branch head**

```bash
npm run test:core
npm run check
npm run test:e2e
git diff --check main...HEAD
```

Expected: zero failures/errors.

- [ ] **Step 2: Verify V2 success criteria against implementation**

Check all ten items from spec section 16 explicitly: chapter camera choreography, richer transitions, eight scene-family visual upgrades, bounded interactions, reduced-motion/mobile coherence, adaptive quality, deterministic core coverage, Playwright coverage, multi-host compatibility, clean-room compliance.

- [ ] **Step 3: Human visual review**

Review the eight Playwright checkpoint screenshots. Treat visible clipping, unreadable copy, scene discontinuity, excessive bloom, severe aliasing, or mobile obstruction as blockers and fix them on the branch before PR approval.

- [ ] **Step 4: Open PR to `main` and inspect exact-head CI**

PR title: `V2 cinematic fidelity and visual upgrade`.

PR body must summarize A fidelity + B visual upgrade + C production quality, list the exact verification commands/results, and state that no proprietary reference source/assets were copied.

- [ ] **Step 5: Merge only after exact PR head is green and visual review is approved**

Use squash merge. Do not force/bypass. After merge, verify the GitHub Pages deployment for the resulting `main` SHA reaches success and its artifact still passes the base-path guard.
