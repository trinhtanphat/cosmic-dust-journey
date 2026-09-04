import { expect, test } from '@playwright/test';

const desktopOnly = (projectName: string) => projectName === 'chromium-desktop';

async function activeChapter(page: Parameters<typeof test>[0]['page'], chapterId: string) {
  await expect(page.locator('.experience-shell')).toHaveAttribute('data-active-chapter', chapterId);
}

test('canonical deep-links hydrate the authored chapter', async ({ page }, testInfo) => {
  test.skip(!desktopOnly(testInfo.project.name));
  await page.goto('/#chapter-red-giant');
  await activeChapter(page, 'red-giant');
  await expect(page).toHaveURL(/#chapter-red-giant$/);
});

test('progress rail navigation uses the canonical chapter hash', async ({ page }, testInfo) => {
  test.skip(!desktopOnly(testInfo.project.name));
  await page.goto('/');
  await page.getByRole('button', { name: 'Go to A cloud starts to remember its center.' }).click();
  await activeChapter(page, 'cold-cloud');
  await expect(page).toHaveURL(/#chapter-cold-cloud$/);
});

test('Previous and Next navigate through the same chapter controller', async ({ page }, testInfo) => {
  test.skip(!desktopOnly(testInfo.project.name));
  await page.goto('/');
  await page.getByRole('button', { name: 'Next chapter' }).click();
  await activeChapter(page, 'cold-cloud');
  await expect(page).toHaveURL(/#chapter-cold-cloud$/);

  await page.getByRole('button', { name: 'Previous chapter' }).click();
  await activeChapter(page, 'overture');
  await expect(page).toHaveURL(/#chapter-overture$/);
});

test('Play, Pause, and Resume drive one live scroll journey', async ({ page }, testInfo) => {
  test.skip(!desktopOnly(testInfo.project.name));
  await page.goto('/');
  const startY = await page.evaluate(() => window.scrollY);

  await page.getByRole('button', { name: 'Play journey' }).click();
  await expect(page.getByText('Autoplay playing')).toBeVisible();
  await page.waitForTimeout(1200);
  const playingY = await page.evaluate(() => window.scrollY);
  expect(playingY).toBeGreaterThan(startY);

  await page.getByRole('button', { name: 'Pause autoplay' }).click();
  await expect(page.getByText('Autoplay paused')).toBeVisible();
  const pausedY = await page.evaluate(() => window.scrollY);
  await page.waitForTimeout(600);
  const stableY = await page.evaluate(() => window.scrollY);
  expect(Math.abs(stableY - pausedY)).toBeLessThanOrEqual(2);

  await page.getByRole('button', { name: 'Resume autoplay' }).click();
  await expect(page.getByText('Autoplay playing')).toBeVisible();
  await page.waitForTimeout(1000);
  const resumedY = await page.evaluate(() => window.scrollY);
  expect(resumedY).toBeGreaterThan(stableY);
});

test('wheel and navigation-key intent immediately take control from autoplay', async ({ page }, testInfo) => {
  test.skip(!desktopOnly(testInfo.project.name));
  await page.goto('/');

  await page.getByRole('button', { name: 'Play journey' }).click();
  await expect(page.getByText('Autoplay playing')).toBeVisible();
  await page.mouse.wheel(0, 120);
  await expect(page.getByText('Manual navigation')).toBeVisible();

  await page.getByRole('button', { name: 'Play journey' }).click();
  await expect(page.getByText('Autoplay playing')).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByText('Manual navigation')).toBeVisible();
});

test('reduced motion uses chapter-step autoplay without continuous scrolling', async ({ page }, testInfo) => {
  test.skip(!desktopOnly(testInfo.project.name));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.experience-shell')).toHaveAttribute('data-reduced-motion', 'true');

  await page.getByRole('button', { name: 'Play journey' }).click();
  await expect(page.getByText('Autoplay playing')).toBeVisible();
  const initialY = await page.evaluate(() => window.scrollY);
  await page.waitForTimeout(1000);
  expect(await page.evaluate(() => window.scrollY)).toBe(initialY);

  await page.waitForTimeout(5200);
  await activeChapter(page, 'cold-cloud');
  await expect(page).toHaveURL(/#chapter-cold-cloud$/);
});

test('V3.1 preserves all ten authored chapter IDs', async ({ page }, testInfo) => {
  test.skip(!desktopOnly(testInfo.project.name));
  await page.goto('/');
  await expect(page.locator('[data-chapter-id]')).toHaveCount(10);
  await expect(page.locator('[data-chapter-id]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-chapter-id')))).resolves.toEqual([
    'overture',
    'cold-cloud',
    'collapse',
    'ignition',
    'main-sequence',
    'red-giant',
    'shedding',
    'white-dwarf',
    'elsewhere',
    'epilogue',
  ]);
});
