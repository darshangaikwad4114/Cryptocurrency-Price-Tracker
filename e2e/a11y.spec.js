import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { installApiMocks } from './fixtures';

const ROUTES = [
  { path: '/', heading: 'The crypto market at a glance' },
  { path: '/markets', heading: 'Explore the top 100 assets' },
  { path: '/portfolio', heading: 'Track your positions privately' },
  { path: '/alerts', heading: 'Watch a price target' },
];

test.beforeEach(async ({ page }) => {
  await installApiMocks(page);
});

for (const theme of ['dark', 'light']) {
  for (const { path, heading } of ROUTES) {
    test(`has no serious WCAG A/AA violations on ${path} (${theme} theme)`, async ({
      page,
    }, testInfo) => {
      test.skip(
        testInfo.project.name !== 'desktop-chromium',
        'Accessibility audit runs on desktop',
      );
      await page.goto(path);
      await expect(page.getByRole('heading', { name: heading })).toBeVisible();

      if (theme === 'light') {
        await page.getByRole('button', { name: 'Switch to light mode' }).click();
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
      }

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const serious = results.violations.filter(
        (violation) => violation.impact === 'serious' || violation.impact === 'critical',
      );
      expect(
        serious.map((violation) => ({
          id: violation.id,
          impact: violation.impact,
          nodes: violation.nodes.map((node) => node.target.join(' ')).slice(0, 5),
        })),
      ).toEqual([]);
    });
  }
}
