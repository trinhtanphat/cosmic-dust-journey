import { expect, type Page } from '@playwright/test';
import { createHash } from 'node:crypto';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  readPngDimensions,
  type CaptureManifest,
  type CaptureManifestEntry,
} from '../../../scripts/write-capture-summary.ts';
import {
  captureCasesForProfile,
  captureRelativePath,
  type CaptureCase,
  type CaptureProfileId,
} from './v3.2-capture-plan.ts';

const captureRoot = resolve('v3.2-captures');

async function stabilizeForCapture(page: Page) {
  await page.addStyleTag({
    content: `
      html { scroll-behavior: auto !important; }
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
        caret-color: transparent !important;
      }
    `,
  });

  await page.evaluate(async () => {
    if (document.fonts) await document.fonts.ready;
  });
}

async function settleAfterNavigation(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolveFrame) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolveFrame()));
      }),
  );
  await page.waitForTimeout(80);
}

async function navigateToCapture(page: Page, capture: CaptureCase) {
  const chapter = page.locator(`[data-chapter-id="${capture.chapterId}"]`);
  await expect(chapter).toBeVisible();
  await chapter.evaluate((element, fraction) => {
    const rect = element.getBoundingClientRect();
    const top = window.scrollY + rect.top;
    const target = top + element.clientHeight * Number(fraction) - window.innerHeight * 0.5;
    window.scrollTo(0, Math.max(0, target));
  }, capture.fraction);
  await expect(page.locator('.experience-shell')).toHaveAttribute('data-active-chapter', capture.chapterId);
  await settleAfterNavigation(page);
}

async function captureCase(page: Page, capture: CaptureCase): Promise<CaptureManifestEntry> {
  await navigateToCapture(page, capture);

  const buffer = await page.screenshot({ animations: 'disabled' });
  const dimensions = readPngDimensions(buffer);
  const viewport = page.viewportSize();
  if (!dimensions) throw new Error(`Capture ${capture.id} did not produce a valid PNG.`);
  if (!viewport) throw new Error(`Capture ${capture.id} does not have a fixed viewport.`);

  const relativePath = captureRelativePath(capture);
  const absolutePath = resolve(captureRoot, relativePath);
  mkdirSync(dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, buffer);

  return {
    id: capture.id,
    profile: capture.profile,
    kind: capture.kind,
    chapterId: capture.chapterId,
    ...(capture.nextChapterId ? { nextChapterId: capture.nextChapterId } : {}),
    reducedMotion: capture.reducedMotion,
    file: relativePath,
    width: dimensions.width,
    height: dimensions.height,
    viewportWidth: viewport.width,
    viewportHeight: viewport.height,
    bytes: buffer.byteLength,
    sha256: createHash('sha256').update(buffer).digest('hex'),
  };
}

export async function captureProfileEvidence(page: Page, profile: CaptureProfileId): Promise<CaptureManifest> {
  const profileDirectory = resolve(captureRoot, profile);
  rmSync(profileDirectory, { recursive: true, force: true });
  mkdirSync(profileDirectory, { recursive: true });

  await stabilizeForCapture(page);

  const captures: CaptureManifestEntry[] = [];
  for (const capture of captureCasesForProfile(profile)) captures.push(await captureCase(page, capture));

  const manifest: CaptureManifest = { version: 1, profile, captures };
  writeFileSync(resolve(profileDirectory, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}
