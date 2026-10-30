import { expect, test, type Page } from '@playwright/test';

const suffix = () => `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const task = (title: string) => ({
  id: '1',
  title,
  dueDate: null,
  status: 'open',
  createdAt: '2026-10-01T00:00:00.000Z',
});

async function mockList(page: Page, title: string, delayMs = 0) {
  await page.route('**/api/tasks', async (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
    return route.fulfill({ json: { tasks: [task(title)] } });
  });
}

async function add(page: Page, title: string, due?: string) {
  await page.getByRole('textbox', { name: 'Title' }).fill(title);
  if (due) await page.getByLabel('Due date (optional)').fill(due);
  await page.getByRole('button', { name: 'Add task' }).click();
}

const rows = (page: Page, s: string) => page.getByRole('listitem').filter({ hasText: s });

test('TC-UI-1 loading state keeps the form usable', async ({ page }) => {
  await mockList(page, 'Write report', 800);
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Tasks' })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('Loading tasks…');
  await expect(page.getByRole('list', { name: 'Open tasks' })).toHaveCount(0);
  await page.getByRole('textbox', { name: 'Title' }).fill('Draft');
  await expect(page.getByRole('textbox', { name: 'Title' })).toBeEnabled();
  await expect(page.getByLabel('Due date (optional)')).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Add task' })).toBeEnabled();
  await expect(page.getByRole('textbox', { name: 'Title' })).toHaveValue('Draft');
  await expect(page.getByText('Loading tasks…')).toHaveCount(0);
  await expect(page.getByRole('list', { name: 'Open tasks' }).getByRole('listitem')).toContainText(['Write report']);
});

test('TC-UI-3 AC-1 adds a task without a due date', async ({ page }) => {
  const title = `Write report ${suffix()}`;
  await page.goto('/');
  await add(page, title);
  const row = rows(page, title);
  await expect(row).toBeVisible();
  await expect(row).not.toContainText('Due');
  await expect(page.getByRole('textbox', { name: 'Title' })).toHaveValue('');
  await expect(page.getByLabel('Due date (optional)')).toHaveValue('');
  await expect(page.locator('.err')).toHaveCount(0);
});

test('TC-UI-4 AC-2 adds a task with due date 2026-11-15', async ({ page }) => {
  const title = `Write report ${suffix()}`;
  await page.goto('/');
  await add(page, title, '2026-11-15');
  await expect(rows(page, title)).toContainText('Due 2026-11-15');
  await expect(page.getByText('Invalid due date')).toHaveCount(0);
  await expect(page.getByRole('textbox', { name: 'Title' })).toHaveValue('');
  await expect(page.getByLabel('Due date (optional)')).toHaveValue('');
});

for (const [id, title, message] of [
  ['TC-UI-5', '', 'Title is required'],
  ['TC-UI-6', '   ', 'Title is required'],
  ['TC-UI-7', 'a'.repeat(201), 'Title can be at most 200 characters'],
] as const) {
  test(`${id} shows '${message}' under Title and keeps the input`, async ({ page }) => {
    await mockList(page, 'Existing');
    let created = false;
    page.on('response', (r) => {
      if (r.request().method() === 'POST' && r.status() === 201) created = true;
    });
    await page.goto('/');
    await expect(rows(page, 'Existing')).toBeVisible();
    const titleBox = page.getByRole('textbox', { name: 'Title' });
    if (title) await titleBox.fill(title);
    if (id === 'TC-UI-5') await page.getByLabel('Due date (optional)').fill('2026-11-15');
    await page.getByRole('button', { name: 'Add task' }).click();
    const err = page.getByText(message);
    await expect(err).toBeVisible();
    await expect(titleBox).toHaveAttribute('aria-invalid', 'true');
    await expect(titleBox).toHaveAttribute('aria-describedby', (await err.getAttribute('id')) ?? '');
    await expect(titleBox).toHaveValue(title);
    if (id === 'TC-UI-5') await expect(page.getByLabel('Due date (optional)')).toHaveValue('2026-11-15');
    await expect(page.getByRole('listitem')).toContainText(['Existing']);
    expect(created).toBe(false);
  });
}

test('TC-UI-8 shows Invalid due date under the date only', async ({ page }) => {
  await mockList(page, 'Existing');
  await page.route('**/api/tasks', (route) =>
    route.request().method() === 'POST'
      ? route.fulfill({
          status: 400,
          json: {
            error: 'validation_failed',
            errors: [{ field: 'dueDate', code: 'invalid_due_date', message: 'Invalid due date' }],
          },
        })
      : route.fallback(),
  );
  await page.goto('/');
  await add(page, 'Write report', '2026-11-15');
  const err = page.getByText('Invalid due date');
  const date = page.getByLabel('Due date (optional)');
  await expect(err).toBeVisible();
  await expect(date).toHaveAttribute('aria-invalid', 'true');
  await expect(date).toHaveAttribute('aria-describedby', (await err.getAttribute('id')) ?? '');
  await expect(page.getByRole('textbox', { name: 'Title' })).not.toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByRole('textbox', { name: 'Title' })).toHaveValue('Write report');
  await expect(date).toHaveValue('2026-11-15');
  await expect(page.getByRole('listitem')).toContainText(['Existing']);
});

test('TC-UI-10 places each added task in sorted position', async ({ page }) => {
  const s = suffix();
  const order = async () =>
    (await page.getByRole('listitem').allTextContents())
      .filter((t) => t.includes(s))
      .map((t) => t.slice(0, 2));
  await page.goto('/');
  const steps: [string, string | undefined, string[]][] = [
    ['T1', '2026-12-01', ['T1']],
    ['T2', '2026-11-01', ['T2', 'T1']],
    ['T3', '2026-11-15', ['T2', 'T3', 'T1']],
    ['T4', undefined, ['T2', 'T3', 'T1', 'T4']],
    ['T5', '2026-11-15', ['T2', 'T3', 'T5', 'T1', 'T4']],
  ];
  for (const [name, due, expected] of steps) {
    await add(page, `${name} ${s}`, due);
    await expect.poll(order).toEqual(expected);
  }
});

test('TC-UI-15 renders titles as text, never as HTML', async ({ page }) => {
  const title = `<img src=x onerror=alert(1)> ${suffix()}`;
  let dialog = false;
  page.on('dialog', (d) => {
    dialog = true;
    void d.dismiss();
  });
  await page.goto('/');
  await add(page, title);
  const row = page.getByRole('listitem').filter({ hasText: title });
  await expect(row).toContainText(title);
  await expect(page.getByRole('list', { name: 'Open tasks' }).locator('img, script')).toHaveCount(0);
  expect(dialog).toBe(false);
  // The 'Mark done: <title>' button belongs to U-7 and is not rendered yet.
  test.fixme(true, 'Mark done button arrives with U-7');
});

test('AC-10 a past due date is accepted', async ({ page }) => {
  const title = `Past ${suffix()}`;
  await page.goto('/');
  await add(page, title, '2020-01-01');
  await expect(rows(page, title)).toContainText('Due 2020-01-01');
});

test('AC-11 adding the same title and date twice lists two rows', async ({ page }) => {
  const title = `Twin ${suffix()}`;
  await page.goto('/');
  await add(page, title, '2026-11-15');
  await expect(rows(page, title)).toHaveCount(1);
  await add(page, title, '2026-11-15');
  await expect(rows(page, title)).toHaveCount(2);
});
