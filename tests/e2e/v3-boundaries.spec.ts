import { expect, test, type Page, type TestInfo } from '@playwright/test';

function captureBreakingErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  return errors;
}

async function goToBoundary(page: Page, outgoingId: string, fraction = 0.92) {
  const chapter = page.locator(`[data-chapter-id="${outgoingId}"]`);
  await expect(chapter).toBeVisible();
  await chapter.evaluate((element, f) => {
    const root = document.documentElement;
    const previous = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    const rect = element.getBoundingClientRect();
    const top = window.scrollY + rect.top;
    const target = top + element.clientHeight * Number(f) - window.innerHeight * 0.5;
    window.scrollTo(0, Math.max(0, target));
    root.style.scrollBehavior = previous;
  }, fraction);
  await expect(page.locator('.experience-shell')).toHaveAttribute('data-active-chapter', outgoingId);
  await expect(page.getByRole('main')).toBeVisible();
  await page.waitForTimeout(100);
}

async function checkpoint(page: Page, testInfo: TestInfo, name: string) {
  const body = await page.screenshot({ animations: 'disabled' });
  await testInfo.attach(name, { body, contentType: 'image/png' });
}

const boundaries = [
  ['overture', 'cold-cloud'],
  ['cold-cloud', 'collapse'],
  ['collapse', 'ignition'],
  ['ignition', 'main-sequence'],
  ['main-sequence', 'red-giant'],
  ['red-giant', 'shedding'],
  ['shedding', 'white-dwarf'],
  ['white-dwarf', 'elsewhere'],
  ['elsewhere', 'epilogue'],
] as const;

test('desktop V3 captures every adjacent continuity boundary without runtime errors', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'desktop continuity checkpoint path');
  const errors = captureBreakingErrors(page);
  await page.goto('/');
  await expect(page.locator('[data-chapter-id]')).toHaveCount(10);

  for (const [from, to] of boundaries) {
    await goToBoundary(page, from);
    await expect(page.locator(`[data-chapter-id="${to}"]`)).toHaveCount(1);
    await checkpoint(page, testInfo, `v3-${from}-to-${to}.png`);
  }

  expect(errors).toEqual([]);
});

test('mobile V3 exercises representative material and branch boundaries', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-mobile', 'mobile continuity checkpoint path');
  const errors = captureBreakingErrors(page);
  await page.goto('/');
  const representatives = [
    ['cold-cloud', 'collapse'],
    ['red-giant', 'shedding'],
    ['white-dwarf', 'elsewhere'],
  ] as const;

  for (const [from, to] of representatives) {
    await goToBoundary(page, from);
    await expect(page.locator(`[data-chapter-id="${to}"]`)).toHaveCount(1);
    await checkpoint(page, testInfo, `v3-mobile-${from}-to-${to}.png`);
  }

  expect(errors).toEqual([]);
});

test('reduced-motion V3 preserves a representative boundary and full narrative', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'single reduced-motion boundary checkpoint');
  const errors = captureBreakingErrors(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.experience-shell')).toHaveAttribute('data-reduced-motion', 'true');
  await goToBoundary(page, 'red-giant');
  await expect(page.locator('[data-chapter-id="shedding"]')).toHaveCount(1);
  await expect(page.locator('[data-chapter-id]')).toHaveCount(10);
  await checkpoint(page, testInfo, 'v3-reduced-red-giant-to-shedding.png');
  expect(errors).toEqual([]);
});
