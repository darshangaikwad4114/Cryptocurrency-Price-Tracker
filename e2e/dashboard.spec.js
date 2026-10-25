import { expect, test } from '@playwright/test';
import { installApiMocks } from './fixtures';

test.beforeEach(async ({ page }) => {
  await installApiMocks(page);
});

test('renders the market dashboard with live data', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'The crypto market at a glance' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Market pulse' })).toBeVisible();
  await expect(page.getByText('$2.5T')).toBeVisible();
  await expect(page.getByText('55.50%').first()).toBeVisible();

  const fearGreed = page.locator('.metric-card--fear');
  await expect(fearGreed.getByText('61', { exact: true })).toBeVisible();
  await expect(fearGreed.getByText('Greed', { exact: true })).toBeVisible();

  await expect(page.getByRole('heading', { name: 'Market movers' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Trending' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Latest news' })).toBeVisible();
  await expect(page.getByText('Market headline 1 about digital assets')).toBeVisible();

  const topAssets = page.locator('section[aria-labelledby="top-assets-heading"]');
  await expect(topAssets.getByRole('link', { name: 'Bitcoin', exact: true })).toBeVisible();
  await expect(topAssets.getByRole('link', { name: 'Ethereum', exact: true })).toBeVisible();
  await expect(topAssets.locator('tbody tr')).toHaveCount(6);
});

test('shows a recoverable error when market data fails', async ({ page }) => {
  await page.unrouteAll();
  await installApiMocks(page, { failMarket: true });

  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'Market data unavailable' }),
  ).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('button', { name: 'Retry' }).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Latest news' })).toBeVisible();
});
