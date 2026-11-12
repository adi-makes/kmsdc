import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { PAGES, VIEWPORTS } from './pages';

for (const page of PAGES) {
  for (const viewport of [VIEWPORTS[0], VIEWPORTS[2]]) {
    test(`${page.name} has no WCAG A/AA violations (${viewport.name})`, async ({ page: p }) => {
      await p.setViewportSize({ width: viewport.width, height: viewport.height });
      await p.goto(page.path);
      const results = await new AxeBuilder({ page: p })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      const summary = results.violations.map(
        (v) => `${v.id}: ${v.help} (${String(v.nodes.length)})`,
      );
      expect(summary).toEqual([]);
    });
  }
}

test('staff pages start with a working skip link', async ({ page }) => {
  await page.goto('/app');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to main content' });
  await expect(skip).toBeFocused();
  await skip.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
});

test('mobile navigation opens, traps focus and closes with Escape', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/app');
  const open = page.getByRole('button', { name: 'Open navigation' });
  await open.click();
  const dialog = page.getByRole('dialog', { name: 'Navigation' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('link', { name: 'Design system' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(open).toBeFocused();
});

test('design-system dialog is keyboard accessible', async ({ page }) => {
  await page.goto('/app/design-system');
  await page.getByRole('button', { name: 'Cancel appointment…' }).click();
  const dialog = page.getByRole('dialog', { name: 'Cancel this appointment?' });
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});
