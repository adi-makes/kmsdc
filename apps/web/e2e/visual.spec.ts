import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { PAGES, VIEWPORTS } from './pages';

// Playwright runs from apps/web; screenshots go to <repo>/screenshots (git-ignored).
const outDir = resolve(process.cwd(), '../../screenshots');
mkdirSync(outDir, { recursive: true });

for (const page of PAGES) {
  for (const viewport of VIEWPORTS) {
    test(`${page.name} @ ${viewport.name}: no horizontal overflow + screenshot`, async ({
      page: p,
    }) => {
      await p.setViewportSize({ width: viewport.width, height: viewport.height });
      await p.goto(page.path);
      await p.evaluate(() => document.fonts.ready);
      const overflow = await p.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, 'page must not scroll horizontally').toBeLessThanOrEqual(0);
      await p.screenshot({
        path: `${outDir}/${page.name}-${viewport.name}.png`,
        fullPage: true,
      });
    });
  }
}
