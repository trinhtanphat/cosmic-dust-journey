# Changelog

All notable changes to Cosmic Dust Journey are documented here.

## 2.1.0 — 2026-09-04

### Production observability
- Added a provider-neutral `ObservabilityHub` with bounded sanitized local events and constant-memory diagnostics.
- Kept local-only telemetry as the default and added opt-in Sentry, Plausible, and GA4 adapters.
- Added DNT/Global Privacy Control suppression for analytics providers and independent circuit breakers for provider failures.
- External adapters never receive raw pointer coordinates, narrative text, URL query/hash data, user identifiers, or browser-storage values.

### Performance diagnostics
- Reused the existing React Three Fiber frame callback as the single frame stream for both adaptive quality and diagnostics.
- Added frame-time percentiles, long-task aggregates, adaptive-level timing, WebGL/error/audio counters, chapter coverage, and optional heap-growth reporting.
- Added machine-readable desktop/mobile diagnostics plus a human-readable CI summary with stable hard-fail gates and conservative performance warnings.

### Failure recovery
- Added renderer-only React error isolation so the semantic narrative remains available when the visual subsystem fails.
- Added bounded WebGL context-loss recovery: one restore attempt, then session fallback on a second loss or timeout.
- Hardened WebAudio lifecycle handling, idempotent disposal, and suspension/interruption observation without autoplay.

### QA and deployment
- Added Playwright coverage for privacy defaults, DNT/GPC, desktop/mobile diagnostics, WebGL startup fallback, bounded context recovery, and muted-audio consent.
- Preserved the existing eight V2 visual checkpoints and GitHub Pages artifact guards.
- Added `.env.example` with placeholder-only telemetry configuration. No real provider identifiers or secrets are committed.

> Release metadata is prepared as version `2.1.0`. A Git tag or GitHub Release object must not be assumed unless it is created separately.

## 2.0.0 — 2026-09-04

### Cinematic fidelity
- Replaced the V1 crossfade-only flow with a four-phase cinematic director: `enter -> settle -> interact -> transition`.
- Added chapter-specific camera tracks, FOV intent, bounded pointer influence, and authored transition modes.
- Added deterministic scene-semantic interaction for dust, collapse, fusion, main-sequence, red-giant, nebula, white-dwarf, and black-hole scenes.

### Visual upgrade
- Added multi-depth dust, spiral collapse, finite ignition flash, stellar surface turbulence, shell ejection, compact-remnant glow, and a lensing-like accretion treatment.
- Added adaptive post-processing using Three.js built-in post-processing addons without introducing a new runtime dependency.
- Added scene-aware procedural WebAudio while keeping sound muted until explicit user interaction.
- Hardened narrative contrast for bright stellar backgrounds and added explicit nebula-title readability coverage.

### Runtime quality and accessibility
- Added deterministic runtime quality state with hysteresis so short frame spikes do not cause quality flicker.
- Added mobile and reduced-motion paths that preserve chapter timing while reducing motion and post-processing intensity.
- Preserved keyboard access, skip navigation, WebGL fallback, and non-blocking interaction semantics.

### QA and deployment
- Added PR-only V2 CI for full static/unit checks and Playwright browser QA.
- Added deterministic desktop/mobile visual checkpoints and persistent Playwright artifacts for review.
- Added GitHub Pages artifact verification so deployments cannot accidentally publish Vite source paths such as `/src/main.tsx`.
- Preserved root-base compatibility for Vercel, Cloudflare Pages, and Cloudflare Workers Static Assets while GitHub Pages uses `/cosmic-dust-journey/`.

### Clean-room notice
V2 is a clean-room implementation based only on publicly observable behavior. No proprietary reference JavaScript, GLSL, artwork, narrative copy, or audio was recovered, de-minified, copied, or redistributed.
