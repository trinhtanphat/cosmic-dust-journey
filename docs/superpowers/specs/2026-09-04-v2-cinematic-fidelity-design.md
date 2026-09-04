# Cosmic Dust Journey V2 — Cinematic Fidelity + Visual Upgrade Design

Date: 2026-09-04
Branch: `feature/v2-cinematic-fidelity`
Status: Approved design, awaiting spec review

## 1. Goal

Upgrade the existing V1 experience into a V2 that combines three objectives in one implementation:

- **A — Fidelity:** preserve the reference journey's recognizable narrative rhythm, composition, chapter pacing, and interaction semantics without copying proprietary source code or shaders.
- **B — Visual upgrade:** exceed V1 with richer authored shaders, stronger camera choreography, deeper particle motion, improved lighting/post-processing, and more expressive scene transitions.
- **C — Production quality:** preserve the current multi-host architecture, accessibility fallbacks, deterministic state, performance controls, and deploy gates for GitHub Pages, Vercel, Cloudflare Pages, and Cloudflare Workers Static Assets.

V2 remains a clean-room implementation. It may study publicly observable behavior and public factual content, but it must not recover, de-minify, or transplant proprietary reference implementation code.

## 2. Current V1 Baseline

The existing app already provides:

- a persistent React Three Fiber canvas;
- eight stellar scene families;
- a deterministic scroll timeline and Zustand state;
- pointer-driven interactions;
- chapter-to-chapter scene crossfades;
- authored GLSL shaders;
- responsive and reduced-motion behavior;
- Vercel, Cloudflare, and GitHub Pages deploy configuration;
- regression protection for GitHub Pages base-path correctness.

The primary V1 limitation is choreography depth: scene transitions are mostly crossfades near the end of a chapter, while the camera uses a mostly global drift path. V2 replaces that with chapter-specific motion and transition orchestration.

## 3. V2 Architecture

### 3.1 Cinematic Director

Introduce a data-driven cinematic layer above the current `SceneDirector`.

Each chapter receives a `CinematicChapterProfile` describing:

- camera keyframes;
- FOV and focal-distance intent;
- scene phase timing;
- transition mode;
- interaction envelope;
- post-processing intensity;
- color-temperature bias;
- particle multiplier;
- motion reduction fallback.

The director consumes normalized chapter progress and resolves it into four explicit phases:

`enter -> settle -> interact -> transition`

The existing scene components remain isolated render units. The director owns choreography; scenes own rendering and local animation.

### 3.2 Scene Transition System

V2 transitions are no longer crossfade-only. Supported authored transition modes:

- `crossfade` — retained for low-cost or low-motion fallbacks;
- `morph-density` — particle density shifts between stellar states;
- `radial-collapse` — matter contracts into the next scene;
- `radial-expansion` — matter expands outward into the next scene;
- `shell-ejection` — layered material leaves a stellar core and becomes a nebula;
- `flash-cut` — brief physically motivated ignition flash before fusion/main-sequence scenes;
- `dissolve-to-point` — white-dwarf compaction;
- `accretion-warp` — alternate black-hole route.

Transition selection is chapter data, not hard-coded conditional logic inside scene components.

### 3.3 Camera Choreography

Replace the single global camera drift with chapter-specific camera tracks.

A camera track contains:

- start/end position;
- look target;
- optional intermediate control points;
- FOV range;
- pointer influence bounds;
- easing curve;
- micro-parallax amplitude;
- reduced-motion equivalent.

Camera motion must remain deterministic from scroll progress. Pointer input may add bounded offsets but must never change narrative state.

### 3.4 Post-Processing

Add a small authored post-processing layer for high/medium tiers only:

- bloom/glow for stellar cores and ignition;
- vignette for depth framing;
- subtle chromatic fringe only during high-energy transitions;
- optional tone/exposure modulation by scene.

No effect may be required for content comprehension. Low tier and reduced-motion modes must remain visually coherent with post-processing disabled.

## 4. Scene Upgrades

### 4.1 Dust Cloud

- multi-layer particle field with depth-separated parallax;
- density turbulence and low-frequency drift;
- click-triggered shockwave propagation;
- soft volumetric-looking core produced procedurally, not by copied assets;
- camera enters slowly from a wider framing.

### 4.2 Gravitational Collapse

- spiral gravity field;
- progressive radial contraction;
- rising center luminosity;
- pointer influence acts as local gravity perturbation;
- camera dolly-in accelerates near late collapse.

### 4.3 Fusion Ignition

- compressed core state;
- brief ignition flash;
- corona expansion and outward particle burst;
- FOV modulation to emphasize ignition without disorienting the viewer.

### 4.4 Main Sequence

- animated stellar surface granulation;
- procedural corona;
- orbit dust/rings retained as secondary depth cues;
- pointer interaction behaves like bounded radiation pressure;
- longest visual settle phase to convey stability.

### 4.5 Red Giant

- visible radius expansion across chapter progress;
- turbulent convection noise;
- temperature/color shift;
- slower camera motion and larger perceived scale;
- late-stage outer-shell instability leading into nebula ejection.

### 4.6 Nebula

- multi-shell ejection from the previous giant state;
- translucent procedural gas layers;
- outward particle advection;
- residual stellar core remains visible;
- camera pulls back to reveal spatial scale.

### 4.7 White Dwarf

- compact high-energy point/core;
- lower motion amplitude;
- residual nebula fades gradually;
- transition emphasizes compaction and cooling rather than a simple fade.

### 4.8 Black Hole Alternate Ending

- stronger accretion-disk structure;
- authored lensing-like halo approximation using shader distortion rather than physically exact ray tracing;
- pointer disturbance affects disk turbulence only;
- alternate route remains deterministic and explicitly separated from the main stellar path.

## 5. Interaction Model

Pointer and click interactions remain optional embellishments.

Rules:

1. interaction never blocks scroll progression;
2. interaction never changes scientific/narrative outcome unless the route is already explicitly user-selectable;
3. every interaction has a bounded intensity envelope;
4. reduced-motion disables or softens high-energy impulses;
5. mobile touch input receives the same semantics with lower particle cost.

Expected semantic mapping:

- dust: pressure shockwave;
- collapse: local gravity;
- fusion: ignition response accent;
- main sequence: radiation pressure;
- red giant: convection disturbance;
- nebula: gas ripple;
- white dwarf: subtle glow response;
- black hole: accretion-disk disturbance.

## 6. Timeline and Data Flow

Scroll position is normalized into global progress. The existing chapter resolver determines chapter index and local progress. V2 then adds:

1. chapter profile lookup;
2. phase resolution (`enter`, `settle`, `interact`, `transition`);
3. camera-track interpolation;
4. transition-state calculation;
5. scene render parameters;
6. post-processing profile;
7. adaptive-quality scaling.

The data flow must remain one-way and deterministic:

`scroll -> timeline -> chapter profile -> cinematic state -> scene/camera/postFX`

Pointer input enters only as a separate bounded interaction signal.

## 7. Runtime Quality Controller

Extend the existing quality model with runtime observation.

The controller samples frame timing over a bounded rolling window and may degrade rendering cost in this order:

1. post-processing intensity;
2. particle multiplier;
3. DPR cap;
4. secondary visual layers;
5. antialiasing/expensive shader branches where supported.

Recovery upward is conservative to avoid oscillation.

Quality tiers:

- **high:** full authored effects and maximum allowed particle budget;
- **medium:** reduced postFX and particle density;
- **low:** simplified shaders, no optional postFX, reduced particles;
- **reduced-motion:** independent accessibility mode that also reduces camera and transition motion.

The quality controller must not alter chapter timing or narrative content.

## 8. Accessibility and Fallbacks

V2 preserves real DOM narrative content and WebGL-independent readability.

Requirements:

- keyboard-accessible controls;
- semantic chapter structure;
- sound remains opt-in/muted initially;
- `prefers-reduced-motion` selects dedicated lower-motion camera/transition profiles;
- WebGL failure falls back to narrative mode without blocking content;
- mobile layouts keep copy legible and controls reachable;
- no critical information exists only inside Canvas.

## 9. Sound Design

Keep the authored procedural WebAudio approach.

V2 may add scene-specific parameter envelopes for:

- low dust rumble;
- collapse tension;
- ignition accent;
- main-sequence stable harmonic bed;
- red-giant low-frequency expansion;
- nebula airy/noise layer;
- white-dwarf sparse high-frequency texture;
- black-hole low-frequency/accretion texture.

Audio remains optional and must not auto-play before user gesture.

## 10. Clean-Room Constraints

V2 may use:

- publicly observable timing and interaction behavior as inspiration;
- public scientific facts;
- newly authored shaders, geometry, particles, copy, and sound;
- assets with clear redistribution rights.

V2 must not:

- copy proprietary JavaScript bundles;
- de-minify reference bundles and commit derived source;
- copy unknown-rights custom artwork/audio into production;
- claim pixel identity when the implementation is independently authored.

## 11. Files and Module Boundaries

Expected additions/changes are concentrated in these areas:

- `src/experience/` — cinematic profiles, phase resolver, camera tracks, runtime quality sampling;
- `src/scenes/` — upgraded scene rendering and transition hooks;
- `src/shaders/` — authored V2 shaders/noise/distortion helpers;
- `src/app/` — quality-controller integration;
- `src/components/` — optional V2 progress/route affordances if needed;
- `src/styles/` — typography, chapter staging, mobile polish;
- `src/audio/` — per-scene parameter envelopes;
- `tests/core/` — deterministic timeline/choreography/quality tests;
- `tests/e2e/` — desktop/mobile full-scroll and route smoke tests;
- `.github/workflows/` — preserve current Pages deployment and artifact-path guard; add visual/build gates only if they are deterministic and reliable.

Scene components must not become orchestration controllers. Shared choreography belongs in `src/experience/`.

## 12. Error Handling

- missing chapter profile: fall back to neutral camera and `crossfade` transition;
- unsupported post-processing/WebGL feature: disable optional effect and continue;
- frame-time degradation: lower quality tier without changing narrative progress;
- audio initialization failure: keep app functional and keep sound control in a safe disabled state;
- malformed route/scene data: fail test/build rather than silently shipping inconsistent chapter state.

## 13. Testing Strategy

### 13.1 Deterministic Core Tests

Add tests for:

- chapter phase boundaries;
- camera interpolation;
- transition selection and interpolation;
- reduced-motion profile resolution;
- runtime quality downgrade/recovery hysteresis;
- interaction intensity bounds;
- route determinism.

### 13.2 Browser Tests

Playwright coverage:

- full desktop scroll from first to last chapter;
- representative mobile viewport;
- reduced-motion mode;
- alternate black-hole route;
- sound control remains opt-in;
- no console-breaking errors;
- GitHub Pages base path continues to resolve production assets.

### 13.3 Visual Checkpoints

Capture deterministic screenshots at stable chapter progress points for human QA. These screenshots are review evidence, not pixel-perfect golden tests unless a later stable baseline is explicitly approved.

Suggested checkpoints:

- dust settle;
- late collapse;
- fusion ignition aftermath;
- main-sequence settle;
- red-giant expansion;
- nebula wide shot;
- white dwarf;
- black-hole alternate route.

## 14. Deployment and Compatibility

V2 must preserve all current deployment modes:

- GitHub Pages using `VITE_BASE_PATH=/cosmic-dust-journey/`;
- Vercel using root base path `/`;
- Cloudflare Pages using root base path `/`;
- Cloudflare Workers Static Assets using `dist/`.

The existing GitHub Pages artifact regression gate remains mandatory:

- `dist/index.html` must exist;
- it must reference `/cosmic-dust-journey/assets/` for Pages builds;
- it must never reference `/src/main.tsx`.

## 15. Merge and Release Gate

Implementation occurs only on `feature/v2-cinematic-fidelity` or short-lived child branches.

V2 may merge to `main` only when all applicable checks pass on the exact PR head:

- deterministic core tests;
- TypeScript/build checks;
- browser smoke tests that are stable in CI;
- GitHub Pages artifact-path regression gate;
- no unresolved blocking review findings;
- human visual review of representative checkpoints.

No force/bypass merge is part of the V2 process.

## 16. Success Criteria

V2 is complete when:

1. every major stellar phase has distinct authored camera choreography;
2. transitions are materially richer than V1 crossfade-only behavior;
3. the eight scene families receive the visual upgrades defined above;
4. pointer interactions remain bounded, optional, and scene-semantic;
5. reduced-motion/mobile modes remain coherent and usable;
6. runtime quality adaptation can reduce rendering cost without changing narrative state;
7. deterministic core tests cover choreography and quality logic;
8. Playwright covers desktop, mobile, reduced-motion, and alternate route smoke paths;
9. GitHub Pages/Vercel/Cloudflare deployment compatibility is preserved;
10. the implementation remains clean-room and does not include proprietary reference source.

## 17. Non-Goals for V2

To keep V2 focused, this release does not require:

- physically exact general-relativistic black-hole ray tracing;
- a backend service;
- user accounts or persistence;
- CMS integration;
- multiplayer/social features;
- exact pixel-for-pixel reproduction of proprietary reference visuals;
- native mobile applications.

These may be considered only after V2 is complete and stable.
