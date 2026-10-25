import { expect, test } from '@playwright/test';
import { installApiMocks } from './fixtures';

test.beforeEach(async ({ page }) => {
  await installApiMocks(page);
  await page.goto('/markets');
});

test('searches and filters the market table with URL state', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Explore the top 100 assets' })).toBeVisible();
  await expect(page.getByText('Showing 6 of 6 assets')).toBeVisible();

  const rows = page.locator('.coin-table tbody tr');
  await expect(rows).toHaveCount(6);

  await page.getByRole('searchbox', { name: 'Search assets' }).fill('sol');
  await expect(page).toHaveURL(/[?&]q=sol/);
  await expect(page.getByText('Showing 1 of 6 assets')).toBeVisible();
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText('Solana');

  await page.getByRole('button', { name: 'Clear search' }).click();
  await expect(page.getByText('Showing 6 of 6 assets')).toBeVisible();

  await page.getByRole('button', { name: /^Filters/ }).click();
  const largeCap = page.getByRole('checkbox', { name: /Large cap/ });
  await largeCap.click();
  await expect(largeCap).toBeChecked();
  await expect(page.getByText('Showing 4 of 6 assets')).toBeVisible();
  await expect(page).toHaveURL(/[?&]cap=large/);
  await expect(rows).toHaveCount(4);

  await page.getByRole('button', { name: 'Done' }).click();
  await page.getByRole('button', { name: /^Filters/ }).click();
  const smallCap = page.getByRole('checkbox', { name: /Small cap/ });
  await smallCap.click();
  await expect(smallCap).toBeChecked();
  await expect(page.getByText('Showing 5 of 6 assets')).toBeVisible();
  await expect(page).toHaveURL(/cap=large/);
  await expect(page).toHaveURL(/cap=small/);

  await page.getByRole('button', { name: 'Clear all', exact: true }).first().click();
  await expect(page.getByText('Showing 6 of 6 assets')).toBeVisible();
  await expect(page).not.toHaveURL(/cap=/);
});

test('sorts by URL state and persists the grid view', async ({ page }) => {
  await page.goto('/markets?sort=price_asc');

  const rows = page.locator('.coin-table tbody tr');
  await expect(rows.first()).toContainText('Micro Coin');
  await expect(page.getByLabel('Sort assets')).toHaveValue('price_asc');

  await page.getByRole('button', { name: 'Grid view' }).click();
  await expect(page.getByRole('button', { name: 'Grid view' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.locator('.coin-grid li')).toHaveCount(6);

  await page.reload();
  await expect(page.getByRole('button', { name: 'Grid view' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.locator('.coin-grid li')).toHaveCount(6);
  await expect(page.getByLabel('Sort assets')).toHaveValue('price_asc');
});

test('shows an empty state for filters with no matches', async ({ page }) => {
  await page.goto('/markets?q=does-not-exist');

  await expect(page.getByText('No assets match these filters')).toBeVisible();
  await page.getByRole('button', { name: 'Clear all filters' }).click();
  await expect(page.getByText('Showing 6 of 6 assets')).toBeVisible();
});
