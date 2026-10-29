import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { TasksScreen } from "./TasksScreen";

const task = (id: string, title: string) => ({
  id,
  title,
  dueDate: null,
  status: "open",
  createdAt: "2026-10-01T00:00:00.000Z",
});
const ok = (tasks: unknown[]) => ({
  status: 200,
  json: async () => ({ tasks }),
});

afterEach(() => {
  vi.unstubAllGlobals();
});

it("shows Loading tasks… while fetch is pending", () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => new Promise(() => undefined)),
  );
  render(<TasksScreen />);
  expect(screen.getByRole("status")).toHaveTextContent("Loading tasks…");
  expect(screen.queryByRole("list")).toBeNull();
});

it("AC-19 shows No open tasks for an empty list", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(ok([])));
  render(<TasksScreen />);
  expect(await screen.findByText("No open tasks")).toBeInTheDocument();
  expect(screen.queryByRole("list")).toBeNull();
  expect(screen.queryByRole("table")).toBeNull();
});

it("AC-15 lists the open tasks returned by the server", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(ok([task("1", "Second"), task("2", "First")])),
  );
  render(<TasksScreen />);
  const items = await screen.findAllByRole("listitem");
  expect(items.map((li) => li.textContent)).toEqual([
    "Second Mark done",
    "First Mark done",
  ]);
});

it("shows a load error on a 500 and recovers with Try again", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce({ status: 500, json: async () => ({}) })
    .mockResolvedValueOnce(ok([task("1", "Back")]));
  vi.stubGlobal("fetch", fetchMock);
  render(<TasksScreen />);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Could not load tasks.",
  );
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findByText("Back")).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

it("shows a load error when fetch rejects", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
  render(<TasksScreen />);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Could not load tasks.",
  );
});

const stub = (tasks: unknown[], post: () => Promise<unknown>) =>
  vi.stubGlobal(
    "fetch",
    vi.fn((_url: string, init?: { method?: string }) =>
      init?.method === "POST" ? post() : Promise.resolve(ok(tasks)),
    ),
  );
const rowTitles = () =>
  screen.getAllByRole("listitem").map((li) => li.firstChild?.textContent);

it("TC-UI-12 disables the button while pending, then removes the row keeping order, no notice", async () => {
  let resolve!: (v: unknown) => void;
  stub(
    [task("a", "A"), task("b", "B"), task("c", "C")],
    () => new Promise((r) => (resolve = r)),
  );
  render(<TasksScreen />);
  const button = await screen.findByRole("button", { name: "Mark done: B" });
  fireEvent.click(button);
  await waitFor(() => expect(button).toBeDisabled());
  resolve({ status: 200, json: async () => task("b", "B") });
  await waitFor(() =>
    expect(screen.queryByRole("button", { name: "Mark done: B" })).toBeNull(),
  );
  expect(rowTitles()).toEqual(["A", "C"]);
  expect(screen.queryByRole("status")).toBeNull();
});

it("TC-UI-13 404 removes the row and shows Task not found", async () => {
  stub([task("a", "A"), task("b", "B")], async () => ({
    status: 404,
    json: async () => ({ error: "not_found" }),
  }));
  render(<TasksScreen />);
  fireEvent.click(await screen.findByRole("button", { name: "Mark done: A" }));
  expect(await screen.findByRole("status")).toHaveTextContent("Task not found");
  expect(rowTitles()).toEqual(["B"]);
});

it("TC-UI-14 removing the last row shows No open tasks", async () => {
  stub([task("o", "Only")], async () => ({
    status: 200,
    json: async () => task("o", "Only"),
  }));
  render(<TasksScreen />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Mark done: Only" }),
  );
  expect(await screen.findByText("No open tasks")).toBeInTheDocument();
  expect(screen.queryByRole("list")).toBeNull();
});

it("keeps the row and shows an error when marking done fails with 500", async () => {
  stub([task("a", "A")], async () => ({ status: 500, json: async () => ({}) }));
  render(<TasksScreen />);
  fireEvent.click(await screen.findByRole("button", { name: "Mark done: A" }));
  expect(await screen.findByRole("status")).toHaveTextContent(
    "Could not mark the task done. Try again.",
  );
  expect(rowTitles()).toEqual(["A"]);
  expect(screen.getByRole("button", { name: "Mark done: A" })).toBeEnabled();
});
