# Backend and API test cases

> Project `autopilot-web-sandbox` · owner: QA · draft 1 · approved when this file is merged to `main`.

Each case is automated by a test whose name starts with the case id.

## U-1

### TC-1: validation trims surrounding whitespace from the title
Kind: unit · verifies: AC-7

Preconditions:
- validation.ts is called directly (no HTTP)

Steps:
1. Validate { title: '  Write report  ' } with no dueDate

Expected:
- Result is valid
- Normalised title is exactly 'Write report'
- Normalised dueDate is null

### TC-2: validation trims tabs, newlines and Unicode whitespace at both ends
Kind: edge · verifies: AC-7

Preconditions:
- validation.ts is called directly

Steps:
1. Validate titles '\tWrite report\n', ' Write report　' and '\r\n Write report \r\n'

Expected:
- Each result is valid
- Each normalised title is exactly 'Write report'

### TC-3: validation rejects an empty title with title_required
Kind: negative · verifies: AC-3

Preconditions:
- validation.ts is called directly

Steps:
1. Validate { title: '' }

Expected:
- Result is invalid with exactly one error { field: 'title', code: 'title_required', message: 'Title is required' }

### TC-4: validation rejects a whitespace-only title with title_required
Kind: negative · verifies: AC-4

Preconditions:
- validation.ts is called directly

Steps:
1. Validate titles '   ', '\t\n ' and ' 　'

Expected:
- Each result is invalid with one error { field: 'title', code: 'title_required' }

### TC-5: validation accepts a title of exactly 200 characters and keeps it whole
Kind: edge · verifies: AC-5

Preconditions:
- validation.ts is called directly

Steps:
1. Validate a title of 200 'a' characters

Expected:
- Result is valid
- Normalised title equals the input and has length 200

### TC-6: validation rejects a 201-character title with title_too_long
Kind: edge · verifies: AC-6

Preconditions:
- validation.ts is called directly

Steps:
1. Validate a title of 201 'a' characters

Expected:
- Result is invalid with one error { field: 'title', code: 'title_too_long', message: 'Title can be at most 200 characters' }

### TC-7: validation applies the 200 limit after trimming
Kind: edge · verifies: AC-8

Preconditions:
- validation.ts is called directly

Steps:
1. Validate '     ' + 200 'a' characters + '     ' (210 characters before trimming)

Expected:
- Result is valid
- Normalised title is the 200 'a' characters

### TC-8: validation counts title length in Unicode code points
Kind: edge · verifies: AC-5, AC-6

Preconditions:
- validation.ts is called directly

Steps:
1. Validate a title of 200 '😀' (each 2 UTF-16 units, string length 400)
2. Validate a title of 201 '😀'

Expected:
- 200 emoji: valid, the title is stored unchanged
- 201 emoji: invalid with code 'title_too_long'

### TC-9: validation rejects due dates that are not real YYYY-MM-DD calendar dates
Kind: negative · verifies: AC-9

Preconditions:
- validation.ts is called directly
- Title is 'Write report'

Steps:
1. Validate each dueDate: '2026-02-30', '2027-02-29', '2026-13-01', '2026-00-10', '2026-11-00', '2026-11-31', 'tomorrow-ish', '2026-11-15T10:00', '2026-1-5', '20261115', ' 2026-11-15', '2026-11-15 ', '15/11/2026'

Expected:
- Each result is invalid with exactly one error { field: 'dueDate', code: 'invalid_due_date', message: 'Invalid due date' }

### TC-10: validation handles leap years correctly
Kind: edge · verifies: AC-9

Preconditions:
- validation.ts is called directly

Steps:
1. Validate dueDate '2028-02-29', '2000-02-29', '1900-02-29' and '2100-02-29'

Expected:
- '2028-02-29' and '2000-02-29' are valid and kept unchanged
- '1900-02-29' and '2100-02-29' are invalid with code 'invalid_due_date'

### TC-11: validation treats an omitted, null or empty dueDate as no due date
Kind: edge · verifies: AC-9

Preconditions:
- validation.ts is called directly

Steps:
1. Validate { title: 'Write report' }, then { title: 'Write report', dueDate: null }, then { title: 'Write report', dueDate: '' }

Expected:
- All three are valid
- The normalised dueDate is null in all three

### TC-12: validation returns both field errors when title and dueDate are invalid
Kind: negative · verifies: AC-3, AC-9

Preconditions:
- validation.ts is called directly

Steps:
1. Validate { title: '   ', dueDate: '2026-02-30' }

Expected:
- Result is invalid with exactly 2 errors: one { field: 'title', code: 'title_required' } and one { field: 'dueDate', code: 'invalid_due_date' }

### TC-13: createTask with a past due date creates an open task
Kind: unit · verifies: AC-10

Preconditions:
- New InMemoryTaskStore and service

Steps:
1. createTask({ title: 'Write report', dueDate: '2020-01-01' })

Expected:
- Returns a task with status 'open', title 'Write report' and dueDate '2020-01-01'
- id is a UUID v4 and createdAt is an ISO 8601 UTC timestamp
- listOpenTasks() contains the task

### TC-14: createTask that fails validation stores nothing
Kind: negative · verifies: AC-3, AC-4, AC-6, AC-9

Preconditions:
- New InMemoryTaskStore and service

Steps:
1. Call createTask with title '', then title '   ', then a 201-character title, then { title: 'X', dueDate: '2026-02-30' }

Expected:
- Each call returns a validation-failure result with the matching code
- listOpenTasks() returns an empty array
- The store has no tasks of any status

### TC-15: createTask with a duplicate title and due date creates separate tasks
Kind: unit · verifies: AC-11

Preconditions:
- New InMemoryTaskStore and service

Steps:
1. createTask({ title: 'Write report', dueDate: '2026-11-15' }) twice

Expected:
- The two returned tasks have different ids
- Both are open
- listOpenTasks() returns both, in insertion order

### TC-16: store assigns unique ids and a strictly increasing seq
Kind: edge · verifies: AC-11, AC-18

Preconditions:
- New InMemoryTaskStore

Steps:
1. Insert 1,000 tasks with the same title and no due date

Expected:
- All 1,000 ids are distinct UUID v4 strings
- Each seq is greater than the previous one
- findById returns each task by its id

### TC-17: markDone sets an open task to done and removes it from the open list
Kind: unit · verifies: AC-12

Preconditions:
- Service with an open task 'Write report' (id A)

Steps:
1. markDone(A)
2. listOpenTasks()

Expected:
- markDone returns the task with status 'done'; id, title, dueDate and createdAt are unchanged
- listOpenTasks() doesn't contain A

### TC-18: markDone on an already-done task succeeds and changes nothing
Kind: edge · verifies: AC-13

Preconditions:
- Service with task A already marked done

Steps:
1. markDone(A) a second time

Expected:
- Returns a success result (not not-found and not an error)
- The returned task deep-equals the result of the first markDone, with status 'done'

### TC-19: markDone with an unknown id returns not-found and changes no task
Kind: negative · verifies: AC-14

Preconditions:
- Service with open tasks A and B

Steps:
1. markDone with a random UUID, then with '', then with 'abc'

Expected:
- Each call returns a not-found result
- A and B are still open and unchanged
- listOpenTasks() still returns [A, B]

### TC-20: listOpenTasks returns every open task and no done tasks
Kind: unit · verifies: AC-15

Preconditions:
- Service with tasks T1..T5 created in order; T2 and T4 marked done

Steps:
1. listOpenTasks()

Expected:
- Returns exactly T1, T3 and T5
- No returned task has status 'done'

### TC-21: listOpenTasks sorts by due date, earliest first
Kind: unit · verifies: AC-16

Preconditions:
- Service with tasks created in order: due '2026-12-01', '2026-11-01', '2026-11-15'

Steps:
1. listOpenTasks()

Expected:
- dueDates in order: '2026-11-01', '2026-11-15', '2026-12-01'

### TC-22: compareOpenTasks orders correctly across month and year boundaries
Kind: edge · verifies: AC-16

Preconditions:
- Tasks with due dates '2027-01-01', '2026-12-31', '2026-02-01', '2025-12-31'

Steps:
1. Sort the tasks with compareOpenTasks

Expected:
- Order: '2025-12-31', '2026-02-01', '2026-12-31', '2027-01-01'

### TC-23: listOpenTasks puts tasks without a due date after all dated tasks
Kind: unit · verifies: AC-17

Preconditions:
- Service with tasks created in order: N1 (no date), D1 ('2030-01-01'), N2 (no date), D2 ('2020-01-01')

Steps:
1. listOpenTasks()

Expected:
- Order: D2, D1, N1, N2

### TC-24: listOpenTasks breaks ties in insertion order, oldest first
Kind: unit · verifies: AC-18

Preconditions:
- Service with tasks created in order: A ('2026-11-15'), X (no date), B ('2026-11-15'), Y (no date), C ('2026-11-15')

Steps:
1. listOpenTasks()

Expected:
- Order: A, B, C, X, Y

### TC-25: tie-breaking uses seq even when createdAt is identical
Kind: edge · verifies: AC-18

Preconditions:
- System time frozen (fake timers) so every task gets the same createdAt

Steps:
1. Create tasks P, Q, R with the same dueDate '2026-11-15', then S and T with no date
2. listOpenTasks()

Expected:
- All createdAt values are equal
- Order: P, Q, R, S, T

## U-2

### TC-26: POST /api/tasks creates an open task without a due date
Kind: api · verifies: AC-1

Preconditions:
- Fresh buildApp() (empty store)

Steps:
1. POST /api/tasks with content-type application/json and body { "title": "Write report" }

Expected:
- Status 201, content-type application/json
- Body has exactly the keys id, title, dueDate, status and createdAt
- id is a UUID, title 'Write report', dueDate null, status 'open', createdAt is ISO 8601 UTC
- GET /api/tasks returns this task

### TC-27: POST /api/tasks creates a task with exactly the given due date
Kind: api · verifies: AC-2

Preconditions:
- Fresh buildApp()

Steps:
1. POST /api/tasks { "title": "Write report", "dueDate": "2026-11-15" }

Expected:
- Status 201
- Body: title 'Write report', dueDate '2026-11-15', status 'open'

### TC-28: POST /api/tasks treats a null or empty dueDate as no due date
Kind: edge · verifies: AC-1

Preconditions:
- Fresh buildApp()

Steps:
1. POST /api/tasks { "title": "A", "dueDate": null }
2. POST /api/tasks { "title": "B", "dueDate": "" }

Expected:
- Both return status 201 with dueDate null

### TC-29: POST /api/tasks rejects an empty title
Kind: negative · verifies: AC-3

Preconditions:
- Fresh buildApp()

Steps:
1. POST /api/tasks { "title": "" }

Expected:
- Status 400
- Body: { error: 'validation_failed', message: <string>, errors: [{ field: 'title', code: 'title_required', message: 'Title is required' }] }
- GET /api/tasks returns { tasks: [] }

### TC-30: POST /api/tasks treats a missing title like an empty title
Kind: negative · verifies: AC-3

Preconditions:
- Fresh buildApp()

Steps:
1. POST /api/tasks {}
2. POST /api/tasks { "dueDate": "2026-11-15" }

Expected:
- Both return status 400 with error 'validation_failed' and one error with code 'title_required'
- No task is created

### TC-31: POST /api/tasks rejects a whitespace-only title
Kind: negative · verifies: AC-4

Preconditions:
- Fresh buildApp()

Steps:
1. POST /api/tasks { "title": "   " }

Expected:
- Status 400, error 'validation_failed', errors [{ field: 'title', code: 'title_required' }]
- GET /api/tasks returns { tasks: [] }

### TC-32: POST /api/tasks accepts and stores a 200-character title
Kind: edge · verifies: AC-5

Preconditions:
- Fresh buildApp()

Steps:
1. POST /api/tasks with a title of 200 'a' characters

Expected:
- Status 201
- Response title equals the 200-character input
- GET /api/tasks shows the same 200-character title

### TC-33: POST /api/tasks rejects a 201-character title
Kind: edge · verifies: AC-6

Preconditions:
- Fresh buildApp()

Steps:
1. POST /api/tasks with a title of 201 'a' characters

Expected:
- Status 400, error 'validation_failed', errors [{ field: 'title', code: 'title_too_long', message: 'Title can be at most 200 characters' }]
- No task is created

### TC-34: POST /api/tasks trims the title before storing it
Kind: api · verifies: AC-7

Preconditions:
- Fresh buildApp()

Steps:
1. POST /api/tasks { "title": "  Write report  " }

Expected:
- Status 201 with title 'Write report'
- GET /api/tasks shows title 'Write report'

### TC-35: POST /api/tasks accepts a title that is 200 characters only after trimming
Kind: edge · verifies: AC-8

Preconditions:
- Fresh buildApp()

Steps:
1. POST /api/tasks with title '     ' + 200 'a' characters + '     '

Expected:
- Status 201
- The response title has length 200 and no surrounding spaces

### TC-36: POST /api/tasks rejects invalid due dates
Kind: negative · verifies: AC-9

Preconditions:
- Fresh buildApp()

Steps:
1. POST /api/tasks { title: 'Write report', dueDate: v } for each v in '2026-02-30', '2027-02-29', '2026-13-01', 'tomorrow-ish', '2026-11-15T10:00'

Expected:
- Each returns status 400, error 'validation_failed', errors [{ field: 'dueDate', code: 'invalid_due_date', message: 'Invalid due date' }]
- GET /api/tasks returns { tasks: [] }

### TC-37: POST /api/tasks returns both field errors in one response
Kind: negative · verifies: AC-3, AC-9

Preconditions:
- Fresh buildApp()

Steps:
1. POST /api/tasks { "title": "", "dueDate": "2026-02-30" }

Expected:
- Status 400, error 'validation_failed'
- errors has exactly 2 entries: field 'title' with code 'title_required', and field 'dueDate' with code 'invalid_due_date'
- No task is created

### TC-38: POST /api/tasks accepts a due date in the past
Kind: api · verifies: AC-10

Preconditions:
- Fresh buildApp()

Steps:
1. POST /api/tasks { "title": "Old task", "dueDate": "2020-01-01" }

Expected:
- Status 201 with dueDate '2020-01-01' and status 'open'

### TC-39: POST /api/tasks with a duplicate title and due date creates two tasks
Kind: api · verifies: AC-11

Preconditions:
- Fresh buildApp()

Steps:
1. POST /api/tasks { "title": "Write report", "dueDate": "2026-11-15" } twice

Expected:
- Both return status 201 with different ids
- GET /api/tasks returns both tasks

### TC-40: POST /api/tasks rejects wrongly shaped bodies with invalid_request
Kind: negative · verifies: AC-3

Preconditions:
- Fresh buildApp()

Steps:
1. POST /api/tasks with each of: { "title": 123 }, { "title": null }, { "title": "A", "dueDate": 20261115 }, ["Write report"], "Write report", { "title": "A", "priority": 1 }

Expected:
- Each returns status 400 with a body of exactly { error: 'invalid_request', message: <string> }
- GET /api/tasks returns { tasks: [] }

### TC-41: POST /api/tasks rejects malformed or empty JSON with invalid_request
Kind: negative · verifies: AC-3

Preconditions:
- Fresh buildApp()

Steps:
1. POST /api/tasks with content-type application/json and payload '{"title":'
2. POST /api/tasks with content-type application/json and an empty payload

Expected:
- Both return status 400 with body { error: 'invalid_request', message: <string> }
- No task is created

### TC-42: POST /api/tasks doesn't let clients set id, status or createdAt
Kind: security · verifies: AC-1

Preconditions:
- Fresh buildApp()

Steps:
1. POST /api/tasks { "title": "A", "status": "done" }
2. POST /api/tasks { "title": "A", "id": "11111111-1111-4111-8111-111111111111" }
3. POST /api/tasks { "title": "A", "createdAt": "2000-01-01T00:00:00.000Z" }

Expected:
- Each returns status 400 with error 'invalid_request'
- No task is created

### TC-43: POST /api/tasks rejects non-JSON content types with 415
Kind: security · verifies: AC-3

Preconditions:
- Fresh buildApp()

Steps:
1. POST /api/tasks with content-type text/plain and payload 'Write report'
2. POST /api/tasks with content-type application/x-www-form-urlencoded and payload 'title=Write+report'

Expected:
- Both return status 415 with body exactly { error: 'invalid_request', message: <string> }
- No task is created

### TC-44: POST /api/tasks rejects titles over the schema maximum cheaply
Kind: security · verifies: AC-6

Preconditions:
- Fresh buildApp()

Steps:
1. POST /api/tasks with a title of 10,001 'a' characters
2. POST /api/tasks with a title of 10,000 'a' characters

Expected:
- 10,001 characters: status 400 with error 'invalid_request'
- 10,000 characters: status 400 with error 'validation_failed' and code 'title_too_long'
- No task is created

### TC-45: POST /api/tasks rejects bodies larger than 16 KiB
Kind: security · verifies: AC-6

Preconditions:
- Fresh buildApp()

Steps:
1. POST /api/tasks with a valid JSON body of about 20 KiB (e.g. a title of 10,000 'é' characters)

Expected:
- Status 413
- The body is JSON with no stack trace or internal details
- No task is created

### TC-46: POST /api/tasks stores HTML-like and multi-line titles verbatim
Kind: security · verifies: AC-7

Preconditions:
- Fresh buildApp()

Steps:
1. POST /api/tasks { "title": "<script>alert(1)</script>" }
2. POST /api/tasks { "title": "Line 1\nLine 2" }

Expected:
- Both return status 201 with content-type application/json
- The titles are returned unchanged and unescaped ('<script>alert(1)</script>', and 'Line 1\nLine 2' with the inner newline kept)

### TC-47: POST /api/tasks returns the contract 500 body when the store fails
Kind: negative · verifies: AC-1

Preconditions:
- buildApp({ store }) where store.insert throws Error('db exploded')

Steps:
1. POST /api/tasks { "title": "Write report" }

Expected:
- Status 500 with body exactly { error: 'internal_error', message: 'Something went wrong' }
- The body doesn't contain 'db exploded' or a stack trace

### TC-48: POST /api/tasks responds within the latency target with 1,000 open tasks
Kind: performance · verifies: AC-1

Preconditions:
- buildApp() with 1,000 open tasks seeded through POST /api/tasks

Steps:
1. Send 200 sequential POST /api/tasks requests with valid bodies and measure each server-side duration

Expected:
- All requests return status 201
- p95 latency is under 20 ms

## U-3

### TC-49: GET /api/tasks returns an empty list when there are no tasks
Kind: edge · verifies: AC-15

Preconditions:
- Fresh buildApp()

Steps:
1. GET /api/tasks

Expected:
- Status 200, content-type application/json
- Body is exactly { tasks: [] }

### TC-50: GET /api/tasks lists added tasks, including duplicates, in the Task shape
Kind: api · verifies: AC-1, AC-11

Preconditions:
- Fresh buildApp()
- POST /api/tasks { title: 'Write report' } twice, saving both 201 bodies

Steps:
1. GET /api/tasks

Expected:
- Status 200; tasks has 2 items that deep-equal the two 201 bodies, in insertion order
- Each item has exactly the keys id, title, dueDate, status and createdAt (no seq), with status 'open'

### TC-51: GET /api/tasks excludes done tasks
Kind: api · verifies: AC-15

Preconditions:
- buildApp({ store }) with an InMemoryTaskStore holding open tasks A and C and task B set to done via store.setStatus

Steps:
1. GET /api/tasks

Expected:
- Status 200; tasks contains exactly A and C
- No item has status 'done'

### TC-52: GET /api/tasks sorts by due date, puts undated tasks last, and breaks ties oldest first
Kind: api · verifies: AC-16, AC-17, AC-18

Preconditions:
- Fresh buildApp()
- Tasks added through POST in this order: 'N1' (no date), 'D-dec' ('2026-12-01'), 'D-nov1' ('2026-11-01'), 'N2' (no date), 'D-nov15a' ('2026-11-15'), 'D-nov15b' ('2026-11-15')

Steps:
1. GET /api/tasks

Expected:
- Status 200; titles in order: 'D-nov1', 'D-nov15a', 'D-nov15b', 'D-dec', 'N1', 'N2'

### TC-53: GET /api/tasks ignores query parameters and doesn't share stores between apps
Kind: edge · verifies: AC-15

Preconditions:
- App 1 from buildApp() with 1 open task and 1 done task
- App 2 from a separate buildApp() with no tasks

Steps:
1. GET /api/tasks?status=done on app 1
2. GET /api/tasks on app 2

Expected:
- App 1 returns status 200 with only the open task
- App 2 returns status 200 with { tasks: [] }

### TC-54: GET /api/tasks responds within the latency target with 1,000 open tasks
Kind: performance · verifies: AC-15, AC-16

Preconditions:
- buildApp({ store }) with 10,000 tasks: 1,000 open (mixed and null due dates) and 9,000 done

Steps:
1. Send 100 sequential GET /api/tasks requests and measure each server-side duration

Expected:
- Each response has status 200 with exactly 1,000 tasks in sort order
- p95 latency is under 50 ms

## U-4

### TC-55: POST /api/tasks/{id}/done marks an open task done and removes it from the list
Kind: api · verifies: AC-12, AC-15

Preconditions:
- Fresh buildApp()
- Tasks added: A ('2026-11-01'), B ('2026-11-15'), C ('2026-12-01')

Steps:
1. POST /api/tasks/{B.id}/done with no body
2. GET /api/tasks

Expected:
- Status 200; body is B with status 'done' and id, title, dueDate and createdAt unchanged
- GET returns [A, C] in that order

### TC-56: POST /api/tasks/{id}/done on an already-done task returns 200 unchanged
Kind: edge · verifies: AC-13

Preconditions:
- Fresh buildApp() with task A already marked done via the API

Steps:
1. POST /api/tasks/{A.id}/done again
2. Send two POST /api/tasks/{B.id}/done for a new open task B at the same time (Promise.all)

Expected:
- A's repeated call returns status 200 with a body deep-equal to the first done response
- Both concurrent calls for B return status 200 with status 'done'
- GET /api/tasks contains neither A nor B

### TC-57: POST /api/tasks/{id}/done returns 404 for an unknown id and changes nothing
Kind: negative · verifies: AC-14

Preconditions:
- Fresh buildApp() with open tasks A and B

Steps:
1. POST /api/tasks/3f1c2b9e-8d4a-4c1e-9b7a-2a6f0d1e5c33/done (a well-formed UUID that doesn't exist)
2. GET /api/tasks

Expected:
- Status 404 with body exactly { error: 'not_found', message: 'task not found' }
- GET still returns [A, B], both open

### TC-58: POST /api/tasks/{id}/done returns 404 for malformed, forged and over-long ids
Kind: security · verifies: AC-14

Preconditions:
- Fresh buildApp() with open task A

Steps:
1. POST done with each id: 'abc', 'not-a-uuid', URL-encoded "1' OR '1'='1", URL-encoded '../tasks', A.id in upper case, A.id with one character changed, and a 65-character string

Expected:
- Each returns status 404 with body exactly { error: 'not_found', message: 'task not found' }
- The body never contains other task data
- Task A is still open in GET /api/tasks

### TC-59: POST /api/tasks/{id}/done responds within the latency target with 1,000 open tasks
Kind: performance · verifies: AC-12

Preconditions:
- buildApp() with 1,000 open tasks seeded

Steps:
1. Mark 200 of them done one by one and measure each server-side duration

Expected:
- All requests return status 200 with status 'done'
- p95 latency is under 20 ms
- GET /api/tasks then returns 800 tasks

## Assumptions
- The business spec in docs/spec/business.yaml is the AC source. U-5, U-6 and U-7 are frontend units and are skipped until their designs are approved.
- Error bodies follow openapi.yaml, which uses the key `error: 'invalid_request'`. technical.md says `code: invalid_request`; I treated that as a typo.
- Cases for contract, security and performance behaviour that no single AC covers (shape errors, 415, 413, 500, latency) are linked to the closest AC of their unit, so every case carries an AC id.
- A missing `title` is a business error (`title_required`), not a shape error, as technical.md states. A title of the wrong type (number or null) is `invalid_request`.
- Most API tests check validation outcomes by `code` and `field`. Exact messages are only asserted where the contract gives them ('Title is required', 'Title can be at most 200 characters', 'Invalid due date', 'task not found', 'Something went wrong'). The wording is still an open question.
- U-3 tests seed done tasks through the `store` option of buildApp(), not the mark-done endpoint, because U-3 is built before U-4.
- Latency targets are measured server-side with app.inject on a dev machine. CI may need a looser threshold or a separate opt-in run.

## Open questions
- An id longer than 64 characters breaks the path-parameter `maxLength: 64` schema, which by default gives a 400. The contract only lists 404 and says 'Any other value results in 404'. Should a 65-character id return 404 (TC-58 assumes this) or 400 invalid_request?
- A body over 16 KiB gets Fastify's 413, which isn't in openapi.yaml. Should 413 be added to the contract, and with which body (e.g. { error: 'invalid_request', message })? TC-45 currently only checks for 413 and that no internal details leak.
- How should POST /api/tasks//done (an empty id) behave: 404 not_found, or 400 from the `minLength: 1` schema? No case covers this until it's decided.
- Should a request body sent to POST /api/tasks/{id}/done be ignored or rejected? The contract only says 'No request body'.
