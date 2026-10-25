import { expect, test } from '@playwright/test';
import { installApiMocks } from './fixtures';

test.beforeEach(async ({ page }) => {
  await installApiMocks(page);
});

test('adds a holding, persists it, and removes it', async ({ page }) => {
  await page.goto('/portfolio');

  await expect(page.getByRole('heading', { name: 'Track your positions privately' })).toBeVisible();
  await expect(page.getByText('No holdings yet')).toBeVisible();

  await page.getByLabel('Asset').selectOption('bitcoin');
  await page.getByLabel('Amount').fill('0.5');
  await page.getByLabel('Average buy price (USD)').fill('40000');
  await page.getByRole('button', { name: 'Add holding' }).click();

  const summary = page.locator('section[aria-label="Portfolio summary"]');
  await expect(summary.getByText('$25K')).toBeVisible();
  await expect(summary.getByText('$20K')).toBeVisible();
  await expect(summary.getByText('+$5K')).toBeVisible();
  await expect(summary.getByText('+25.00% on priced holdings')).toBeVisible();

  const row = page.locator('.portfolio-table tbody tr');
  await expect(row).toHaveCount(1);
  await expect(row).toContainText('Bitcoin');
  await expect(row).toContainText('0.5');
  await expect(row).toContainText('$40,000.00');

  await page.reload();
  await expect(page.locator('.portfolio-table tbody tr')).toContainText('Bitcoin');

  await page.getByRole('button', { name: 'Remove Bitcoin holding' }).click();
  await expect(page.getByText('No holdings yet')).toBeVisible();
  await expect(page.getByRole('button', { name: /Remove .* holding/ })).toHaveCount(0);
});

test('validates the holding form', async ({ page }) => {
  await page.goto('/portfolio');
  await page.getByLabel('Asset').selectOption('bitcoin');
  await page.getByLabel('Amount').fill('0');
  await page.getByLabel('Average buy price (USD)').fill('40000');
  await page.getByRole('button', { name: 'Add holding' }).click();

  await expect(page.getByRole('alert')).toContainText('Amount must be greater than zero.');
  await expect(page.getByText('No holdings yet')).toBeVisible();
});

test('creates an active alert, persists it, and removes it', async ({ page }) => {
  await page.goto('/alerts');

  await expect(page.getByRole('heading', { name: 'Watch a price target' })).toBeVisible();
  await page.getByLabel('Asset').selectOption('bitcoin');
  await page.getByLabel('Condition').selectOption('above');
  await page.getByLabel('Target price (USD)').fill('100000');
  await page.getByRole('button', { name: 'Create alert' }).click();

  const activeAlerts = page.locator('section[aria-labelledby="active-alerts-heading"]');
  await expect(activeAlerts.getByText('Above $100,000.00')).toBeVisible();
  await expect(activeAlerts.getByText(/100\.00% away/)).toBeVisible();
  await expect(page.getByLabel('Price alerts, 1 active')).toBeVisible();

  await page.reload();
  await expect(page.getByLabel('Price alerts, 1 active')).toBeVisible();
  await expect(activeAlerts.getByText('Above $100,000.00')).toBeVisible();

  await page.getByRole('button', { name: 'Remove Bitcoin alert' }).click();
  await expect(page.getByText('Nothing to watch yet')).toBeVisible();
  await expect(page.getByLabel('Price alerts, 0 active')).toBeVisible();
});

test('triggers an alert when the current price crosses the target', async ({ page }) => {
  await page.goto('/alerts');

  await page.getByLabel('Asset').selectOption('bitcoin');
  await page.getByLabel('Target price (USD)').fill('40000');
  await page.getByRole('button', { name: 'Create alert' }).click();

  const triggered = page.locator('section[aria-labelledby="triggered-heading"]');
  await expect(triggered.getByText('Triggered at $50,000.00')).toBeVisible();
  await expect(
    triggered.getByRole('button', { name: 'Remove triggered alert for Bitcoin' }),
  ).toBeVisible();
  await expect(page.getByText('No alerts are waiting.')).toBeVisible();

  await triggered.getByRole('button', { name: 'Clear all' }).click();
  await expect(page.getByText('No alerts have triggered yet.')).toBeVisible();
});
