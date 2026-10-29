import { expect, test } from '@playwright/test';

test('home page shows the Tasks screen', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tasks');
  await expect(page.getByRole('heading', { level: 2, name: 'Open tasks' })).toBeVisible();
});

test('the Add task form is present', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('form', { name: 'Add task' })).toBeVisible();
});
