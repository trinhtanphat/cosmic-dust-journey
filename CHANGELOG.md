# Changelog

All notable changes to Cosmic Dust Journey are documented here.

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
