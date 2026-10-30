import { expect, test, type Page } from "@playwright/test";

const RED = "rgb(176, 0, 32)";

const task = (title: string, dueDate: string | null, n: number) => ({
  id: `id-${title}`,
  title,
  dueDate,
  status: "open",
  createdAt: `2026-10-01T10:00:0${n}.000Z`,
});

const open = async (page: Page, time: string, tasks: unknown[]) => {
  await page.route("**/api/tasks", (route) =>
    route.fulfill({ json: { tasks } }),
  );
  await page.clock.setFixedTime(new Date(time));
  await page.goto("/");
  const list = page.getByRole("list", { name: "Open tasks" });
  await expect(list).toBeVisible();
  return list;
};

const row = (list: ReturnType<Page["getByRole"]>, title: string) =>
  list.getByRole("listitem").filter({ hasText: new RegExp(`^${title} `) });

test.describe("Berlin", () => {
  test.use({ timezoneId: "Europe/Berlin" });
  const tasks = [
    task("Old", "2020-01-01", 1),
    task("Yesterday", "2026-11-09", 2),
    task("Today", "2026-11-10", 3),
    task("Tomorrow", "2026-11-11", 4),
    task("Undated", null, 5),
  ];
  const T = "2026-11-10T12:00:00+01:00";

  test("TC-UI-16 AC-20 overdue tasks show a red due date and keep their server order", async ({
    page,
  }) => {
    const list = await open(page, T, tasks);
    await expect(list.getByRole("listitem")).toHaveCount(5);
    const titles = (await list.getByRole("listitem").allTextContents()).map(
      (t) => t.split(" ")[0],
    );
    expect(titles).toEqual([
      "Old",
      "Yesterday",
      "Today",
      "Tomorrow",
      "Undated",
    ]);
    await expect(row(list, "Old").locator("time")).toHaveText("Due 2020-01-01");
    await expect(row(list, "Old").locator("time")).toHaveCSS("color", RED);
    await expect(row(list, "Yesterday").locator("time")).toHaveText(
      "Due 2026-11-09",
    );
    await expect(row(list, "Yesterday").locator("time")).toHaveCSS(
      "color",
      RED,
    );
  });

  test("TC-UI-17 AC-20 overdue rows carry the visible text label Overdue; only the date and label are red", async ({
    page,
  }) => {
    const list = await open(page, T, tasks);
    for (const title of ["Old", "Yesterday"]) {
      const r = row(list, title);
      const label = r.getByText("Overdue", { exact: true });
      await expect(label).toHaveCSS("color", RED);
      await expect(label).toHaveCSS("font-weight", "600");
      await expect(r).toHaveCSS("color", "rgb(34, 34, 34)");
      await expect(
        r.getByRole("button", { name: `Mark done: ${title}` }),
      ).not.toHaveCSS("color", RED);
    }
    await expect(list.getByText("Overdue", { exact: true })).toHaveCount(2);
  });

  test("TC-UI-18 AC-21 tasks due today or later are not red and have no Overdue label", async ({
    page,
  }) => {
    const list = await open(page, T, tasks);
    await expect(row(list, "Today").locator("time")).toHaveText(
      "Due 2026-11-10",
    );
    await expect(row(list, "Tomorrow").locator("time")).toHaveText(
      "Due 2026-11-11",
    );
    for (const title of ["Today", "Tomorrow"]) {
      await expect(row(list, title).locator("time")).not.toHaveCSS(
        "color",
        RED,
      );
      await expect(row(list, title)).not.toContainText("Overdue");
    }
  });

  test("TC-UI-19 AC-22 a task without a due date is never red", async ({
    page,
  }) => {
    const list = await open(page, T, tasks);
    const r = row(list, "Undated");
    await expect(r).not.toContainText("Due");
    await expect(r.locator("time")).toHaveCount(0);
    await expect(r).not.toContainText("Overdue");
    await expect(r).not.toHaveCSS("color", RED);
    await expect(r.getByRole("button")).not.toHaveCSS("color", RED);
  });
});

const yt = [task("Yesterday", "2026-11-09", 1), task("Today", "2026-11-10", 2)];

const checkYesterdayOverdue = async (list: ReturnType<Page["getByRole"]>) => {
  await expect(row(list, "Yesterday").locator("time")).toHaveCSS("color", RED);
  await expect(row(list, "Yesterday")).toContainText("Overdue");
  await expect(row(list, "Today").locator("time")).not.toHaveCSS("color", RED);
  await expect(row(list, "Today")).not.toContainText("Overdue");
};

test.describe("West of UTC", () => {
  test.use({ timezoneId: "America/Los_Angeles" });
  test("TC-UI-20 AC-23 local date wins when UTC is already tomorrow (west of UTC)", async ({
    page,
  }) => {
    await checkYesterdayOverdue(await open(page, "2026-11-11T04:00:00Z", yt));
  });
});

test.describe("East of UTC", () => {
  test.use({ timezoneId: "Pacific/Kiritimati" });
  test("TC-UI-21 AC-23 local date wins when UTC is still yesterday (east of UTC)", async ({
    page,
  }) => {
    await checkYesterdayOverdue(await open(page, "2026-11-09T18:00:00Z", yt));
  });
});
