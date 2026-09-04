import { expect, test, type Page, type TestInfo } from '@playwright/test';

function captureBreakingErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  return errors;
}

async function goToChapter(page: Page, id: string, fraction = 0.55) {
  const chapter = page.locator(`[data-chapter-id="${id}"]`);
  await expect(chapter).toBeVisible();
  await chapter.evaluate((element, f) => {
    const rect = element.getBoundingClientRect();
    const top = window.scrollY + rect.top;
    const target = top + element.clientHeight * Number(f) - window.innerHeight * 0.5;
    window.scrollTo(0, Math.max(0, target));
  }, fraction);
  await page.waitForTimeout(120);
}

async function attachCheckpoint(page: Page, testInfo: TestInfo, name: string) {
  const body = await page.screenshot({ animations: 'disabled' });
  await testInfo.attach(name, { body, contentType: 'image/png' });
}

test('desktop V2 journey reaches every phase and captures visual checkpoints', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'desktop-only visual checkpoint path');
  const errors = captureBreakingErrors(page);
  await page.goto('/');
  await expect(page.getByRole('main')).toBeVisible();
  await expect(page.locator('[data-chapter-id]')).toHaveCount(10);

  const checkpoints = [
    ['overture', 0.56, 'dust-settle.png'],
    ['collapse', 0.74, 'collapse-late.png'],
    ['ignition', 0.68, 'fusion-after.png'],
    ['main-sequence', 0.42, 'main-sequence-settle.png'],
    ['red-giant', 0.76, 'red-giant-expanded.png'],
    ['shedding', 0.68, 'nebula-wide.png'],
    ['white-dwarf', 0.58, 'white-dwarf.png'],
    ['elsewhere', 0.62, 'black-hole.png'],
  ] as const;

  for (const [id, fraction, name] of checkpoints) {
    await goToChapter(page, id, fraction);
    await attachCheckpoint(page, testInfo, name);
  }

  await expect(page.locator('.experience-shell')).toHaveAttribute('data-active-chapter', 'elsewhere');
  expect(errors).toEqual([]);
});

test('mobile V2 journey keeps controls reachable through final chapter', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-mobile', 'mobile-only path');
  const errors = captureBreakingErrors(page);
  await page.goto('/');
  await expect(page.locator('[data-chapter-id]')).toHaveCount(10);
  await expect(page.getByRole('button', { name: /turn sound on/i })).toBeVisible();
  await goToChapter(page, 'epilogue', 0.7);
  await expect(page.locator('.experience-shell')).toHaveAttribute('data-active-chapter', 'epilogue');
  await expect(page.getByRole('button', { name: /sound/i })).toBeVisible();
  expect(errors).toEqual([]);
});

test('reduced-motion path preserves full narrative and exposes lower-motion state', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'run reduced-motion once on desktop');
  const errors = captureBreakingErrors(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.experience-shell')).toHaveAttribute('data-reduced-motion', 'true');
  await expect(page.locator('.experience-shell')).toHaveAttribute('data-cinematic-phase', /enter|settle|interact|transition/);
  await goToChapter(page, 'epilogue', 0.7);
  await expect(page.locator('[data-chapter-id]')).toHaveCount(10);
  expect(errors).toEqual([]);
});
