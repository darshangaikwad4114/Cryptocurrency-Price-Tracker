import { expect, test } from '@playwright/test';
import { installApiMocks } from './fixtures';

test.beforeEach(async ({ page }) => {
  await installApiMocks(page);
});

test('renders coin details, chart ranges, and the long description toggle', async ({ page }) => {
  await page.goto('/coins/bitcoin');

  await expect(page.getByRole('heading', { name: /Bitcoin BTC/ })).toBeVisible();
  await expect(page.locator('.coin-hero__price-row strong')).toHaveText('$50,000.00');
  await expect(page.getByRole('heading', { name: 'Market statistics' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'About Bitcoin' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Resources' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Official website/ })).toBeVisible();

  await expect(
    page.getByRole('img', { name: /Bitcoin price chart for the selected range/ }),
  ).toBeVisible({ timeout: 15_000 });

  await page.getByRole('button', { name: '1W', exact: true }).click();
  await expect(page.getByRole('button', { name: '1W', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(
    page.getByRole('img', { name: /Bitcoin price chart for the selected range/ }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Read more' }).click();
  await expect(page.getByRole('button', { name: 'Show less' })).toBeVisible();
});

test('adds a coin to the watchlist and shows it on the watchlist page', async ({ page }) => {
  await page.goto('/coins/bitcoin');

  await page.getByRole('button', { name: 'Add Bitcoin to watchlist' }).click();
  await expect(page.getByRole('button', { name: 'Remove Bitcoin from watchlist' })).toBeVisible();

  const primaryNav = page.getByRole('navigation', { name: 'Primary' });
  if (await primaryNav.isVisible()) {
    await primaryNav.getByRole('link', { name: /Watchlist/ }).click();
  } else {
    await page.getByRole('button', { name: 'Open menu' }).click();
    await page
      .getByRole('navigation', { name: 'Mobile' })
      .getByRole('link', { name: /Watchlist/ })
      .click();
  }

  await expect(page).toHaveURL(/\/watchlist$/);
  await expect(page.getByRole('heading', { name: 'Your saved assets' })).toBeVisible();
  await expect(page.locator('.summary-pills').getByText('1 saved', { exact: true })).toBeVisible();
  await expect(page.locator('.coin-table tbody tr').first()).toContainText('Bitcoin');
});

test('shows a not-found state for an unknown asset', async ({ page }) => {
  await page.goto('/coins/not-a-real-coin');

  await expect(page.getByRole('heading', { name: 'Asset not found' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back to markets' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Retry' })).toHaveCount(0);
});
