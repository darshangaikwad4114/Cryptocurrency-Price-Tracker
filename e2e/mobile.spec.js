import { expect, test } from '@playwright/test';
import { installApiMocks } from './fixtures';

test.beforeEach(async ({ page }) => {
  await installApiMocks(page);
});

test('mobile menu opens, navigates, and closes with Escape', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'Mobile-only navigation check');
  await page.goto('/');

  await page.getByRole('button', { name: 'Open menu' }).click();
  const mobileNav = page.getByRole('navigation', { name: 'Mobile' });
  await expect(mobileNav).toBeVisible();

  await mobileNav.getByRole('link', { name: /Markets/ }).click();
  await expect(page).toHaveURL(/\/markets$/);
  await expect(mobileNav).toHaveCount(0);

  await page.getByRole('button', { name: 'Open menu' }).click();
  await expect(mobileNav).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(mobileNav).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible();
});

test('mobile layout does not overflow horizontally', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'Mobile-only layout check');
  await page.goto('/markets');

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});
