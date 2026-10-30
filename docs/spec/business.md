# Business logic spec

> Project `autopilot-web-sandbox` · owner: BA/PO · draft changed by AWS-27 · approved when this file is merged to `main`.

## Overview
autopilot-web-sandbox is a simple shared task list for small teams. Any team member can add a task with a short title and, if they want, a due date. Members mark tasks done when they finish them. Everyone sees the same list of the team's open tasks, ordered by due date, so the team can see at a glance what is still outstanding and what is due first. Open tasks whose due date has already passed are shown in red so late work stands out. Whether a task has passed its due date is judged in the member's browser against the member's own local date. The product is deliberately minimal: capture a task, finish it, see what's left.

## Business rules
- R-1: A task must have a title. A title that is empty or contains only whitespace is invalid, and the task is not created.
- R-2: Leading and trailing whitespace is removed from the title before it is validated and stored.
- R-3: After trimming, the title must be at most 200 characters. 200 is allowed; 201 or more is rejected and the task is not created.
- R-4: The due date is optional. When given, it must be a valid calendar date (day, month and year, with no time of day); otherwise the task is not created.
- R-5: A due date in the past is accepted.
- R-6: A newly added task is always open.
- R-7: A task is either open or done. Marking an open task done makes it done.
- R-8: Marking a task that is already done succeeds and changes nothing (the task stays done).
- R-9: Any team member can mark any of the team's tasks done, not only the member who added it.
- R-10: Tasks with the same title (including identical title and due date) are allowed; each is a separate task.
- R-11: The open-tasks list shows every open task of the team and no done tasks.
- R-12: The open-tasks list is sorted by due date, earliest first. Tasks without a due date come after all tasks with one.
- R-13: Tasks with the same due date, and tasks without a due date, are ordered by when they were added, oldest first.
- R-14: When an add fails validation, the member sees a message that says what is wrong (missing title, title too long, or invalid due date), and nothing is saved.
- R-15: An open task is overdue when its due date is before today's date. A task due today, a task due later and a task without a due date are not overdue. Overdue open tasks are shown in red in the open-tasks list. Being overdue does not change a task's position in the list.
- R-16: 'Today' for the overdue check is the member's local calendar date, taken from the member's browser (device clock and time zone) when the list is shown. The server's date and UTC are not used, and the API does not decide or return whether a task is overdue.

## Workflows
### Add a task
1. The member opens the team's task list.
2. The member enters a title and, if they want, picks a due date.
3. The member submits the task.
4. The system trims the title and checks the title and due date against the rules.
5. If they're valid, the system saves the task as open and it appears in the open-tasks list in its sorted position. If its due date is before the member's local date (worked out in the browser), it shows in red.
6. If they're invalid, the system shows a validation message, saves nothing, and keeps what the member entered so they can correct it.

### Mark a task done
1. The member views the open-tasks list.
2. The member chooses 'mark done' on a task.
3. The system records the task as done.
4. The task disappears from the open-tasks list; the order of the remaining tasks doesn't change.

### Review open tasks
1. The member opens the team's task list.
2. The system shows all of the team's open tasks, sorted by due date (earliest first, tasks without a due date last, ties oldest first).
3. The browser works out today's date from the member's local date. Each open task whose due date is before that date is shown in red; all other tasks are shown normally.
4. If there are no open tasks, the system shows an empty-state message instead of a list.

## User stories and acceptance criteria

### S-1: as team member, I want to add a task with a title and an optional due date
So that the team knows about work that needs doing and when it is due.

- **AC-1** Adding a task with the title 'Write report' and no due date creates an open task with that title and no due date, and it appears in the open-tasks list.
- **AC-2** Adding a task with the title 'Write report' and the due date 2026-11-15 creates an open task with exactly that title and due date.
- **AC-3** Adding a task with an empty title is rejected with a 'title is required' message, and no task is created.
- **AC-4** Adding a task whose title is only whitespace (for example '   ') is rejected with a 'title is required' message, and no task is created.
- **AC-5** Adding a task whose title is exactly 200 characters long succeeds, and the full 200-character title is stored.
- **AC-6** Adding a task whose title is 201 characters long is rejected with a message that the title can be at most 200 characters, and no task is created.
- **AC-7** Adding a task with the title '  Write report  ' stores the title as 'Write report' (whitespace trimmed at both ends).
- **AC-8** A title that is 200 characters after trimming but longer before trimming (for example with surrounding spaces) is accepted.
- **AC-9** Adding a task with a due date that is not a valid calendar date (for example 2026-02-30 or 'tomorrow-ish') is rejected with an 'invalid due date' message, and no task is created.
- **AC-10** Adding a task with a due date in the past (for example 2020-01-01) succeeds, and the task is open.
- **AC-11** Adding two tasks with the same title and due date creates two separate open tasks, and both appear in the open-tasks list.

### S-2: as team member, I want to mark a task done
So that finished work no longer shows up as outstanding.

- **AC-12** Marking an open task done changes its status to done, and it no longer appears in the open-tasks list.
- **AC-13** Marking a task that is already done succeeds without an error, and the task stays done.
- **AC-14** Trying to mark done a task that doesn't exist returns a 'task not found' result and changes no task.

### S-3: as team member, I want to see the team's open tasks sorted by due date
So that I can see what is outstanding and what is due first.

- **AC-15** The open-tasks list contains every open task and no done tasks.
- **AC-16** Open tasks due 2026-12-01, 2026-11-01 and 2026-11-15 are listed in the order 2026-11-01, 2026-11-15, 2026-12-01.
- **AC-17** Open tasks without a due date are listed after all open tasks that have one.
- **AC-18** Open tasks with the same due date, and open tasks without a due date, are listed in the order they were added, oldest first.
- **AC-19** When the team has no open tasks, the list shows an empty-state message (for example 'No open tasks') instead of an empty table.

### S-4: as team member, I want overdue open tasks to show in red
So that I can spot late work at a glance.

- **AC-20** When today is 2026-11-10, an open task due 2026-11-09 (or any earlier date, for example 2020-01-01) is shown in red in the open-tasks list, and it keeps its sorted position.
- **AC-21** When today is 2026-11-10, an open task due 2026-11-10 (today) or 2026-11-11 (later) is not shown in red.
- **AC-22** An open task without a due date is never shown in red.
- **AC-23** 'Today' is the browser's local calendar date. Take a browser whose local date is 2026-11-10 while the UTC date is already 2026-11-11 (or is still 2026-11-09). An open task due 2026-11-09 is shown in red. An open task due 2026-11-10 is not shown in red. Neither the server's date nor the UTC date changes the result.

## Edge cases and validations
- Empty title, or a title that is only spaces, tabs or newlines: rejected as missing (AC-3, AC-4).
- Title length right at the limit: 200 characters is accepted, 201 is rejected; the length is measured after trimming (AC-5, AC-6, AC-8).
- Titles with non-Latin characters or emoji: each character counts as one character towards the 200 limit, not as bytes.
- Titles that contain markup such as '<b>x</b>' are stored and shown as literal text, never rendered as HTML.
- Due date that doesn't exist (for example 2026-02-30 or 2026-13-01) or isn't a date: rejected (AC-9).
- 29 February is accepted only in leap years (2028-02-29 is valid, 2027-02-29 is not).
- Due date in the past: accepted (AC-10), and the new task shows in red right away (AC-20).
- Due date equal to today: not overdue and not red; it turns red from the next day on (AC-21).
- Task without a due date: never overdue (AC-22).
- The date changes while the list is open (for example past midnight): the red highlight is updated the next time the list is loaded; live updates aren't required.
- Today is the member's own local calendar date, as computed in their browser, so members in different time zones may briefly see a different set of overdue tasks around midnight (AC-23).
- The browser's local date differs from the UTC date or the server's date (for example late in the evening west of UTC, or early in the morning east of UTC): the browser's local date wins (AC-23).
- The device clock is wrong: overdue is judged against the date the device shows; the app doesn't correct it.
- Overdue tasks are not reordered or grouped; the sort order from R-12 and R-13 stays the same.
- Marking an overdue task done removes it from the list like any other task (AC-12).
- Duplicate tasks (same title, or same title and due date): allowed, each is separate (AC-11).
- Marking an already-done task done: no error, no change (AC-13).
- Marking a task that doesn't exist (for example a stale or forged id): 'not found' result, nothing changes (AC-14).
- Two members mark the same task done at the same time: both succeed, and the task ends up done exactly once.
- Two members add tasks at the same time: both tasks are created; the one recorded first counts as older for tie-breaking.
- A member's list is out of date (another member has since added or completed tasks): the list reflects those changes the next time it is loaded; live updates aren't required.
- Permissions: any member can mark any team task done (R-9). Who counts as a member depends on question Q-1.
- No open tasks at all: empty-state message (AC-19).

## Data and calculation rules
- Task.id: assigned by the system, unique, never reused, and can't be set by the member.
- Task.title: required plain text, stored after trimming leading and trailing whitespace, 1 to 200 characters (Unicode characters, not bytes).
- Task.dueDate: optional calendar date with no time or time zone, exchanged in ISO format YYYY-MM-DD; when absent it is empty, not a placeholder date.
- Task.status: one of 'open' or 'done'; always 'open' when the task is created; the only allowed change is open to done.
- Task.createdAt: the date and time the task was added, recorded by the system and used only to order tasks that tie on due date.
- Open-tasks list = all tasks with status 'open', sorted by dueDate ascending, then tasks with no dueDate; within equal dueDate (or no dueDate) sorted by createdAt ascending.
- Dates are compared as calendar dates, so time zones don't affect the ordering.
- Overdue is derived and never stored: a task is overdue when its status is 'open', it has a dueDate, and dueDate < today. It's compared as a calendar date, not a timestamp.
- today (for overdue) = the browser's local calendar date (YYYY-MM-DD from the device's clock and time zone) when the list is shown, computed in the browser. It is not the UTC date and not the server's date, and it is not sent to or returned by the API.

## Out of scope
- Editing a task's title or due date after it has been created.
- Deleting tasks.
- Reopening a done task, and any view or history of done tasks (pending question Q-2).
- Assigning tasks to specific members, priorities, labels, descriptions, comments or attachments.
- Reminders, notifications or overdue alerts beyond the red highlight in the open-tasks list (no counts, banners, emails or sorting or filtering by overdue).
- Filtering, searching, or sort orders other than by due date.
- Due times (time of day) and recurring tasks.
- Real-time updates pushed to other members' screens, including re-colouring at midnight while the list is open.
- A team-wide or server-side 'today' (for example UTC), and an overdue flag in the API.
- User registration, sign-in and team administration (pending question Q-1).

## Assumptions
- Title whitespace is trimmed before validation and storage, so '   ' counts as empty and accidental spaces don't use up the 200-character limit.
- Title length is counted in Unicode characters, not bytes, because the limit is meant for humans.
- The due date is a date only (no time), because the intent says 'due date' and the list is sorted by date.
- Past due dates are allowed, because a member may log a task that is already late; rejecting them isn't part of the intent.
- Tasks without a due date are sorted last, because they are the least time-pressing; ties are broken by creation order so the list is stable and deterministic.
- Marking a task done is one-way, and doing it again is harmless (idempotent), because the intent mentions no undo and two members may click at the same time.
- Any member can mark any team task done, because the list belongs to the team and the intent doesn't restrict this.
- Duplicate titles are allowed, because the intent doesn't forbid them and teams often repeat tasks.
- Until Q-1 is answered, the app has a single shared team list, and anyone using the app counts as a member of that team; there are no accounts.
- The optional due date asked for in AWS-22 already exists (S-1, R-4, AC-2, AC-9, AC-10); the change only adds the overdue highlight.
- A task is overdue only after its due date has fully passed: a task due today isn't overdue yet.
- Decided by AWS-27 (answers Q-5): 'today' is the member's local calendar date, computed in the browser when the list is shown (R-16, AC-23). Nothing new is stored and the API doesn't change.
- Done tasks are never shown, so only open tasks can be shown in red.

## Open questions
- Q-1: How are teams and members identified? The intent mentions 'teams' and 'members', but the app has no sign-in. Should v1 have one shared team list with no accounts (our current assumption), or support several teams with member sign-in so each team only sees its own tasks?
- Q-2: Can a member undo 'mark done' (reopen a task), and should done tasks be visible anywhere, such as a 'done' list or a toggle? The spec currently treats done as final and hidden.
- Q-3: Should due dates in the past be rejected when a task is added? The spec currently accepts them.
- Q-4: May a title contain line breaks, or must it be a single line? The spec currently says nothing about this beyond the trimming and length rules.
- Q-6: Which part of an overdue task is red: the due date only or the whole row? And should there also be a text cue such as 'Overdue', so people who can't see colour differences can tell (accessibility)?
