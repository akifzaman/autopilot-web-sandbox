import { render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { App } from "./App";

afterEach(() => {
  vi.unstubAllGlobals();
});

it("renders the Tasks heading", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue({ status: 200, json: async () => ({ tasks: [] }) }),
  );
  render(<App />);
  expect(
    screen.getByRole("heading", { level: 1, name: "Tasks" }),
  ).toBeInTheDocument();
  expect(await screen.findByText("No open tasks")).toBeInTheDocument();
});
