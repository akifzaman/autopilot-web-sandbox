# Overdue highlight on the Tasks screen

Changes only the open-task rows of `OpenTaskList`. Everything else matches `docs/design/tasks-screen/` (not edited here): heading, add form, notices, loading, load error, empty state and Mark done behaviour.

## Purpose
The open-tasks list on the Tasks screen marks overdue open tasks in red so the team can spot late work (S-4, R-15).

## Decisions
- (Q-6a) The whole row's text turns red: the title, the `Due YYYY-MM-DD` text and the new `Overdue` label. Implemented as class `overdue` on the `<li>`. The "Mark done" button keeps its default style.
- (Q-6b) Colour is `#b00020`, the same colour as the existing `.err` text. Contrast on the white page background `#fff` is about 7.3:1, which passes WCAG AA and AAA for normal text.
- (Q-6c) Non-colour cue: a visible text label `Overdue`, right after the due date, `<span class="overdue-label">Overdue</span>`, inside the same `<li>`. Screen readers read "Plan sprint Due 2026-11-09 Overdue". Optional extra visual cue: a 3px red left border on the row.
- (d) "Today" is the browser's local calendar date, worked out when the list renders. Build it as `YYYY-MM-DD` from local `getFullYear()`, `getMonth() + 1` and `getDate()`, zero-padded. Never use `toISOString()` (that is UTC). Compare as strings: `overdue = dueDate !== null && dueDate < today`. This is a calendar-date comparison, not a timestamp.
- (e) The server order is unchanged. No client sorting, grouping or filtering. Overdue rows keep their server position (R-15, AC-20).
- (f) A task due today, due later, or with `dueDate` null is never red and has no label (AC-21, AC-22).
- (g) No live update at midnight. The highlight is recalculated the next time the list renders or loads (R-15 edge case).
- (h) No API change. Overdue is derived in the client from `Task.dueDate` and is not stored.

## Layout (top to bottom)
Same as `docs/design/tasks-screen/`: `h1` "Tasks", the "Add task" form, the notice area, then `h2` "Open tasks" and the list. The only change is the look of overdue rows:

```
Plan sprint  Due 2026-11-09  Overdue  [Mark done]     <- red text, red left border
Write report Due 2026-11-10          [Mark done]     <- default
```

## Components
- **OpenTaskList**: `<ul aria-label="Open tasks">`, unchanged order. Adds the overdue check per row, with `today` computed once per render.
- **Row** (`<li>`): when overdue, `class="overdue"`. Content in order: title text, `<time dateTime>Due YYYY-MM-DD</time>` (only when dueDate is set), `<span class="overdue-label">Overdue</span>` (only when overdue), then the unchanged "Mark done" button.

## States
- **Loading**: unchanged from tasks-screen (`role="status"` "Loading tasks…", no list).
- **Load error**: unchanged from tasks-screen (`role="alert"` "Could not load tasks.", "Try again").
- **Empty**: unchanged from tasks-screen (`<p>No open tasks</p>`, no list).
- **Validation messages**: unchanged from tasks-screen. The add form does not change.
- **Success**: list of open tasks in server order. Each row is either overdue (red, with the `Overdue` label) or normal (no label). Mixed rows are shown together.
- **Mark done** (200, 404, other failure): unchanged from tasks-screen. A row that goes away takes its red state with it.

## Data fields
See `fields.yaml`.

## User flow
1. The screen loads the open tasks. The list is rendered in server order.
2. For each row, the browser's local today (`YYYY-MM-DD`) is compared with the row's due date.
3. Rows with a due date before today render red with the `Overdue` label. Other rows render as usual.
4. Member presses "Mark done: <title>" on an overdue row. The row is removed as usual (AC-12). Remaining rows keep their order.
5. Member adds a task with a past due date. After the list re-fetches, the new task is shown red right away (R-15 edge case).
6. The next time the list loads on another day, the highlight is recalculated from the new local today.

## Acceptance criteria
- AC-20 (red row, `Overdue` label, kept position): flow 2 and 3; mockup section "Overdue" rows 1 and 2; flow 5.
- AC-21 (due today or later is not red): flow 3; mockup rows 3 and 4.
- AC-22 (no due date is never red): flow 3; mockup row 5.
- Order unchanged (AC-16, AC-17, AC-18): component OpenTaskList, no client sorting; mockup rows in server order.
