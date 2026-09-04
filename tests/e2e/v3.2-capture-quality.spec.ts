import { expect, test, type Page } from '@playwright/test';
import { captureProfileEvidence } from './support/v3.2-capture.ts';
import { captureCasesForProfile, type CaptureProfileId } from './support/v3.2-capture-plan.ts';

function captureBreakingErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  return errors;
}

async function runProfile(page: Page, profile: CaptureProfileId) {
  const errors = captureBreakingErrors(page);
  await page.goto('/');
  await expect(page.locator('[data-chapter-id]')).toHaveCount(10);
  const expected = captureCasesForProfile(profile);
  const manifest = await captureProfileEvidence(page, profile);
  expect(manifest.profile).toBe(profile);
  expect(manifest.captures).toHaveLength(expected.length);
  expect(manifest.captures.map((capture) => capture.id)).toEqual(expected.map((capture) => capture.id));
  expect(errors).toEqual([]);
  return manifest;
}

test('desktop V3.2 writes the complete 19-capture manifest', async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  test.skip(testInfo.project.name !== 'chromium-desktop', 'desktop capture matrix');
  const manifest = await runProfile(page, 'desktop');
  expect(manifest.captures).toHaveLength(19);
});

test('mobile V3.2 writes the representative 3-capture manifest', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-mobile', 'mobile capture matrix');
  const manifest = await runProfile(page, 'mobile');
  expect(manifest.captures).toHaveLength(3);
});

test('reduced-motion V3.2 writes the representative capture manifest', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'reduced-motion capture matrix');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const manifest = await runProfile(page, 'reduced-motion');
  await expect(page.locator('.experience-shell')).toHaveAttribute('data-reduced-motion', 'true');
  expect(manifest.captures).toHaveLength(1);
  expect(manifest.captures[0]?.reducedMotion).toBe(true);
});
