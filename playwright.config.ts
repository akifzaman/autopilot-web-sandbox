import { defineConfig, devices } from '@playwright/test';

// E2E and UI tests run against the production build: the API serves the built front-end on one port.
const port = Number(process.env.E2E_PORT ?? 4173);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run build && npm start',
    url: `http://127.0.0.1:${port}/api/health`,
    env: { PORT: String(port), HOST: '127.0.0.1' },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
