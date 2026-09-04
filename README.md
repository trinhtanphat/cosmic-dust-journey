# Cosmic Dust Journey

A production-oriented, clean-room interactive journey through the life of a star. V2 combines three goals in one codebase:

- **A — Fidelity:** recognizable stellar-lifecycle pacing, chapter structure, scroll rhythm, and interaction semantics inspired only by publicly observable behavior.
- **B — Visual upgrade:** newly authored cinematic camera tracks, richer procedural particles/shaders, scene-specific transitions, adaptive post-processing, and procedural sound.
- **C — Production quality:** deterministic state, accessibility fallbacks, runtime quality adaptation, browser QA, and static deploy support for GitHub Pages, Vercel, Cloudflare Pages, and Cloudflare Workers Static Assets.

> This repository is a clean-room implementation. It does **not** recover, de-minify, copy, or redistribute proprietary JavaScript, GLSL, artwork, narrative copy, or audio from the reference experience. Production visuals, shaders, interactions, copy, and sound code are newly authored.

## Stack

- React 19 + TypeScript
- Vite 8
- Three.js 0.185 + React Three Fiber 9
- GSAP ScrollTrigger
- Zustand
- Node core tests + Vitest
- Playwright browser QA
- Three.js built-in post-processing addons
- Procedural WebAudio

## V2 cinematic architecture

The narrative remains ten semantic DOM chapters over one persistent full-viewport WebGL canvas. Scroll resolves into chapter-local progress, then a data-driven cinematic director resolves four phases:

```text
enter -> settle -> interact -> transition
```

Each chapter owns an explicit cinematic profile with camera keyframes, FOV intent, transition mode, interaction bounds, post-processing intent, and particle multiplier. Scene components remain rendering units; orchestration lives in `src/experience/`.

### Chapter-specific camera choreography

V2 replaces the V1 global camera drift with deterministic per-chapter tracks. The tracks cover wide dust entry, gravitational dolly-in, ignition framing, stable main-sequence composition, red-giant pullback, nebula reveal, quiet white-dwarf framing, and the low-angle accretion-disk route. Pointer input only adds bounded offsets and never changes narrative progress.

### Richer transitions

V2 supports authored transition intents rather than crossfade-only changes:

- crossfade
- density morph
- radial collapse / expansion
- shell ejection
- ignition flash
- dissolve-to-point
- accretion warp

Reduced-motion mode automatically falls back to lower-motion crossfade semantics without changing chapter timing.

## Stellar scenes

Eight procedural scene families power the ten chapters:

1. dust cloud
2. gravitational collapse
3. fusion ignition
4. main sequence
5. red giant
6. planetary nebula / shedding
7. white dwarf
8. black-hole alternate ending

V2 adds multi-depth dust, spiral collapse, finite ignition flash, stellar surface turbulence, shell instability/ejection, compact-remnant glow, and a shader-authored lensing-like accretion treatment. The black-hole treatment is an artistic approximation, not physically exact general-relativistic ray tracing.

## Scene-semantic interaction

Pointer/click interaction is optional and bounded:

- dust -> pressure shockwave
- collapse -> local gravity
- fusion -> ignition response
- main sequence -> radiation pressure
- red giant -> convection disturbance
- nebula -> gas ripple
- white dwarf -> glow response
- black hole -> accretion-disk disturbance

Interaction never blocks scrolling and never changes the scientific/narrative outcome.

## Adaptive runtime quality

Initial quality still considers screen size, device memory, CPU concurrency, DPR, and `prefers-reduced-motion`. V2 also observes frame time with hysteresis and can progressively reduce rendering cost without altering the story:

1. post-processing
2. particle budget
3. DPR
4. secondary layers / expensive shader branches

Recovery is deliberately slower than downgrade to avoid oscillation.

## Accessibility and reduced motion

- Narrative content is real semantic DOM and remains readable without WebGL.
- Sound starts muted and only begins after explicit user gesture.
- `prefers-reduced-motion` selects dedicated lower-motion camera/transition behavior.
- Mobile keeps bottom-weighted readable copy and reachable controls.
- Critical information is never Canvas-only.
- WebGL failure falls back to a readable narrative mode.

## Procedural audio

V2 keeps sound fully authored with WebAudio. Scene-aware envelopes adjust oscillator frequencies, filter, gain, and texture while sound is enabled. No remote audio asset is fetched, and updating a scene envelope while muted does not autoplay audio.

## Tests and QA

### Dependency-light core regressions

```bash
npm run test:core
```

These cover timeline/content, cinematic phase profiles, camera interpolation, transitions, interaction bounds, runtime-quality hysteresis, postFX intent, scene models, scene-aware audio, Playwright configuration, and GitHub Pages deployment invariants.

### Full checks

```bash
npm install
npm run check
```

`npm run check` runs TypeScript, ESLint, Vitest, and a production Vite build.

### Browser QA

```bash
npx playwright install chromium
npm run test:e2e
```

The V2 Playwright suite covers desktop, Pixel 7 mobile, reduced motion, the black-hole chapter, console/page errors, and eight human-review checkpoints:

- `dust-settle.png`
- `collapse-late.png`
- `fusion-after.png`
- `main-sequence-settle.png`
- `red-giant-expanded.png`
- `nebula-wide.png`
- `white-dwarf.png`
- `black-hole.png`

Screenshots are CI evidence for human review rather than committed pixel-perfect goldens.

## Development

Node requirement:

```text
>=20.19.0 || >=22.12.0
```

Run locally:

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

Static output is written to `dist/`.

## Deploy

### GitHub Pages

`.github/workflows/deploy-pages.yml` builds the app with:

```text
VITE_BASE_PATH=/cosmic-dust-journey/
```

Before upload, the workflow runs the core regression suite and verifies that `dist/index.html` references `/cosmic-dust-journey/assets/` and does **not** contain `/src/main.tsx`.

Live project path:

```text
https://trinhtanphat.github.io/cosmic-dust-journey/
```

### Vercel

`vercel.json` uses `npm run build` and serves `dist/`. No `VITE_BASE_PATH` override is needed, so the normal Vite base remains `/`.

### Cloudflare Pages

Use:

```text
Build command: npm run build
Output directory: dist
```

The normal root base `/` is retained.

### Cloudflare Workers Static Assets

`wrangler.toml` serves `./dist` with single-page-application fallback behavior. Build first with:

```bash
npm run build
```

## Reference inspection and provenance

Reference crawling is offline/build-time tooling only. Production never depends on a reference site.

```bash
npm run crawl:reference
npm run inspect:assets
npm run provenance
```

Remote JavaScript is `inspect-only`; unknown-rights assets are not treated as reusable production source.

## Branch / release policy

V2 implementation lives on `feature/v2-cinematic-fidelity` until exact-head checks pass. PR CI runs the full static/unit check and Chromium browser suite. Merge to `main` is squash-only after applicable tests and visual-review checkpoints are green; no force/bypass merge is part of the workflow.
