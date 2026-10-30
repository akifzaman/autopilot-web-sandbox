# Tasks screen

Design lives in `docs/design/tasks-screen/` (the specs say `docs/design/tasks/`; U-5/U-6/U-7 must read it from here).

## Purpose
The single screen where a team member adds a task, sees the open tasks in server order and marks tasks done.

## Decisions
- Heading is `h1` "Tasks". The scaffold's "API: ok" line is removed (no business purpose). U-5 must rewrite `e2e/smoke.spec.ts` to assert the h1 "Tasks" and that the form "Add task" is present.
- Due dates are shown as raw `YYYY-MM-DD` with a "Due" prefix, in `<time dateTime>`; no time-zone shifting.
- Field error text is `errors[].message` verbatim. The client writes only the generic copy and "Task not found".
- Known defect (fixed): an earlier mockup wrongly showed 2026-11-15 with "Invalid due date". A valid date is never flagged.
- Overdue (answers Q-6): only the due-date `<time>` turns red, not the whole row; title and "Mark done" keep their normal colours. Colour is `#b00020` (the field-error red, about 7.4:1 on the `#fff` background, WCAG AA/AAA). Non-colour cue: right after the `<time>` a visible text label `<span class="tag">Overdue</span>` in the same red, font-weight 600, read by screen readers as text.
- Overdue rule: status open AND dueDate not null AND dueDate < today, compared as `YYYY-MM-DD` strings (calendar dates, not timestamps) (R-15, R-16).
  - "Today" is the browser's local calendar date, built from getFullYear/getMonth/getDate of `new Date()`; never `toISOString()` (UTC) and never the server's date (AC-23).
  - It is worked out in the browser each time the list renders. The API returns no overdue flag; no API change.
  - The server order is unchanged: no re-sorting or grouping (AC-20).
  - A task due today, due later, or without a due date is never red (AC-21, AC-22).
- The list is a `<ul>`, not a table. Style stays minimal like the scaffold (single `<main>`).

## Layout (top to bottom)
1. `<h1>Tasks</h1>`
2. `<form aria-label="Add task">`: Title, Due date (optional), "Add task" button.
3. Notice area ("Task not found" / form and row failures).
4. `<h2>Open tasks</h2>` and the state: loading, load error, empty or list.

Mockup sections: Main state (no errors), Overdue, Validation: title, Validation: title too long, Validation: invalid due date, Empty, Loading, Load error.

## Components
- **TasksScreen**: loads GET /api/tasks, owns list and notice state.
- **AddTaskForm**: labelled "Title" text input (no maxlength, no client validation), labelled "Due date (optional)" `<input type="date">`, submit "Add task". Each field has its own error element directly below it, linked by `aria-describedby`, input gets `aria-invalid="true"`. Both field errors can show together. Submit is disabled while in flight.
- **OpenTaskList**: `<ul aria-label="Open tasks">` in exact server order, no client sorting.
- **Row**: title as a plain text node, then "Due 2026-11-15" or nothing when dueDate is null, followed by a red "Overdue" label when the task is overdue (date also red), then a button with visible text "Mark done" and `aria-label="Mark done: <title>"`. Disabled while its request is in flight.
- **Notice**: `role="status"` for "Task not found"; cleared on the next successful action or on dismiss.

## States
- **Loading**: `role="status"` "Loading tasks…", no list. The form stays usable.
- **Load error**: `role="alert"` "Could not load tasks." plus "Try again" button that re-fetches. The form stays usable.
- **Empty**: `<p>No open tasks</p>`, no `<ul>`, no table.
- **Success**: the list; overdue rows are highlighted (red due date plus "Overdue").
- **Validation (400 validation_failed)**: "Title is required" (title_required), "Title can be at most 200 characters" (title_too_long) under Title; "Invalid due date" (invalid_due_date) under the date. Entered values are kept, nothing is added.
  - The client never validates the date. It sends the date input's `value` unchanged (YYYY-MM-DD), or omits dueDate when empty, so a real date such as 2026-11-15 is accepted and listed as "Due 2026-11-15" (AC-2).
  - "Invalid due date" appears only when the 400 response has a FieldError with field `dueDate`. Each error goes under the input matching its `field`, never chosen by guessing from the code.
  - Field errors are cleared when the next submit starts.
- **Add failure (400 invalid_request, 500, network)**: form-level `role="alert"` "Could not add the task. Try again."
- **Add success (201)**: inputs and errors cleared, list re-fetched.
- **Mark done 200**: row removed, remaining order unchanged. **404**: row removed and "Task not found" notice. **Other failure**: row stays, "Could not mark the task done. Try again."

## Data fields
See `fields.yaml`.

## User flow
1. Screen opens, "Loading tasks…" shows, then the list or "No open tasks".
2. Member types a title, optionally picks a date, presses "Add task".
3. Invalid: messages appear below the fields, values stay. Valid: inputs clear, list re-fetches and the task is in sorted position.
4. Member presses "Mark done: <title>"; the button disables while pending.
5. 200: row disappears. 404: row disappears and "Task not found" shows.
6. When the list renders, rows due before the local date show the red date plus "Overdue"; adding a past-dated task shows it red right away.
7. When the last row goes, "No open tasks" shows.

## Acceptance criteria
- Form: AC-1, AC-2, AC-3, AC-4, AC-6, AC-9
- List: AC-1, AC-15, AC-16, AC-17 (order comes from the server)
- Mark done: AC-12, AC-14
- Overdue highlight: AC-20, AC-21, AC-22, AC-23
- Empty state: AC-19
