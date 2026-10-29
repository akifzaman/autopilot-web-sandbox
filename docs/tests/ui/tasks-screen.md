# UI test cases: Tasks screen

> Project `autopilot-web-sandbox` · owner: QA · draft 1 · design: `docs/design/tasks-screen/` · approved when this file is merged to `main`.

Each case is automated by a Playwright test whose name starts with the case id. Cases that need exact list content stub `/api/tasks` with `page.route`; real-API cases use unique titles because the e2e store is shared.

## AC-1

### TC-UI-3: adding a task without a due date lists it with no due text
Verifies: AC-1, AC-15

Preconditions:
- Preconditions use a unique suffix in titles (e.g. 'Write report <suffix>') because the e2e server shares one in-memory store across parallel tests
- Real API

Steps:
1. Open the Tasks page
2. Type 'Write report <suffix>' into the textbox 'Title'
3. Leave 'Due date (optional)' empty
4. Press the button 'Add task'

Expected:
- In the list 'Open tasks' a row shows the text 'Write report <suffix>'
- That row has no 'Due' text
- The textbox 'Title' and 'Due date (optional)' are cleared
- No field error is shown

## AC-2

### TC-UI-4: adding a task with due date 2026-11-15 shows 'Due 2026-11-15'
Verifies: AC-2

Preconditions:
- Preconditions use a unique suffix in titles (e.g. 'Write report <suffix>') because the e2e server shares one in-memory store across parallel tests
- Real API

Steps:
1. Open the Tasks page
2. Type 'Write report <suffix>' into the textbox 'Title'
3. Fill 'Due date (optional)' with 2026-11-15
4. Press the button 'Add task'

Expected:
- In the list 'Open tasks' the row 'Write report <suffix>' shows 'Due 2026-11-15'
- The text 'Invalid due date' does not appear anywhere on the page
- The inputs are cleared

## AC-3

### TC-UI-5: empty title shows 'Title is required' under Title and keeps the input
Verifies: AC-3

Preconditions:
- GET /api/tasks and other calls are stubbed with page.route so the list content is exact
- GET /api/tasks returns one task 'Existing'; POST is not stubbed, the real API validates (or stubbed to 400 title_required for 'Title' with message 'Title is required')
- Count the POST /api/tasks calls that return 201

Steps:
1. Open the Tasks page
2. Leave the textbox 'Title' empty and fill 'Due date (optional)' with 2026-11-15
3. Press the button 'Add task'

Expected:
- The text 'Title is required' is shown directly below the textbox 'Title'
- The textbox 'Title' has aria-invalid='true' and aria-describedby pointing to the error
- 'Due date (optional)' still holds 2026-11-15
- The list 'Open tasks' still has only the row 'Existing' and no 201 response happened

## AC-4

### TC-UI-6: whitespace-only title shows 'Title is required' and keeps the input
Verifies: AC-4

Preconditions:
- GET /api/tasks and other calls are stubbed with page.route so the list content is exact
- GET /api/tasks returns one task 'Existing'

Steps:
1. Open the Tasks page
2. Type '   ' (three spaces) into the textbox 'Title'
3. Press the button 'Add task'

Expected:
- The text 'Title is required' is shown directly below the textbox 'Title'
- The textbox 'Title' has aria-invalid='true' and still holds the three spaces
- The list 'Open tasks' still has only the row 'Existing'

## AC-6

### TC-UI-7: 201-character title shows 'Title can be at most 200 characters' and keeps the input
Verifies: AC-6

Preconditions:
- GET /api/tasks and other calls are stubbed with page.route so the list content is exact
- GET /api/tasks returns one task 'Existing'

Steps:
1. Open the Tasks page
2. Type 201 times 'a' into the textbox 'Title'
3. Press the button 'Add task'

Expected:
- The text 'Title can be at most 200 characters' is shown directly below the textbox 'Title'
- The textbox 'Title' has aria-invalid='true' and still holds the 201 characters
- The list 'Open tasks' still has only the row 'Existing'

## AC-9

### TC-UI-8: invalid due date message shows under 'Due date (optional)' and keeps the input
Verifies: AC-9

Preconditions:
- GET /api/tasks and other calls are stubbed with page.route so the list content is exact
- A date input cannot hold 2026-02-30 and the client never validates dates, so POST /api/tasks is stubbed to return 400 {error:'validation_failed', errors:[{field:'dueDate', code:'invalid_due_date', message:'Invalid due date'}]}
- GET /api/tasks returns one task 'Existing'

Steps:
1. Open the Tasks page
2. Type 'Write report' into the textbox 'Title'
3. Fill 'Due date (optional)' with 2026-11-15
4. Press the button 'Add task'

Expected:
- The text 'Invalid due date' is shown directly below 'Due date (optional)', not below 'Title'
- 'Due date (optional)' has aria-invalid='true' and aria-describedby pointing to the error
- 'Title' still holds 'Write report' and the date input still holds 2026-11-15
- The textbox 'Title' has no error
- The list 'Open tasks' still has only the row 'Existing'

## AC-12

- See TC-UI-11: open-tasks list shows only open tasks and a done task does not return after reload

### TC-UI-12: Mark done disables the button, removes the row and keeps the order of the others
Verifies: AC-12, AC-16

Preconditions:
- GET /api/tasks and other calls are stubbed with page.route so the list content is exact
- GET /api/tasks returns 'A' due 2026-11-01, 'B' due 2026-11-15, 'C' no date; the first call returns all three, later calls return B and C only after the done call
- POST /api/tasks/{id}/done for B is stubbed to respond 200 after a short delay

Steps:
1. Open the Tasks page
2. Press the button 'Mark done: B'
3. Immediately look at that button
4. Wait for the response

Expected:
- While pending the button 'Mark done: B' is disabled
- After the response the row 'B' is gone from the list 'Open tasks'
- The remaining rows are A, C in that order
- No notice is shown

- See TC-UI-14: marking the last open task done shows 'No open tasks'

## AC-14

### TC-UI-13: marking a stale task done shows 'Task not found' and removes the row
Verifies: AC-14

Preconditions:
- GET /api/tasks and other calls are stubbed with page.route so the list content is exact
- GET /api/tasks returns 'A' and 'B'; POST /api/tasks/{id}/done for A is stubbed to return 404 {error:'not_found'}

Steps:
1. Open the Tasks page
2. Press the button 'Mark done: A'

Expected:
- The status 'Task not found' is visible
- The row 'A' is removed from the list 'Open tasks'
- The row 'B' is still listed

## AC-15

- See TC-UI-1: loading state shows 'Loading tasks…' while the form stays usable

- See TC-UI-3: adding a task without a due date lists it with no due text

### TC-UI-11: open-tasks list shows only open tasks and a done task does not return after reload
Verifies: AC-15, AC-12

Preconditions:
- Preconditions use a unique suffix in titles (e.g. 'Write report <suffix>') because the e2e server shares one in-memory store across parallel tests
- Real API

Steps:
1. Open the Tasks page
2. Add 'Keep <suffix>' and 'Finish <suffix>'
3. Press the button 'Mark done: Finish <suffix>'
4. Reload the page

Expected:
- After reload the list 'Open tasks' shows the row 'Keep <suffix>'
- The row 'Finish <suffix>' is not in the list

## AC-16

### TC-UI-9: list shows rows in the server order: dated by date, same date and undated oldest first
Verifies: AC-16, AC-17, AC-18

Preconditions:
- GET /api/tasks and other calls are stubbed with page.route so the list content is exact
- GET /api/tasks returns in this order: 'A' due 2026-11-01, 'B' due 2026-11-15, 'C' due 2026-11-15, 'D' due 2026-12-01, 'E' no date, 'F' no date

Steps:
1. Open the Tasks page
2. Read the rows of the list 'Open tasks' top to bottom

Expected:
- The rows are A (Due 2026-11-01), B (Due 2026-11-15), C (Due 2026-11-15), D (Due 2026-12-01), E, F in exactly this order
- Rows E and F have no 'Due' text
- The page does not reorder the rows itself

### TC-UI-10: a task is placed in sorted position after each add
Verifies: AC-16, AC-17, AC-18

Preconditions:
- Preconditions use a unique suffix in titles (e.g. 'Write report <suffix>') because the e2e server shares one in-memory store across parallel tests
- Real API; only rows whose title carries the unique suffix are compared, their relative order is checked

Steps:
1. Open the Tasks page
2. Add 'T1 <suffix>' with due date 2026-12-01
3. Add 'T2 <suffix>' with due date 2026-11-01
4. Add 'T3 <suffix>' with due date 2026-11-15
5. Add 'T4 <suffix>' with no due date
6. Add 'T5 <suffix>' with due date 2026-11-15

Expected:
- After the first add the list has T1
- After the second add T2 is listed before T1
- After the third add the order is T2, T3, T1
- After the fourth add T4 is listed after T1
- After the fifth add the order is T2, T3, T5, T1, T4 (same date: oldest first)

- See TC-UI-12: Mark done disables the button, removes the row and keeps the order of the others

## AC-17

- See TC-UI-9: list shows rows in the server order: dated by date, same date and undated oldest first

- See TC-UI-10: a task is placed in sorted position after each add

## AC-18

- See TC-UI-9: list shows rows in the server order: dated by date, same date and undated oldest first

- See TC-UI-10: a task is placed in sorted position after each add

## AC-19

### TC-UI-1: loading state shows 'Loading tasks…' while the form stays usable
Verifies: AC-19, AC-15

Preconditions:
- GET /api/tasks and other calls are stubbed with page.route so the list content is exact
- GET /api/tasks is stubbed to respond after a delay with one open task 'Write report'

Steps:
1. Open the Tasks page
2. Before the GET responds, look at the page
3. Type 'Draft' into the textbox 'Title' (form 'Add task')
4. Wait for the GET to respond

Expected:
- The heading level 1 'Tasks' is visible
- The status 'Loading tasks…' is visible and the list 'Open tasks' is not present
- The textbox 'Title', the date input 'Due date (optional)' and the button 'Add task' are enabled, and 'Draft' stays typed in 'Title'
- After the response the status 'Loading tasks…' is gone and the list 'Open tasks' shows one row with 'Write report'

### TC-UI-2: empty state shows 'No open tasks' without a list or table
Verifies: AC-19

Preconditions:
- GET /api/tasks and other calls are stubbed with page.route so the list content is exact
- GET /api/tasks is stubbed to return []

Steps:
1. Open the Tasks page

Expected:
- The paragraph 'No open tasks' is visible
- The list 'Open tasks' is not present and there is no table on the page
- The status 'Loading tasks…' is gone

### TC-UI-14: marking the last open task done shows 'No open tasks'
Verifies: AC-19, AC-12

Preconditions:
- GET /api/tasks and other calls are stubbed with page.route so the list content is exact
- GET /api/tasks returns one task 'Only'; after the done call it returns []

Steps:
1. Open the Tasks page
2. Press the button 'Mark done: Only'

Expected:
- The row 'Only' is removed
- The paragraph 'No open tasks' is visible
- The list 'Open tasks' is not present and there is no table

## Security / rendering

### TC-UI-15: titles are rendered as text and never as HTML
Verifies: AC-1

Preconditions:
- Preconditions use a unique suffix in titles (e.g. 'Write report <suffix>') because the e2e server shares one in-memory store across parallel tests
- Real API
- Listen for page dialogs

Steps:
1. Open the Tasks page
2. Type '<img src=x onerror=alert(1)> <suffix>' into the textbox 'Title'
3. Press the button 'Add task'

Expected:
- A row in the list 'Open tasks' shows the literal text '<img src=x onerror=alert(1)> <suffix>'
- The list contains no img element and no script element
- No dialog (alert) is raised
- The button 'Mark done: <img src=x onerror=alert(1)> <suffix>' exists in that row

