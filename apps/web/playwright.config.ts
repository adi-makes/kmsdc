import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.E2E_PORT ?? 3100);

/**
 * E2E, accessibility and visual-QA tests against a production build.
 * Screenshots go to <repo>/screenshots (git-ignored) for manual review.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${String(port)}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `pnpm exec next start --port ${String(port)}`,
    url: `http://localhost:${String(port)}/healthz`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
