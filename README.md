# Cosmic Dust Journey

A production-oriented, clean-room interactive journey through the life of a star. V3.1 preserves the ten authored semantic chapters and V3.0 visual continuity while adding interruptible cinematic autoplay, shared guided chapter navigation, and canonical deep-links.

- **A — Fidelity:** recognizable stellar-lifecycle pacing, chapter structure, scroll rhythm, and interaction semantics inspired only by publicly observable behavior.
- **B — Visual continuity:** one deterministic matter/energy model, one continuous camera spline, continuity-aware scene overlap, shared stellar-surface evolution, bounded black-hole lensing, and adaptive post-processing.
- **C — Production quality:** deterministic state, accessibility fallbacks, adaptive runtime quality, privacy-first observability, browser QA, guided/deep-link navigation, and static deploy support for GitHub Pages, Vercel, Cloudflare Pages, and Cloudflare Workers Static Assets.

> This repository is a clean-room implementation. It does **not** recover, de-minify, copy, or redistribute proprietary JavaScript, GLSL, artwork, narrative copy, or audio from the reference experience.

## Stack

- React 19 + TypeScript 5.9
- Vite 8
- Three.js 0.185 + React Three Fiber 9
- GSAP ScrollTrigger
- Zustand
- Node core tests + Vitest
- Playwright Chromium desktop/mobile QA
- Three.js built-in post-processing addons
- Procedural WebAudio

## V2 cinematic architecture

Ten semantic DOM chapters share one persistent full-viewport WebGL canvas. Scroll resolves into chapter-local progress and a data-driven cinematic director resolves:

```text
enter -> settle -> interact -> transition
```

Each chapter owns camera keyframes, FOV intent, transition mode, bounded interaction, post-processing intent, and particle budget. Reduced-motion preserves the narrative timing while selecting a lower-motion route.

## V3.0 visual continuity core

V3.0 keeps the same ten chapter IDs, order, scenes, scientific copy, accessibility fallback, and V2.1 recovery/observability contracts. It adds a pure continuity layer between chapter progress and rendering:

```text
chapter progress
  -> resolveVisualContinuity
  -> resolveCinematicState + continuity energy
  -> sampleGlobalCameraSpline
  -> SceneDirector
  -> current + next scene only
```

The continuity model carries bounded semantic matter channels (`dust`, `gas`, `core`, `envelope`, `ejecta`, `remnant`, `accretion`) instead of tracking literal particle identity. Dust/collapse/nebula layers reuse deterministic seeded structure and progress-authored motion; main-sequence and red-giant share a stellar-surface vocabulary; the black-hole chapter consumes only `accretion` and deliberately rejects white-dwarf `remnant` as physical transfer.

V3.0 does **not** add a second renderer, frame loop, chapter timeline, or state store. Adaptive quality remains a hard budget: secondary volumetric layers and lensing detail can degrade, post-processing cannot be re-enabled after the runtime budget disables it, and primary narrative geometry/continuity remains intact. Reduced motion preserves the same material relationships while reducing camera tangent amplitude, turbulence, deformation, and black-hole warp.

Boundary QA now covers all nine adjacent chapter transitions on desktop, representative material/branch boundaries on Pixel 7 emulation, and a reduced-motion boundary checkpoint. The V2.1 WebGL recovery contract remains one bounded restore attempt followed by session fallback on a second loss or timeout.

## V3.1 guided journey experience

V3.1 adds one DOM-facing journey-navigation controller on top of the existing scroll/store/continuity pipeline. It does not create a second timeline or replace V3.0 rendering.

Canonical shareable chapter links use the existing semantic DOM IDs:

```text
#chapter-overture
#chapter-cold-cloud
...
#chapter-epilogue
```

Known hashes hydrate through the shared controller; malformed or unknown hashes fail closed. ProgressRail, Previous/Next, browser hash changes, and autoplay all resolve through the same authoritative chapter timeline.

Autoplay is **opt-in**. Play starts cinematic scrolling from the current journey position, Pause freezes programmatic advancement, and Resume continues from live progress. A completed journey can restart from the beginning. Explicit user intent always wins: wheel, touch, and supported navigation keys immediately return control to manual scrolling. Programmatic `scroll` events are not treated as takeover signals.

Reduced-motion never uses continuous rAF auto-scroll. If the user explicitly starts autoplay with reduced motion enabled, the controller advances one chapter at a time with bounded instant jumps while preserving Pause/Resume and takeover semantics.

The journey controls are compact semantic buttons with visible focus treatment and a polite live status. They deliberately avoid reusing the generic `role="status"` already owned by the WebGL fallback, so existing recovery/accessibility locators remain unique.

## V2.1 production hardening

V2.1 adds a provider-neutral observability and recovery layer without changing the authored cinematic semantics.

### Privacy-first default

Local diagnostics are always available and external telemetry is **off by default**. The runtime only keeps bounded, sanitized event/metric context such as chapter id, scene id, cinematic phase, quality tier, adaptive level, coarse viewport class, error class, and aggregate performance values.

The observability sanitizer explicitly drops pointer coordinates, narrative text, raw URL/query/hash data, form values, email/account/device identifiers, user IDs, and browser-storage contents.

### Optional external providers

External telemetry is opt-in per deployment:

```text
VITE_TELEMETRY_MODE=local
VITE_SENTRY_ENABLED=false
VITE_SENTRY_DSN=
VITE_PLAUSIBLE_ENABLED=false
VITE_PLAUSIBLE_DOMAIN=
VITE_GA4_ENABLED=false
VITE_GA4_MEASUREMENT_ID=
```

Copy `.env.example` and provide deployment values only where needed. Do not commit real DSNs, measurement IDs, API keys, or secrets.

- Sentry is dynamically imported only when explicitly enabled.
- Plausible and GA4 only receive allow-listed aggregate analytics events.
- `Do Not Track` and Global Privacy Control disable analytics adapters even if deployment flags request them.
- Provider failures are isolated and circuit-broken; they never block scrolling, rendering, audio, or narrative state.

### Performance diagnostics

The existing React Three Fiber frame callback remains the **single authoritative frame stream**. The same sample feeds adaptive-quality hysteresis and local diagnostics; observability does not create a second FPS loop.

Diagnostics aggregate frame percentiles, long tasks, adaptive-level timing, WebGL loss/restore/fallback counts, runtime errors, audio lifecycle counts, visited chapters, and supported heap-growth data.

CI writes diagnostics under `v2.1-diagnostics/` for desktop/mobile plus `performance-summary.md`. Stable runtime failures fail CI; ordinary runner-sensitive frame targets remain warnings.

### Renderer and WebGL recovery

WebGL startup failure keeps the complete semantic story and renders narrative fallback mode. Runtime context loss gets one bounded restore attempt; a second loss or restore timeout enters fallback for the session. A renderer React error boundary replaces only the visual subtree, not the narrative DOM.

### Audio lifecycle

Sound remains muted until an explicit user click. Background suspension/interruption is observed but does not trigger unsolicited autoplay. Driver/controller stop and dispose paths are idempotent and release oscillator graphs safely.

## Tests and QA

Dependency-light deterministic regressions:

```bash
npm run test:core
```

Full static/unit/build gate:

```bash
npm install
npm run check
```

Browser QA:

```bash
npx playwright install chromium
npm run test:e2e
npm run diagnostics:summary
```

Playwright covers desktop, Pixel 7 emulation, reduced motion, V2 visual checkpoints, all V3 adjacent continuity boundaries on desktop, representative V3 mobile boundaries, V2.1 diagnostics, local-only telemetry, DNT/GPC suppression, WebGL startup fallback, bounded context recovery, audio-muted-before-click behavior, and V3.1 deep-link/guided/autoplay acceptance including Pause/Resume and manual takeover.

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

`.github/workflows/deploy-pages.yml` builds with:

```text
VITE_BASE_PATH=/cosmic-dust-journey/
```

Before upload the workflow runs core regressions and verifies that `dist/index.html` references `/cosmic-dust-journey/assets/` and does **not** contain `/src/main.tsx`.

Live project path:

```text
https://trinhtanphat.github.io/cosmic-dust-journey/
```

### Vercel

`vercel.json` builds with `npm run build` and serves `dist/` at root base `/`.

### Cloudflare Pages / Workers Static Assets

Cloudflare Pages uses build command `npm run build` and output `dist`. `wrangler.toml` serves `./dist` with SPA fallback for Workers Static Assets.

## Clean-room / provenance

Reference crawling is offline/build-time tooling only. Production never requires the reference site. JavaScript bundles remain `inspect-only`; unknown-rights assets are not treated as reusable production source.

```bash
npm run crawl:reference
npm run inspect:assets
npm run provenance
```

## Branch / release policy

Feature work stays on a feature branch until exact-head static/unit/build and browser evidence are green. Merge to `main` is squash-only with the expected head SHA; no force/bypass merge is part of the workflow. Git tags and GitHub Release objects are only claimed when they are actually created.