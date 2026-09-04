# Cosmic Dust Journey

A production-oriented, clean-room interactive journey through the life of a star. V2 combines three goals in one codebase:

- **A — Fidelity:** recognizable stellar-lifecycle pacing, chapter structure, scroll rhythm, and interaction semantics inspired only by publicly observable behavior.
- **B — Visual upgrade:** newly authored cinematic camera tracks, richer procedural particles/shaders, scene-specific transitions, adaptive post-processing, and procedural sound.
- **C — Production quality:** deterministic state, accessibility fallbacks, adaptive runtime quality, browser QA, and static deploy support for GitHub Pages, Vercel, Cloudflare Pages, and Cloudflare Workers Static Assets.

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

## V2.1 production hardening

V2.1 adds a provider-neutral observability and recovery layer without changing the authored V2 cinematic semantics.

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

The existing React Three Fiber frame callback remains the **single authoritative frame stream**. The same sample feeds adaptive-quality hysteresis and local diagnostics; V2.1 does not create a second FPS loop.

Diagnostics aggregate:

- frame p50/p95/p99, max, and percentage over 50 ms;
- long-task counts and maximum duration;
- adaptive-quality transitions and time at each level;
- WebGL loss/restore/fallback counts;
- runtime error and unhandled-rejection counts;
- audio lifecycle counts;
- visited chapters;
- heap growth when Chromium exposes a supported API.

CI writes:

```text
v2.1-diagnostics/
  chromium-desktop/performance-diagnostics.json
  chromium-mobile/performance-diagnostics.json
  performance-summary.md
```

Stable runtime failures fail CI. Frame-time and ordinary long-task targets are reported as warnings when runner noise makes them unsuitable as brittle hard gates.

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

Playwright covers desktop, Pixel 7 emulation, reduced motion, the original eight V2 visual checkpoints, V2.1 diagnostics, local-only telemetry, DNT/GPC suppression, WebGL startup fallback, bounded context recovery, and audio-muted-before-click behavior.

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
