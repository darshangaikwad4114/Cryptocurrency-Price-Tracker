import { expect, test } from '@playwright/test';
import { installApiMocks } from './fixtures';

test.beforeEach(async ({ page }) => {
  await installApiMocks(page);
});

test('loads headlines, paginates, and resets pagination when filtering', async ({ page }) => {
  await page.goto('/news');

  await expect(page.getByRole('heading', { name: 'Headlines that move markets' })).toBeVisible();

  const cards = page.locator('.news-card');
  await expect(cards).toHaveCount(9);

  await page.getByRole('button', { name: 'Load more headlines' }).click();
  await expect(cards).toHaveCount(12);
  await expect(page.getByRole('button', { name: 'Load more headlines' })).toHaveCount(0);

  const filters = page.getByRole('group', { name: 'Filter news by category' });
  await filters.getByRole('button', { name: 'Ethereum' }).click();
  await expect(cards).toHaveCount(4);

  await filters.getByRole('button', { name: 'All' }).click();
  await expect(cards).toHaveCount(9);
});

test('shows a 404 page and returns to the dashboard', async ({ page }) => {
  await page.goto('/a-page-that-does-not-exist');

  await expect(page.getByRole('heading', { name: 'This page does not exist' })).toBeVisible();
  await page.getByRole('link', { name: 'Back to dashboard' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: 'The crypto market at a glance' })).toBeVisible();
});

test('toggles the theme and restores it before paint on reload', async ({ page }) => {
  await page.goto('/');

  const root = page.locator('html');
  await expect(root).toHaveAttribute('data-theme', 'dark');

  await page.getByRole('button', { name: 'Switch to light mode' }).click();
  await expect(root).toHaveAttribute('data-theme', 'light');
  await expect(page.getByRole('button', { name: 'Switch to dark mode' })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('cryptotracker.theme')))
    .toBe('"light"');

  await page.reload();
  await expect(root).toHaveAttribute('data-theme', 'light');
  await expect(page.getByRole('button', { name: 'Switch to dark mode' })).toBeVisible();

  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await expect(root).toHaveAttribute('data-theme', 'dark');
});

test('primary navigation moves between pages', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop-only navigation check');
  await page.goto('/');

  const primary = page.getByRole('navigation', { name: 'Primary' });

  await primary.getByRole('link', { name: 'Markets' }).click();
  await expect(page).toHaveURL(/\/markets$/);
  await expect(page.getByRole('heading', { name: 'Explore the top 100 assets' })).toBeVisible();

  await primary.getByRole('link', { name: 'News' }).click();
  await expect(page).toHaveURL(/\/news$/);
  await expect(page.getByRole('heading', { name: 'Headlines that move markets' })).toBeVisible();

  await primary.getByRole('link', { name: 'Portfolio' }).click();
  await expect(page).toHaveURL(/\/portfolio$/);
  await expect(page.getByRole('heading', { name: 'Track your positions privately' })).toBeVisible();
});
