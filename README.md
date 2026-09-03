# Ten Billion Years — Clean-room Interactive

A production-oriented clean-room reimplementation of a cinematic star-lifecycle web experience. The project combines three deliverables in one repository:

- **A — Visual replica:** a React + WebGL scroll journey with procedural stellar scenes and pointer interactions.
- **B — Public-data crawler:** a build-time inspection pipeline for public page copy, metadata, and asset URLs with provenance/status tracking; production never depends on it.
- **C — Production architecture:** typed scene/timeline state, adaptive quality, accessibility fallbacks, tests, and deploy configs for Vercel + Cloudflare.

> This repository does **not** recover, de-minify, or republish proprietary JavaScript from the reference experience. Visuals, shaders, interaction logic, narrative copy, and audio code here are newly authored. Remote assets discovered by the crawler default to `unknown-rights`; JavaScript bundles are catalogued as `inspect-only` and never treated as reusable source.

## Stack

- React 19
- TypeScript
- Vite 8
- Three.js + React Three Fiber
- GSAP + ScrollTrigger
- Zustand
- Vitest + Node core tests
- Playwright browser smoke tests

## Features

### Cinematic experience

- One persistent full-viewport R3F canvas.
- Ten semantic narrative chapters.
- Eight primary procedural scene phases:
  1. dust cloud
  2. gravitational collapse
  3. fusion ignition
  4. main sequence
  5. red giant
  6. planetary nebula / shedding
  7. white dwarf
  8. black-hole alternate ending
- Crossfades between scene phases near chapter boundaries.
- Adaptive particle budgets and DPR caps.
- Pointer interactions mapped to scene semantics:
  - dust click → pressure shockwave
  - collapse pointer → local gravity
  - main sequence pointer → radiation pressure
  - black hole pointer → accretion-disk disturbance
- Procedural shaders for particles, stellar surface/corona, and accretion disk.
- Procedural ambient WebAudio soundscape; initial state is always muted.

### Accessibility / resilience

- Narrative is real DOM content, not rendered only into WebGL.
- Keyboard-accessible sound toggle and journey navigation.
- `prefers-reduced-motion` reduces camera/visual motion.
- WebGL detection with narrative-mode fallback.
- Mobile layout with reduced particle budget.

### Clean-room crawler

The crawler inspects public responses only. It extracts:

- title / description metadata
- headings and paragraphs
- public button/label cue text
- public asset URLs
- script bundle URLs as `inspect-only`

It does not turn minified bundles into project source and does not download unknown-rights assets into the repo automatically.

## Requirements

Vite 8 requires Node.js 20.19+ or 22.12+.

```bash
node --version
npm --version
```

## Local development

```bash
npm install
npm run dev
```

This archive intentionally has no generated `package-lock.json` because the build container could not reach the npm registry. The first successful `npm install` on a normal network will generate it; commit that lockfile before a production release.

Open the local Vite URL shown in the terminal.

## Tests

Core deterministic tests use Node's TypeScript stripping and can run without Vitest:

```bash
npm run test:core
```

Full unit suite after installing dependencies:

```bash
npm run test:run
```

Browser smoke test:

```bash
npx playwright install chromium
npm run test:e2e
```

Full project gate:

```bash
npm run check
```

That runs TypeScript, ESLint, Vitest, and the production Vite build.

## Crawl public reference metadata

Default configured references:

- `https://ten-billion-years.vercel.app/`
- `https://dust.blue/`

Run:

```bash
npm run crawl:reference
```

Or pass explicit public URLs:

```bash
node scripts/crawl-reference.mjs https://example.com/reference-a https://example.com/reference-b
```

Outputs:

```text
public/generated/reference-content.json
public/generated/provenance.json
```

For reproducible crawl timestamps:

```bash
SOURCE_DATE_EPOCH=1788470400 npm run crawl:reference
```

Inspect discovered non-script asset headers without downloading the assets:

```bash
npm run inspect:assets
```

Persist those observations into the provenance file:

```bash
node scripts/inspect-public-assets.mjs --write
```

## Deploy to Vercel

The repository includes `vercel.json`.

From the Vercel dashboard:

1. Import the Git repository.
2. Framework preset: **Vite**.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Deploy.

CLI equivalent after installing the Vercel CLI:

```bash
npm run build
vercel --prod
```

## Deploy to Cloudflare Pages

Build settings:

```text
Build command: npm run build
Build output: dist
```

`public/_redirects` provides SPA fallback and `public/_headers` adds static security/cache headers.

## Deploy to Cloudflare Workers Static Assets

`wrangler.toml` points Workers Assets at `./dist` with SPA fallback.

```bash
npm run build
npx wrangler deploy
```

No server-side application code is required.

## Repository map

```text
src/
  app/            React shell and quality selection
  audio/          authored WebAudio ambient controller
  components/     narrative UI, progress rail, sound/fallback
  content/        typed local narrative model
  experience/     normalized timeline, Zustand state, canvas/input
  scenes/         procedural stellar phases
  shaders/        authored GLSL
  styles/         cinematic responsive CSS
scripts/
  crawl-reference.mjs
  inspect-public-assets.mjs
  build-provenance-manifest.mjs
  lib/
public/generated/ public crawl/provenance snapshots
tests/core/       dependency-light deterministic tests
tests/e2e/        Playwright full-scroll smoke test
docs/superpowers/ design + implementation plan
```

## Clean-room / provenance rules

1. Do not paste reference-site JavaScript bundles into `src/`.
2. Do not de-minify a proprietary bundle and check the result in as source.
3. Public page copy/metadata can be catalogued for analysis; production narrative in `src/content/chapters.ts` is newly authored.
4. A discovered non-code asset stays `unknown-rights` until a human establishes redistribution rights.
5. A discovered JavaScript bundle stays `inspect-only`.
6. Production does not require the crawler or reference site at runtime.

## Git history

The provided full-repository archive contains the `.git` directory. To publish it after creating an empty repository:

```bash
git remote add origin https://github.com/trinhtanphat/cosmic-dust-journey.git
git push -u origin feature/full-experience
git push origin main
```

You can merge the feature branch after reviewing the final diff.

## License

MIT for newly authored source only. Third-party material merely mentioned or catalogued in provenance files is not relicensed by this repository.
