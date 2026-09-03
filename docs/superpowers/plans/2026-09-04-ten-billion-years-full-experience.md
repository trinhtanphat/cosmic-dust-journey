# Ten Billion Years Full Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-grade clean-room React/WebGL star-lifecycle experience, deterministic public-data crawler/provenance pipeline, and deployable Vercel + Cloudflare static application.

**Architecture:** A single fixed React Three Fiber canvas renders all cinematic phases from a normalized scroll timeline, while semantic DOM chapters provide the narrative and accessibility layer. Reference ingestion is an offline-only Node pipeline that extracts public metadata/copy/asset URLs and writes deterministic manifests; production never depends on the reference site.

**Tech Stack:** Vite, React, TypeScript, Three.js, React Three Fiber, GSAP ScrollTrigger, Zustand, Vitest, Playwright, ESLint, Prettier, Node 20+

**Spec:** `docs/superpowers/specs/2026-09-03-ten-billion-years-cleanroom-design.md`

## Global Constraints

- Do not copy, de-minify, or redistribute proprietary JavaScript bundles from the reference site as source.
- Unknown-rights remote assets may be catalogued but must not be committed automatically.
- Production must run completely from checked-in local content and authored/procedural visuals.
- One persistent full-viewport WebGL canvas; scenes derive local progress from normalized scroll state.
- Accessible DOM narrative remains usable with WebGL disabled.
- `prefers-reduced-motion` materially reduces motion.
- `npm run check` must run TypeScript, lint, unit tests, and production build successfully.
- Static output must deploy to Vercel, Cloudflare Pages, or Cloudflare Workers Static Assets.

---

### Task 1: Bootstrap, typed narrative, and content validation

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `.gitignore`, `.prettierrc`, `eslint.config.js`
- Create: `src/main.tsx`, `src/content/types.ts`, `src/content/chapters.ts`, `src/content/validate.ts`
- Test: `tests/content.test.ts`

**Interfaces:**
- Produces: `Chapter`, `SceneId`, `chapters: readonly Chapter[]`, `validateChapters(chapters): string[]`.

- [ ] Write unit tests asserting unique chapter ids, positive scroll lengths, known scene ids, and required narrative text.
- [ ] Run `npm test -- --run tests/content.test.ts` and verify RED before implementation.
- [ ] Implement strict TypeScript content types, ten narrative chapters, and validation.
- [ ] Run the content tests and TypeScript check to GREEN.
- [ ] Commit as `feat: bootstrap typed narrative`.

### Task 2: Deterministic crawl and provenance pipeline

**Files:**
- Create: `scripts/lib/reference-parser.mjs`, `scripts/lib/provenance.mjs`
- Create: `scripts/crawl-reference.mjs`, `scripts/build-provenance-manifest.mjs`, `scripts/inspect-public-assets.mjs`
- Create: `public/generated/reference-content.json`, `public/generated/provenance.json`
- Test: `tests/reference-parser.test.ts`

**Interfaces:**
- Produces: `extractReference(html, sourceUrl)` returning normalized title/meta/headings/paragraphs/ui cues/asset URLs; `canonicalManifest(entries)` returning stable URL-sorted JSON.

- [ ] Write parser tests from an inline fixture, including absolute URL normalization and filtering of script bundles from redistributable output.
- [ ] Run parser test and verify RED.
- [ ] Implement fetch/parse with built-in Node APIs and deterministic sorting; catalog JS bundles as `status: "inspect-only"` and assets as `status: "unknown-rights"` by default.
- [ ] Add scripts that never fail the production build when the remote reference is unavailable; crawler exits non-zero only when explicitly invoked and fetching fails.
- [ ] Run parser tests and a local-fixture crawl smoke test to GREEN.
- [ ] Commit as `feat: add clean-room reference crawler`.

### Task 3: Timeline, quality tier, and experience state

**Files:**
- Create: `src/experience/timeline.ts`, `src/app/quality.ts`, `src/experience/store.ts`, `src/experience/chapterRegistry.ts`
- Test: `tests/timeline.test.ts`, `tests/quality.test.ts`

**Interfaces:**
- Produces: `buildTimeline(chapters)`, `locateProgress(timeline, globalProgress)`, `detectQuality(input)`, `useExperienceStore`.

- [ ] Write failing tests for progress clamping, exact chapter boundaries, local progress mapping, reduced motion, DPR and device-memory quality decisions.
- [ ] Run timeline/quality tests and verify RED.
- [ ] Implement pure deterministic mapping and quality functions plus Zustand state for progress/pointer/sound/quality.
- [ ] Run tests and `tsc --noEmit` to GREEN.
- [ ] Commit as `feat: add deterministic experience timeline`.

### Task 4: Procedural WebGL scene system

**Files:**
- Create: `src/experience/ExperienceCanvas.tsx`, `src/scenes/SceneDirector.tsx`, `src/scenes/StarField.tsx`, `src/scenes/ParticleCloud.tsx`, `src/scenes/StellarCore.tsx`, `src/scenes/AccretionDisk.tsx`
- Create: `src/scenes/DustCloudScene.tsx`, `CollapseScene.tsx`, `FusionScene.tsx`, `MainSequenceScene.tsx`, `RedGiantScene.tsx`, `NebulaScene.tsx`, `WhiteDwarfScene.tsx`, `BlackHoleScene.tsx`
- Create: `src/shaders/starMaterial.ts`, `src/shaders/particleMaterial.ts`
- Test: `tests/scene-model.test.ts`

**Interfaces:**
- Produces: `sceneModel(sceneId, progress, quality)` pure visual parameters and scene components consuming it.

- [ ] Write failing tests for scene-model radius, intensity, particle-density and visibility transitions across all eight primary visual phases.
- [ ] Run scene-model test and verify RED.
- [ ] Implement deterministic model plus procedural R3F components; no copied textures/models required.
- [ ] Add authored GLSL strings for star/particle distortion and quality-aware particle counts.
- [ ] Run tests, typecheck, and production build to GREEN.
- [ ] Commit as `feat: implement procedural star lifecycle scenes`.

### Task 5: Cinematic DOM shell and scroll synchronization

**Files:**
- Create: `src/app/App.tsx`, `src/app/ExperienceShell.tsx`, `src/components/ChapterSection.tsx`, `src/components/ProgressRail.tsx`, `src/styles/global.css`
- Modify: `src/main.tsx`
- Test: `tests/app.test.tsx`

**Interfaces:**
- Consumes: `chapters`, `buildTimeline`, store progress updater, `ExperienceCanvas`.
- Produces: semantic chapter sections with stable `data-chapter-id` hooks.

- [ ] Write failing DOM tests for all chapter headings, main landmark, sound control, compatibility copy, and progress rail.
- [ ] Run DOM tests and verify RED.
- [ ] Implement fixed canvas + semantic scrolling document; use GSAP ScrollTrigger when available and a scroll-event normalized fallback.
- [ ] Add cinematic typography, gradients, chapter transitions and responsive breakpoints without copying reference CSS.
- [ ] Run DOM tests and build to GREEN.
- [ ] Commit as `feat: add cinematic scroll narrative`.

### Task 6: Pointer interactions, audio affordance, reduced motion, and fallback

**Files:**
- Create: `src/components/SoundToggle.tsx`, `src/audio/ambient.ts`, `src/components/WebGLFallback.tsx`, `src/experience/interactions.ts`
- Modify: `src/experience/ExperienceCanvas.tsx`, scene components, `src/app/ExperienceShell.tsx`
- Test: `tests/interactions.test.ts`, `tests/audio.test.ts`

**Interfaces:**
- Produces: `interactionImpulse(scene, event, state)`, `createAmbientController()`.

- [ ] Write failing tests for dust shockwave, collapse gravity, main-sequence radiation pressure, black-hole disturbance, muted initial audio and toggle semantics.
- [ ] Run tests and verify RED.
- [ ] Implement pointer state/impulses and a newly authored WebAudio ambient oscillator/noise soundscape that begins muted.
- [ ] Implement `prefers-reduced-motion` and WebGL-fallback paths.
- [ ] Run unit tests/typecheck/build to GREEN.
- [ ] Commit as `feat: add interactions audio and accessibility`.

### Task 7: Browser smoke tests and deployment targets

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/experience.spec.ts`
- Create: `vercel.json`, `wrangler.toml`, `public/_headers`
- Modify: `package.json`

**Interfaces:**
- Produces: `npm run test:e2e`, `npm run check`.

- [ ] Add Playwright smoke test that loads, verifies ten chapters, scrolls through the document, toggles sound, and asserts no page errors.
- [ ] Add deployment configs for Vercel static output and Cloudflare Pages/Workers assets.
- [ ] Run `npm run check`; fix only concrete failures until GREEN.
- [ ] Run e2e if Chromium can be installed in the environment; otherwise retain test and document the verified limitation.
- [ ] Commit as `test: add browser and deploy gates`.

### Task 8: Documentation, provenance snapshot, and release verification

**Files:**
- Create: `README.md`, `LICENSE` (MIT for newly authored source only)
- Modify: `public/generated/reference-content.json`, `public/generated/provenance.json`

**Interfaces:**
- Documents exact commands for dev, crawl, tests, build, Vercel, Cloudflare Pages, Workers Assets and clean-room rules.

- [ ] Generate a best-effort reference snapshot using configured public URLs; if network fetch is blocked, write an empty deterministic snapshot plus retrieval-error metadata rather than fabricating source content.
- [ ] Document which narrative copy is newly authored versus externally observed and how unknown-rights assets are handled.
- [ ] Run `npm ci` from lockfile state, `npm run check`, and inspect `dist/` output.
- [ ] Commit as `docs: finalize clean-room release`.
