# Ten Billion Years — Clean-room Clone Design

Date: 2026-09-03
Status: Implemented clean-room V1 candidate; dependency-backed build verification pending a network-enabled runner

## 1. Goal

Build a production-grade, clean-room reimplementation of the public interactive experience currently available at `ten-billion-years.vercel.app` / `dust.blue`.

The clone should preserve the feel of the original experience—cinematic deep-time scrolling, WebGL star lifecycle scenes, typography, chapter pacing, pointer interaction, transitions, and audio affordances—while using newly written source code and a transparent public-data/assets ingestion pipeline.

The repository will support three usage modes in one codebase:

- **A — Visual replica:** a high-fidelity React/WebGL experience with the public narrative represented locally.
- **B — Crawl/ingest pipeline:** scripts that inspect and ingest public page copy, metadata, and legally reusable/public assets where available, producing deterministic manifests.
- **C — Production architecture:** modular TypeScript application with reusable scene controllers, shaders, timeline system, tests, performance fallbacks, and deployment targets for Vercel and Cloudflare Pages/Workers static hosting.

## 2. Clean-room boundary

The implementation will not copy, de-minify, or redistribute proprietary JavaScript bundles from the reference site as source code. It may inspect public behavior, public text, public metadata, public network endpoints, and public asset URLs to understand the experience.

Any crawled external asset will record provenance in a manifest. Assets without a clear right to redistribute will not be committed; the app will instead use procedurally generated or newly authored equivalents.

## 3. Reference experience

The public page presents a one-scroll narrative about the life of a star. The visible chapter structure is:

1. Overture
2. T minus one million years / cold hydrogen cloud
3. Collapse
4. T = 0 / fusion ignition
5. Main sequence
6. Red giant
7. Shedding / planetary nebula
8. White dwarf
9. Elsewhere / massive-star black-hole ending
10. Epilogue

The experience exposes interactive cues such as dust shockwaves, cursor-driven gravity, radiation-pressure interaction, deep-time scroll progression, and a sound toggle.

## 4. Technology

### Application

- Vite
- React
- TypeScript
- Three.js
- React Three Fiber
- GSAP + ScrollTrigger for deterministic cinematic progression
- Zustand for small global experience state

### Rendering

- Procedural particle clouds using BufferGeometry / instancing
- Custom GLSL shaders for dust, stellar corona, nebula, accretion disk, glow, and distortion
- Postprocessing kept minimal and adaptive
- DPR and quality tier determined at runtime

### Tooling

- Vitest for unit tests
- Playwright for browser/scroll smoke tests
- ESLint + TypeScript strict mode
- Prettier

## 5. Repository structure

```text
ten-billion-years-cleanroom/
├─ src/
│  ├─ app/
│  │  ├─ App.tsx
│  │  ├─ ExperienceShell.tsx
│  │  └─ quality.ts
│  ├─ experience/
│  │  ├─ ExperienceCanvas.tsx
│  │  ├─ timeline.ts
│  │  ├─ store.ts
│  │  └─ chapterRegistry.ts
│  ├─ scenes/
│  │  ├─ DustCloudScene.tsx
│  │  ├─ CollapseScene.tsx
│  │  ├─ FusionScene.tsx
│  │  ├─ MainSequenceScene.tsx
│  │  ├─ RedGiantScene.tsx
│  │  ├─ NebulaScene.tsx
│  │  ├─ WhiteDwarfScene.tsx
│  │  └─ BlackHoleScene.tsx
│  ├─ shaders/
│  ├─ components/
│  ├─ content/
│  │  ├─ chapters.ts
│  │  └─ provenance.ts
│  ├─ audio/
│  └─ styles/
├─ scripts/
│  ├─ crawl-reference.mjs
│  ├─ inspect-public-assets.mjs
│  ├─ build-provenance-manifest.mjs
│  └─ lib/
├─ public/
│  ├─ generated/
│  └─ assets/
├─ tests/
├─ docs/
│  └─ superpowers/specs/
├─ wrangler.toml
├─ vercel.json
└─ README.md
```

## 6. Experience architecture

### 6.1 Scroll as normalized deep time

The document contains semantic chapter sections. GSAP ScrollTrigger converts total scroll progress into a normalized value `0..1` stored in the experience state.

Each chapter owns a progress interval. Scenes never read raw browser scroll positions directly; they receive chapter-local progress from the timeline controller. This keeps animation deterministic, testable, and easy to tune.

### 6.2 Persistent WebGL canvas

A single fixed full-viewport R3F canvas remains mounted for the whole journey. Scene components overlap during transitions and use opacity, scale, particle density, camera movement, and shader uniforms to cross-fade instead of mounting a new renderer per chapter.

### 6.3 DOM narrative layer

Accessible semantic HTML stays above the canvas. Text chapters enter and leave based on scroll position but remain available to crawlers and assistive technology. The WebGL layer is enhancement rather than the sole carrier of narrative content.

## 7. Scene design

### Overture / Dust cloud

- 20k–80k adaptive particles
- volumetric-feeling noise field
- pointer click emits a radial shockwave uniform
- subtle parallax and camera drift

### Collapse

- particle radius contracts with chapter progress
- angular velocity rises as radius falls
- pointer becomes a local gravity attractor
- central temperature/glow increases

### Fusion / Star birth

- sharp ignition transition
- core bloom + animated corona shader
- shockwave ring and temporary exposure lift

### Main sequence

- stable star
- faint orbit lines and procedural planets
- pointer applies outward radiation pressure to nearby particles

### Red giant

- star radius expands dramatically
- warmer surface turbulence
- inner orbits disappear into the envelope

### Shedding / Nebula

- pulsed shell emissions
- layered transparent particle ribbons
- slow radial expansion and color-temperature shift

### White dwarf

- contraction to a compact bright remnant
- reduced scene motion
- surrounding nebula continues drifting outward

### Black hole alternate ending

- dark central sphere / lensing approximation
- accretion disk with shader distortion
- duplicated far-side arcs emulate gravitational lensing
- pointer subtly disturbs disk velocity/noise

## 8. Crawler / public-data pipeline

`npm run crawl:reference` will:

1. Fetch configured reference URLs.
2. Parse title, metadata, narrative headings, paragraphs, UI cue text, and public asset URLs.
3. Normalize discovered content to JSON.
4. Compute SHA-256 hashes for downloaded reusable assets.
5. Record source URL, retrieval timestamp, MIME type, size, hash, license/status, and local target.
6. Refuse to auto-commit assets whose redistribution status is unknown.

The build does **not** depend on the crawler or reference site at runtime. A checked-in local content model drives production.

## 9. Data model

Each chapter will use a typed structure containing:

- `id`
- `eyebrow`
- `title`
- `body`
- `interactionCue`
- `clockLabel`
- `scene`
- `scrollLength`
- `sourceProvenance[]`

This separates public narrative data from renderer implementation.

## 10. Audio

Audio is optional and opt-in. Browsers begin muted. The sound button enables an authored ambient soundscape generated from redistributable/new audio assets. No copyrighted reference-site audio will be copied unless redistribution rights are clearly established.

## 11. Responsive and accessibility

- Desktop: full particle count and advanced shaders.
- Mid-tier devices: reduced particle count and postprocessing.
- Mobile/low-power: simplified particles and capped DPR.
- `prefers-reduced-motion`: substantially reduce camera movement and particle dynamics.
- WebGL unavailable: narrative remains readable with a CSS atmospheric background and a clear compatibility notice.
- Keyboard-visible sound toggle and chapter navigation landmarks.

## 12. Performance budget

Target on a normal modern desktop:

- stable 60 FPS at 1080p where practical
- initial JS compressed target under ~400 KB excluding Three.js ecosystem chunks
- lazy/deferred audio
- no large image textures required for core visuals
- deterministic disposal of geometries/materials

## 13. Deploy targets

### Vercel

Pure static Vite output from `dist/` with SPA fallback headers only if needed.

### Cloudflare Pages

Direct static publish of `dist/`.

### Cloudflare Workers static assets

A minimal `wrangler.toml` configuration can publish the same `dist/` artifact through Workers Assets when desired. No server-side runtime is required by the experience.

## 14. Testing

### Unit

- timeline mapping and chapter-local progress
- content schema
- quality tier calculation
- provenance manifest generation

### Browser

- page loads with WebGL
- all chapters become reachable by scroll
- no console errors during a full automated scroll
- sound toggle state changes
- reduced-motion path renders
- fallback content is present when canvas is unavailable

### Build gates

`npm run check` will run TypeScript, lint, unit tests, and production build.

## 15. Definition of done

The first full release is done when:

1. All narrative chapters are present.
2. All eight primary visual scene phases are implemented.
3. Scroll transitions are smooth and coherent.
4. Pointer interactions exist for dust shockwave, gravity, radiation pressure, and black-hole disk disturbance.
5. Desktop and mobile quality tiers work.
6. The public-data crawler produces deterministic JSON/provenance output.
7. `npm run check` passes from a clean install.
8. `npm run build` produces deployable static output.
9. Vercel and Cloudflare deployment configs are included.
10. README documents local dev, crawl, test, build, and deployment.

## 16. Non-goals for V1

- Recovering or republishing proprietary original source code.
- Pixel-identical reproduction of private/internal implementation details.
- Backend accounts, authentication, analytics dashboard, or CMS.
- Native mobile applications.
