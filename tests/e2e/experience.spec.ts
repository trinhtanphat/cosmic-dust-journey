import { expect, test } from '@playwright/test';

test('complete stellar journey is reachable without page errors', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('main')).toBeVisible();
  await expect(page.locator('[data-chapter-id]')).toHaveCount(10);
  await expect(page.getByRole('button', { name: /sound/i })).toBeVisible();

  const chapters = page.locator('[data-chapter-id]');
  for (let index = 0; index < 10; index += 1) {
    await chapters.nth(index).scrollIntoViewIfNeeded();
  }
  await page.getByRole('button', { name: /turn sound on/i }).click();
  await expect(page.getByRole('button', { name: /turn sound off/i })).toHaveAttribute('aria-pressed', 'true');
  expect(pageErrors).toEqual([]);
});
