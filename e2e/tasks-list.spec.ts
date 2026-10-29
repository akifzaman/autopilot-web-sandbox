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

test('TC-UI-2 AC-19 empty state shows No open tasks without a list or table', async ({ page }) => {
  await page.route('**/api/tasks', (route) => route.fulfill({ json: { tasks: [] } }));
  await page.goto('/');
  await expect(page.getByText('No open tasks', { exact: true })).toBeVisible();
  await expect(page.getByRole('list', { name: 'Open tasks' })).toHaveCount(0);
  await expect(page.locator('table')).toHaveCount(0);
  await expect(page.getByRole('status')).toHaveCount(0);
  await expect(page.getByText('Loading tasks…')).toHaveCount(0);
});

const task = (title: string, dueDate: string | null, n: number) => ({
  id: `id-${title}`,
  title,
  dueDate,
  status: 'open',
  createdAt: `2026-10-01T10:00:0${n}.000Z`,
});

test('TC-UI-9 list shows rows in the server order: dated by date, same date and undated oldest first', async ({
  page,
}) => {
  const tasks = [
    task('A', '2026-11-01', 1),
    task('B', '2026-11-15', 2),
    task('C', '2026-11-15', 3),
    task('D', '2026-12-01', 4),
    task('E', null, 5),
    task('F', null, 6),
  ];
  await page.route('**/api/tasks', (route) => route.fulfill({ json: { tasks } }));
  await page.goto('/');
  const rows = page.getByRole('list', { name: 'Open tasks' }).getByRole('listitem');
  await expect(rows).toHaveText(['A Due 2026-11-01', 'B Due 2026-11-15', 'C Due 2026-11-15', 'D Due 2026-12-01', 'E', 'F']);
  await expect(rows.nth(4)).not.toContainText('Due');
  await expect(rows.nth(5)).not.toContainText('Due');
});

test('TC-UI-9 page does not reorder rows itself', async ({ page }) => {
  const tasks = [task('D', '2026-12-01', 1), task('A', '2026-11-01', 2), task('F', null, 3)];
  await page.route('**/api/tasks', (route) => route.fulfill({ json: { tasks } }));
  await page.goto('/');
  await expect(page.getByRole('list', { name: 'Open tasks' }).getByRole('listitem')).toHaveText([
    'D Due 2026-12-01',
    'A Due 2026-11-01',
    'F',
  ]);
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
