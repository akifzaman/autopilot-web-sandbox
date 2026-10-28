import { expect, test } from '@playwright/test';

test('home page shows the API status', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Autopilot Web Sandbox');
  await expect(page.getByTestId('api-status')).toHaveText('API: ok');
});
