# Changelog

All notable changes to Cosmic Dust Journey are documented here.

## 3.1.0 — 2026-09-04

### Guided journey and deep-links
- Added one shared journey-navigation controller for canonical `#chapter-<id>` deep-links, progress-rail navigation, and Previous/Next chapter controls.
- Initial canonical hashes and browser hash changes resolve only known chapter IDs; malformed/unknown hashes fail closed.
- Explicit guided navigation pushes canonical history entries while passive chapter reflection uses `history.replaceState` to avoid history spam and duplicate browser scrolling.

### Interruptible autoplay
- Added opt-in cinematic autoplay with Play, Pause, Resume, and restart-after-completion behavior while continuing to drive the same real document scroll consumed by the existing V3.0 continuity/camera/scene pipeline.
- `wheel`, touch intent, and supported scroll-navigation keys immediately relinquish autoplay to manual control; programmatic scroll events are not treated as takeover.
- Pause cancels the active animation frame and Resume restarts from the live journey progress instead of stale playback state.

### Reduced motion and accessibility
- Reduced-motion autoplay uses bounded chapter-step playback with instant jumps and never starts continuous rAF scrolling.
- Added compact semantic journey controls with visible keyboard focus and a polite live status that does not collide with the existing WebGL fallback `role="status"` contract.
- Preserved the complete ten-chapter semantic narrative, WebGL fallback, V2.1 recovery/observability, muted-audio consent, and authored chapter IDs/order/copy.

### QA
- Added deterministic Vitest coverage for canonical navigation, autoplay state/progression, guided controls, deep-link hydration, pause/resume, takeover behavior, and reduced-motion stepping.
- Added Playwright acceptance coverage for canonical deep-links, rail/Previous/Next navigation, live autoplay, Pause/Resume, wheel/keyboard takeover, reduced motion, and the unchanged ten-chapter ID set.
- Existing V3.0 continuity boundaries and V2.1 WebGL/privacy/diagnostics suites remain part of the exact-head merge gate.

> This changelog entry describes V3.1 source intended to merge through the normal branch/CI process. A Git tag or GitHub Release object must not be assumed unless it is created separately.

## 3.0.0 — 2026-09-04

### Visual continuity core
- Added deterministic semantic matter continuity across the ten existing authored chapters without changing chapter IDs, order, scenes, or scientific copy.
- Added one globally continuous camera spline with bounded pointer influence and reduced-motion tangent scaling.
- Made `SceneDirector` continuity-aware while keeping normal rendering bounded to the current and next scene families.
- Upgraded dust, collapse, nebula, and white-dwarf rendering with deterministic layered volumetric continuity rather than chapter-boundary resets.
- Unified main-sequence and red-giant stellar-surface intent so radius, luminosity, temperature/hue, turbulence, and limb glow evolve from the same authored model.

### Bounded black-hole branch
- Added bounded center-decaying lensing intent and asymmetric accretion-disk brightness/temperature treatment without ray marching or a second renderer.
- Adaptive quality disables secondary distortion before primary silhouette/motion, and reduced motion lowers warp amplitude.
- The alternate black-hole chapter consumes only `accretion`; white-dwarf `remnant` is explicitly not treated as physical transfer into the black-hole system.

### Energy, pacing, and recovery
- Routed continuity bloom/exposure/chromatic energy through the existing runtime post-processing budget; continuity cannot re-enable post-processing after adaptive quality disables it.
- Tuned only chapter `scrollLength` values for cinematic pacing while preserving the authored narrative snapshot.
- Hardened WebGL recovery remount timing so the one-restore-then-fallback contract remains deterministic across a remounted canvas.

### QA
- Added deterministic V3 unit coverage for continuity, global camera boundaries, SceneDirector propagation, volumetric transfer, stellar-surface evolution, black-hole branch isolation, pacing, and post-processing budget behavior.
- Added Playwright screenshots at all nine adjacent desktop boundaries, representative mobile material/branch boundaries, and a reduced-motion boundary checkpoint.
- Existing V2.1 privacy, diagnostics, WebGL fallback/recovery, and narrative-DOM coverage remain part of the full browser gate.

> This changelog entry describes the V3.0 source merged through the normal branch/CI process. A Git tag or GitHub Release object must not be assumed unless it is created separately.

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
- Added chapter-specific camera tracks, FOV intent, transition mode, bounded interaction, post-processing intent, and particle budget.
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