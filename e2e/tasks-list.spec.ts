import { expect, test, type APIRequestContext } from '@playwright/test';

const suffix = () => `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

async function seed(request: APIRequestContext, title: string, dueDate?: string): Promise<string> {
  const response = await request.post('/api/tasks', { data: dueDate ? { title, dueDate } : { title } });
  expect(response.status()).toBe(201);
  return ((await response.json()) as { id: string }).id;
}

test('AC-1 shows a task without a due date', async ({ page, request }) => {
  const title = `Write report ${suffix()}`;
  await seed(request, title);
  await page.goto('/');
  const row = page.getByRole('listitem').filter({ hasText: title });
  await expect(row).toBeVisible();
  await expect(row).not.toContainText('Due');
});

test('AC-15 lists only open tasks', async ({ page, request }) => {
  const s = suffix();
  const doneId = await seed(request, `Done ${s}`);
  await seed(request, `Open ${s}`);
  expect((await request.post(`/api/tasks/${doneId}/done`)).status()).toBe(200);
  await page.goto('/');
  await expect(page.getByText(`Open ${s}`)).toBeVisible();
  await expect(page.getByText(`Done ${s}`)).toHaveCount(0);
});

test('AC-16 AC-17 AC-18 orders by due date, then undated, ties oldest first', async ({ page, request }) => {
  const s = suffix();
  const titles = [
    `D1201 ${s}`,
    `D1101 ${s}`,
    `D1115a ${s}`,
    `N1 ${s}`,
    `D1115b ${s}`,
    `N2 ${s}`,
  ];
  const dates = ['2026-12-01', '2026-11-01', '2026-11-15', undefined, '2026-11-15', undefined];
  for (let i = 0; i < titles.length; i++) await seed(request, titles[i]!, dates[i]);
  await page.goto('/');
  await expect(page.getByText(`N2 ${s}`)).toBeVisible();
  const all = await page.getByRole('listitem').allTextContents();
  const seen = all.filter((t) => t.includes(s)).map((t) => t.split(' ')[0]);
  expect(seen).toEqual(['D1101', 'D1115a', 'D1115b', 'D1201', 'N1', 'N2']);
});

test('AC-19 shows the empty state', async ({ page }) => {
  await page.route('**/api/tasks', (route) => route.fulfill({ json: { tasks: [] } }));
  await page.goto('/');
  await expect(page.getByText('No open tasks')).toBeVisible();
  await expect(page.getByRole('list', { name: 'Open tasks' })).toHaveCount(0);
});

test('shows a load error and recovers with Try again', async ({ page }) => {
  await page.route('**/api/tasks', (route) => route.fulfill({ status: 500, json: { error: 'internal_error' } }));
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('Could not load tasks.');
  await page.unroute('**/api/tasks');
  await page.route('**/api/tasks', (route) => route.fulfill({ json: { tasks: [] } }));
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByText('No open tasks')).toBeVisible();
});

test('shows the loading state while the request is pending', async ({ page }) => {
  await page.route('**/api/tasks', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await route.fulfill({ json: { tasks: [] } });
  });
  await page.goto('/');
  await expect(page.getByRole('status')).toHaveText('Loading tasks…');
  await expect(page.getByText('No open tasks')).toBeVisible();
});
