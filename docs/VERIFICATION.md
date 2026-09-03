# Verification Record

Date: 2026-09-04 (Asia/Ho_Chi_Minh)

## Fresh verification on the release-candidate tree

- `node --experimental-strip-types --test tests/core/*.test.ts` — **PASS**, 10 tests / 0 failures.
- Strict standalone TypeScript check for content, timeline, quality, interactions, audio, and scene model — **PASS**.
- TypeScript parser pass over every `src/**/*.ts` and `src/**/*.tsx` using `tsc --noEmit --noCheck` — **PASS**.
- `node --check` on all crawler/provenance `.mjs` files — **PASS**.
- `node scripts/build-provenance-manifest.mjs` — **PASS** (0 entries because reference fetches were unavailable in this container).
- `git diff --check` — **PASS**.

## Full dependency-backed gate

`npm run check` was invoked on the release-candidate tree. It stops at `tsc -b` because this container has no installed npm dependencies/type packages (`@testing-library/jest-dom`, `vitest/globals`, and `@types/node`).

Earlier `npm install` attempts could not complete because the container could not resolve `registry.npmjs.org`. Therefore this environment cannot honestly verify ESLint, Vitest DOM tests, the Vite production bundle, or Playwright.

## Reference crawl status

The crawler was explicitly invoked against `https://ten-billion-years.vercel.app/` and `https://dust.blue/`. This container could not fetch those origins, so `public/generated/reference-content.json` records retrieval errors and **does not fabricate source data**. The code path is still covered by deterministic parser/provenance core tests.

A public web index independently exposes the reference chapter structure and interaction cues, which were used only as behavioral observations; production narrative and implementation remain newly authored.

## Release interpretation

This repository is a **source-complete clean-room V1 release candidate with core checks passing**, not a dependency-backed production-build verification. On a normal CI runner, run:

```bash
npm install
npm run check
npx playwright install chromium
npm run test:e2e
```

Only after those commands pass should the commit be labeled production-build verified.
