import { render, screen, within } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import type { Task } from "./api/tasks";
import { OpenTaskList, isOverdue, localToday } from "./OpenTaskList";

const make = (id: string, title: string, dueDate: string | null): Task => ({
  id,
  title,
  dueDate,
  status: "open",
  createdAt: "2026-10-01T00:00:00.000Z",
});

it("AC-16 AC-17 AC-18 renders rows in server order without re-sorting", () => {
  render(
    <OpenTaskList
      onMarkDone={() => {}}
      pendingIds={new Set()}
      today="2026-10-01"
      tasks={[
        make("1", "c", "2026-12-01"),
        make("2", "a", null),
        make("3", "b", "2026-11-01"),
      ]}
    />,
  );
  const items = screen.getAllByRole("listitem");
  expect(items.map((li) => li.textContent)).toEqual([
    "c Due 2026-12-01 Mark done",
    "a Mark done",
    "b Due 2026-11-01 Mark done",
  ]);
});

it("AC-1 shows the title and no due date when dueDate is null", () => {
  render(
    <OpenTaskList
      onMarkDone={() => {}}
      pendingIds={new Set()}
      today="2026-10-01"
      tasks={[
        make("1", "Write report", null),
        make("2", "Dated", "2026-11-15"),
      ]}
    />,
  );
  const [plain, dated] = screen.getAllByRole("listitem") as [
    HTMLElement,
    HTMLElement,
  ];
  expect(plain.textContent).toBe("Write report Mark done");
  expect(plain.querySelector("time")).toBeNull();
  expect(within(plain).queryByText(/Due/)).toBeNull();
  const time = dated.querySelector("time");
  expect(time).toHaveTextContent("Due 2026-11-15");
  expect(time).toHaveAttribute("datetime", "2026-11-15");
});

it("renders markup in a title as literal text", () => {
  const { container } = render(
    <OpenTaskList
      onMarkDone={() => {}}
      pendingIds={new Set()}
      tasks={[make("1", "<b>x</b>", null)]}
    />,
  );
  expect(container.querySelector("b")).toBeNull();
  expect(screen.getByText("<b>x</b>")).toBeInTheDocument();
});

it("button has accessible name Mark done: <title> and calls onMarkDone(id)", () => {
  const onMarkDone = vi.fn();
  render(
    <OpenTaskList
      tasks={[make("7", "Pay", null)]}
      onMarkDone={onMarkDone}
      pendingIds={new Set()}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Mark done: Pay" }));
  expect(onMarkDone).toHaveBeenCalledWith("7");
});

it("button is disabled for pending ids only", () => {
  render(
    <OpenTaskList
      tasks={[make("1", "A", null), make("2", "B", null)]}
      onMarkDone={() => {}}
      pendingIds={new Set(["2"])}
    />,
  );
  expect(screen.getByRole("button", { name: "Mark done: A" })).toBeEnabled();
  expect(screen.getByRole("button", { name: "Mark done: B" })).toBeDisabled();
});

const overdueTasks = () => [
  make("1", "Old", "2020-01-01"),
  make("2", "Yesterday", "2026-11-09"),
  make("3", "Today", "2026-11-10"),
  make("4", "Tomorrow", "2026-11-11"),
  make("5", "Undated", null),
];
const renderOverdue = () =>
  render(
    <OpenTaskList
      onMarkDone={() => {}}
      pendingIds={new Set()}
      today="2026-11-10"
      tasks={overdueTasks()}
    />,
  );

it("AC-20 marks tasks due before today overdue and keeps server order", () => {
  renderOverdue();
  const items = screen.getAllByRole("listitem");
  expect(items.map((li) => li.textContent)).toEqual([
    "Old Due 2020-01-01 Overdue Mark done",
    "Yesterday Due 2026-11-09 Overdue Mark done",
    "Today Due 2026-11-10 Mark done",
    "Tomorrow Due 2026-11-11 Mark done",
    "Undated Mark done",
  ]);
  for (const i of [0, 1]) {
    expect(items[i]!.querySelector("time.overdue")).not.toBeNull();
    expect(items[i]!.querySelector(".tag")).toHaveTextContent("Overdue");
  }
});

it("AC-21 a task due today or later is not overdue", () => {
  renderOverdue();
  const items = screen.getAllByRole("listitem");
  for (const i of [2, 3]) {
    expect(items[i]!.querySelector(".overdue")).toBeNull();
    expect(items[i]!.textContent).not.toContain("Overdue");
  }
});

it("AC-22 a task without a due date is never overdue", () => {
  renderOverdue();
  const undated = screen.getAllByRole("listitem")[4]!;
  expect(undated.querySelector("time")).toBeNull();
  expect(undated.textContent).not.toContain("Overdue");
});

it("AC-23 localToday uses the local calendar date, not UTC", () => {
  expect(localToday(new Date(2026, 10, 10, 23, 30))).toBe("2026-11-10");
  expect(localToday(new Date(2026, 10, 10, 0, 30))).toBe("2026-11-10");
  expect(isOverdue("2026-11-09", "2026-11-10")).toBe(true);
  expect(isOverdue("2026-11-10", "2026-11-10")).toBe(false);
  expect(isOverdue(null, "2026-11-10")).toBe(false);
});
