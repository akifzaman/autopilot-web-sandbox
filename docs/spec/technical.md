# Technical spec

> Project `autopilot-web-sandbox` · owner: Tech Lead · draft 1 · approved when this file is merged to `main`.

## Architecture
Single npm workspace, one deployable: the Fastify API serves both `/api/*` and the built React front-end on the same port (existing `buildApp({ webDist })`).

**Front-end (packages/web, React + Vite)**
- `App` renders the single *Tasks* screen (the team's shared list; no routing is needed for v1).
- `api/tasks.ts`: a typed fetch client for the three task operations. It maps HTTP errors to typed results (`ValidationFailed` with field errors, `NotFound`, `NetworkError`).
- `AddTaskForm`: title input plus an optional native `<input type="date">`, and a submit button. It shows the field errors returned by the API next to the matching field, and keeps the entered values when an add fails.
- `OpenTaskList`: shows the open tasks in the order the server returns them, each row with a *Mark done* button. When the list is empty it shows a 'No open tasks' message instead of the list.
- State: `TasksScreen` owns the `tasks` array. On load it calls `GET /api/tasks`. After a successful add it re-fetches the list, so the new task appears where the server's sort puts it. After a successful mark-done (or a 404) it removes that task from the local array, so the remaining tasks keep their order.

**API (packages/api, Fastify)**
- `app.ts` `buildApp()` registers `tasksRoutes` under the `/api` prefix next to `/health`, and injects a `TaskStore` (option `store?: TaskStore`, default `new InMemoryTaskStore()`) so tests get a fresh store per `buildApp()`.
- `routes/tasks.ts`: the HTTP layer. It does shape checks with Fastify JSON schema (body is an object, field types, `additionalProperties: false`) and maps service results to status codes and response bodies.
- `tasks/validation.ts`: pure business validation. It trims the title, checks it is not empty, checks the length is at most 200 code points, and checks the due date is a real calendar date. It returns either a normalised `NewTask` or a list of `FieldError`s.
- `tasks/service.ts`: `createTask`, `listOpenTasks`, `markDone`, using validation and the store. Sorting is a pure comparator `compareOpenTasks` (dueDate ascending, missing dates last, then `seq` ascending).
- `tasks/store.ts`: the `TaskStore` interface (`insert`, `findById`, `listByStatus`, `setStatus`) and `InMemoryTaskStore` (a `Map<string, Task>` plus a monotonic sequence counter).

**Interactions**
1. Review: browser → `GET /api/tasks` → service → store.listByStatus('open') → sorted → `200 { tasks: Task[] }`.
2. Add: browser → `POST /api/tasks { title, dueDate? }` → schema check → validation → store.insert → `201 Task`, or `400 ValidationError`.
3. Mark done: browser → `POST /api/tasks/{id}/done` → store.findById → if open, setStatus('done') → `200 Task`; if already done, `200 Task` unchanged; if missing, `404 NotFoundError`.

Node runs request handlers on a single thread and each store operation is synchronous, so two simultaneous mark-done calls both succeed and the task ends up done once. Two simultaneous adds get distinct `seq` values in arrival order, which decides tie-breaking.

**Stack:** TypeScript (strict), Node.js, Fastify 5 API with @fastify/static, React 19 + Vite front-end, Vitest (API via app.inject, web via Testing Library/jsdom), Playwright E2E; in-memory task store behind a TaskStore interface; no new runtime dependencies.

## Components
- **buildApp (packages/api/src/app.ts)**: Creates the Fastify instance. Sets `bodyLimit`, registers `/api/health` and the task routes under `/api`, injects the `TaskStore` (default: in-memory), serves the web build, and keeps the JSON 404 for unknown `/api/*` routes.
- **Task routes (packages/api/src/routes/tasks.ts)**: HTTP layer for `GET /api/tasks`, `POST /api/tasks` and `POST /api/tasks/{id}/done`. Checks request shape with JSON schema, calls the task service, and maps results to 200/201/400/404 bodies as defined in openapi.yaml.
- **Task validation (packages/api/src/tasks/validation.ts)**: Pure functions. Trims the title (`String.prototype.trim`), rejects an empty title (`title_required`) or one longer than 200 Unicode code points (`title_too_long`), and checks `dueDate` is a real YYYY-MM-DD calendar date, leap years included (`invalid_due_date`). Returns a normalised input or all field errors.
- **Task service (packages/api/src/tasks/service.ts)**: Business operations: `createTask` (validate, then insert as open), `listOpenTasks` (filter open tasks and sort with `compareOpenTasks`), `markDone` (idempotent change from open to done, or not-found).
- **TaskStore / InMemoryTaskStore (packages/api/src/tasks/store.ts)**: Persistence interface plus the in-memory implementation. Assigns the UUID `id`, the `createdAt` timestamp and the monotonic `seq`. Ids are never reused. A fresh store is created per `buildApp()` call, so tests are isolated.
- **Tasks API client (packages/web/src/api/tasks.ts)**: Typed wrappers `listOpenTasks()`, `createTask(input)` and `markTaskDone(id)` over `fetch`. Parses `Task`, `ValidationError` and `NotFoundError` bodies into a discriminated-union result.
- **TasksScreen (packages/web/src/tasks/TasksScreen.tsx)**: Screen container rendered by `App`. Loads the open tasks, holds the list state, and connects AddTaskForm and OpenTaskList. Shows loading and load-error states.
- **AddTaskForm (packages/web/src/tasks/AddTaskForm.tsx)**: Title and optional due-date inputs with a submit button. Shows each field error message from the API next to its field, keeps the entered values when an add fails, and clears the inputs after a successful add.
- **OpenTaskList (packages/web/src/tasks/OpenTaskList.tsx)**: Renders the open tasks in server order. Shows each title as plain text and the due date, or nothing when there is none, with a Mark done button per row. Shows the 'No open tasks' message when the list is empty.

## Data model

### Task
A unit of work on the team's shared list. Stored by TaskStore; exposed by the API as the Task schema (all fields except seq).

| Field | Type | Required | Notes |
|---|---|---|---|
| id | string (UUID v4) | yes | Created by the server with `crypto.randomUUID()`. Unique and never reused. Any client-supplied id is rejected (additionalProperties: false). |
| title | string | yes | Stored after trimming. 1–200 Unicode code points (counted with `[...title].length`). Plain text, never rendered as HTML. |
| dueDate | string (YYYY-MM-DD) | null | yes | Calendar date with no time and no time zone. `null` when absent (never a placeholder date). Past dates are allowed. |
| status | enum 'open' | 'done' | yes | Always 'open' on creation. The only allowed change is open to done. Marking done again is a no-op. |
| createdAt | string (ISO 8601 date-time, UTC) | yes | Server time when the task was inserted. Informational; tie-breaks use `seq` because two adds can share the same millisecond. |
| seq | integer | yes | Internal only, not exposed by the API. Monotonic insertion counter in the store, used as the oldest-first tie-breaker for equal or missing due dates. |

### FieldError
One validation problem in a create request (API response only, not stored).

| Field | Type | Required | Notes |
|---|---|---|---|
| field | enum 'title' | 'dueDate' | yes | Which input the error belongs to, so the UI can show it next to that field. |
| code | enum 'title_required' | 'title_too_long' | 'invalid_due_date' | yes | Stable machine code. Tests and the UI rely on the code, not the wording. |
| message | string | yes | Human-readable text: 'Title is required', 'Title can be at most 200 characters', 'Invalid due date'. |

## Security
- No authentication or authorisation in v1: one shared team list, and anyone who can reach the app is a member (business assumption pending Q-1). Every route is designed so auth can be added later as a Fastify `onRequest` hook without changing the contracts.
- Input validation at two layers. JSON schema on every route: the body must be an object, `title` a string, `dueDate` a string or null, `additionalProperties: false`, so `id`, `status` and `createdAt` can't be set by clients. On top of that, business validation in `tasks/validation.ts`. Bad shapes return `400` with `code: invalid_request`. Business violations return `400` with `field` and `code` errors.
- Request size limit: Fastify `bodyLimit` of 16 KiB for the API. Before trimming, `title` is also limited by schema to `maxLength: 10000` so huge strings are rejected cheaply.
- Path parameter `id`: `maxLength: 64` in the schema. An id that is unknown, malformed or forged returns `404 task not found` and changes nothing. The 404 never reveals other data.
- XSS: titles are stored verbatim (after trimming) and rendered only as React text nodes. `dangerouslySetInnerHTML` and building HTML from task data are forbidden. A title like '<b>x</b>' shows as literal text.
- Only JSON bodies are accepted (`content-type: application/json`). Other content types get Fastify's 415.
- Error responses never include stack traces or internals. Unexpected errors return `500 { error: 'internal_error', message: 'Something went wrong' }` and are logged server-side through the Fastify logger (no `console.log`).
- No secrets are needed in v1. Config comes only from env (`PORT`, `HOST`).

## Performance
- Target size: up to 10,000 tasks in the store and up to 1,000 open tasks per list response. No pagination in v1 (see questions).
- API latency, p95 measured server-side on a dev laptop with 1,000 open tasks: `GET /api/tasks` under 50 ms, `POST /api/tasks` and `POST /api/tasks/{id}/done` under 20 ms.
- Listing is O(n log n): filter the open tasks, then sort with a pure comparator on (dueDate string ascending, null last, seq ascending). Because ISO YYYY-MM-DD strings sort lexicographically in date order, there is no Date parsing and no time-zone effect.
- `findById` and `setStatus` are O(1) via a `Map` keyed by id.
- Front-end: initial load is one `GET /api/tasks`. Mark-done updates the local list without re-fetching. Add re-fetches once to get the server's sorted position. The screen becomes interactive within 1 s on the production build served locally.
- No real-time push. Other members' changes appear on the next load, as the business spec allows.

## API contracts
Full contract: `docs/api/openapi.yaml`.
- `GET /health`: Liveness check
- `GET /tasks`: List the team's open tasks
- `POST /tasks`: Add a task
- `POST /tasks/{id}/done`: Mark a task done

## Units of work
| Unit | Title | Track | Acceptance criteria | Depends on |
|---|---|---|---|---|
| U-1 | Task domain: validation, sorting and in-memory store | backend | AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10, AC-11, AC-12, AC-13, AC-14, AC-15, AC-16, AC-17, AC-18 | — |
| U-2 | API: POST /api/tasks (add a task) | backend | AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10, AC-11 | U-1 |
| U-3 | API: GET /api/tasks (list open tasks) | backend | AC-1, AC-11, AC-15, AC-16, AC-17, AC-18 | U-1, U-2 |
| U-4 | API: POST /api/tasks/{id}/done (mark done) | backend | AC-12, AC-13, AC-14, AC-15 | U-1, U-3 |
| U-5 | Tasks screen: open-tasks list with empty state | frontend | AC-1, AC-15, AC-16, AC-17, AC-18, AC-19 | U-3 |
| U-6 | Add-task form | frontend | AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10, AC-11 | U-2, U-5 |
| U-7 | Mark task done from the list | frontend | AC-12, AC-13, AC-14, AC-15, AC-19 | U-4, U-5 |

- **U-1** Add `packages/api/src/tasks/`:
- `validation.ts`: trim the title, then return `title_required` if it is empty or `title_too_long` if it is over 200 code points. Check `dueDate` with a strict `^\d{4}-\d{2}-\d{2}$` regex plus a `Date.UTC` round-trip (leap years included) and return `invalid_due_date` if it fails. Omitted, null or '' means no date. All field errors are collected.
- `store.ts`: `TaskStore` interface and `InMemoryTaskStore` (Map, `crypto.randomUUID()`, `createdAt`, monotonic `seq`).
- `service.ts`: `createTask`, `listOpenTasks` (filter open, then sort with `compareOpenTasks`: dueDate ascending, null last, seq ascending), `markDone` (idempotent, not-found result).
Unit tests with Vitest, no HTTP.
- **U-2** Register `routes/tasks.ts` under `/api` in `buildApp()`. Add a `store?: TaskStore` option to `AppOptions` (default: new InMemoryTaskStore per app) and set `bodyLimit` to 16 KiB. Implement `POST /api/tasks` exactly as in openapi.yaml: a JSON schema for `CreateTaskRequest` (additionalProperties false). Schema failures return `400 invalid_request`. Business validation failures return `400 validation_failed` with `errors[]`. Success returns `201 Task`. Add a custom Fastify error handler so all 400/415/500 bodies match the contract. API tests use `app.inject`.
- **U-3** Implement `GET /api/tasks`, returning `200 { tasks: Task[] }` with only open tasks, in service sort order, and `tasks: []` when there are none. The response matches the `TaskList` schema (internal `seq` not exposed). API tests use `app.inject` and seed tasks through `POST /api/tasks`.
- **U-4** Implement `POST /api/tasks/{id}/done` (no body; `id` maxLength 64). Returns `200 Task` with status 'done' for an open task and also for an already-done one (no change). An unknown, malformed or forged id returns `404 { error: 'not_found', message: 'task not found' }`, and no task changes. API tests use `app.inject`, including that the task no longer appears in `GET /api/tasks`.
- **U-5** Replace the scaffold content of `App` with `TasksScreen`, following the approved design in `docs/design/tasks/`. Add the typed API client `packages/web/src/api/tasks.ts`. On load, call **GET /api/tasks** and render `OpenTaskList` in server order: title as a plain text node and the due date, or nothing when there is none. When the list is empty, show the 'No open tasks' message instead of a list or table. Show loading and load-error states. Component tests next to the components, and Playwright E2E. Update `e2e/smoke.spec.ts` if the scaffold heading or API-status line changes (see questions).
- **U-6** `AddTaskForm` on the Tasks screen, following `docs/design/tasks/`: title text input, optional `<input type="date">` and a submit button. It calls **POST /api/tasks** with `{ title, dueDate? }`, omitting dueDate when empty. On 201 it clears the inputs and re-fetches **GET /api/tasks**, so the task appears in its sorted position. On 400 `validation_failed` it shows each `errors[].message` next to its field (`title` / `dueDate`) and keeps the entered values. Nothing is added to the list. The client doesn't duplicate validation rules; the server is the source of truth. Component tests (with the API mocked) and E2E.
- **U-7** A Mark done button on each `OpenTaskList` row, with the task title in its accessible name. It calls **POST /api/tasks/{id}/done**. On 200, it removes the task from the local list without re-sorting, so the remaining order is unchanged. On 404 (a stale task already gone), it removes the row and shows a short 'Task not found' notice. The button is disabled while its request is in flight, to avoid double submits. If the list becomes empty, the 'No open tasks' state appears. Component tests and E2E.

## Assumptions
- One shared team list with no accounts or auth in v1, following the business spec assumption pending Q-1.
- Tasks are kept in an in-memory store behind a `TaskStore` interface. Data is lost when the server restarts, which is acceptable for this sandbox. A durable store can be added later without changing the API (see questions).
- Title length is counted in Unicode code points (`[...title].length`). An emoji made of several code points (for example a ZWJ family emoji) counts as several characters. Trimming uses `String.prototype.trim()`, which removes spaces, tabs, newlines and other Unicode whitespace.
- Line breaks inside a title (not at its ends) are accepted and stored as-is until Q-4 is answered. The UI uses a single-line input, so they only arrive through direct API calls.
- For `dueDate`, omitted, `null` and empty string all mean 'no due date', because HTML date inputs submit ''. Any other value must match YYYY-MM-DD exactly and be a real date. Values with a time part (e.g. 2026-11-15T10:00) are invalid.
- When both title and due date are invalid, the API returns both field errors in one response, so the member can fix everything in one go (R-14).
- A missing `title` property is treated like an empty title (`title_required`, AC-3). A `title` of the wrong type (e.g. number) is an `invalid_request` shape error.
- Mark done is `POST /api/tasks/{id}/done` rather than `PATCH /api/tasks/{id}`, because the only allowed change is open to done, and a dedicated idempotent action makes that explicit.
- `GET /api/tasks` returns only open tasks, because done tasks aren't viewable anywhere in v1 (Q-2). A `status` query parameter can be added later if Q-2 calls for a done view.
- Ties are broken by an internal insertion sequence, not by `createdAt`, so two tasks added in the same millisecond keep a deterministic oldest-first order.
- The single screen's design will be approved at `docs/design/tasks/`. The frontend units follow it.

## Open questions
- Persistence: is an in-memory store (tasks lost on server restart) acceptable for v1? Or should tasks survive restarts, for example a SQLite file through Node's built-in `node:sqlite` behind the same `TaskStore` interface, with the file path set in env?
- Size and pagination: can we assume the open list stays small (up to about 1,000 tasks), so `GET /api/tasks` returns everything without pagination?
- The scaffold's `e2e/smoke.spec.ts` checks the heading 'Autopilot Web Sandbox' and an 'API: ok' line. When the Tasks screen replaces the scaffold page, may U-5 update that test to fit the approved design, or must the heading and API-status line stay?
- Error message wording: are 'Title is required', 'Title can be at most 200 characters' and 'Invalid due date' the final user-facing texts, or will the design or BA provide copy?
- Do we need basic abuse protection (rate limiting on `POST /api/tasks`) for v1? It would add a dependency such as `@fastify/rate-limit`. Or is the app only run in trusted environments?
