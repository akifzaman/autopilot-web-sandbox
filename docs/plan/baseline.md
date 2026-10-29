# Baseline plan

> Project `autopilot-web-sandbox` · owner: Tech Lead · draft 1 · approved when this file is merged to `main`.

## Summary
I planned 12 tasks in 2 epics, all in sprint 1: E-1 covers creating and listing tasks, and E-2 covers completing them. The estimate is about 52 AI minutes (about $9), 6.3 h of testing and 7.3 h of review, which fits the 40 h budget, the $30 AI limit and the 2026-12-15 deadline. Filtering, and editing anything other than marking a task done, are not in the approved specs, so I raised them as questions instead of planning them.

## Fit: ✅ within the constraints
12 tasks in 2 epics over 1 sprint(s): 13.9 h (AI 0.9 h · tests 5.8 h · review 7.2 h), AI cost about $9.05 at $0.174 per AI minute.
- ✅ Effort: needs 13.9 h · 40.0 h left of 40 h
- ✅ Time: needs 1 sprint(s) of 7 days · 6 sprint(s) until 2026-12-15
- ✅ Review: needs 7.2 h, busiest sprint 1: 7.2 h · 15.0 h per sprint
- ✅ AI cost: needs $9.05 · $28.81 left of $30

## Constraints (PM)
- Budget: 40 h
- Deadline: 2026-12-15
- Sprint length: 7 days
- AI cost limit: $30
- Reviewer capacity: 3 h/day

## Priorities (BA/PO)
1. creating and listing tasks
2. editing and completing
3. filtering

## Epics

### E-1: Create and list tasks
Stories S-1 and S-3: add a task with a title and an optional due date (trimming, length and calendar-date rules), and see the team's open tasks sorted by due date, with undated tasks last, ties oldest first, and an empty state. Covers the task domain (U-1), POST and GET /api/tasks (U-2, U-3), the Tasks screen design, the open-task list (U-5) and the add-task form (U-6).

| Task | Type | Track | Sprint | Units | ACs | Test cases | Depends on | AI / test / review min |
|---|---|---|---|---|---|---|---|---|
| T-1 Design: Tasks screen (list, add form, mark done, states) | design | frontend | 1 | U-5, U-6, U-7 | AC-1, AC-2, AC-3, AC-4, AC-6, AC-9, AC-12, AC-14, AC-15, AC-16, AC-17, AC-19 | — | — | 4 / 0 / 45 |
| T-2 UI test cases for the Tasks screen | ui_tests | frontend | 1 | — | AC-1, AC-2, AC-3, AC-4, AC-6, AC-9, AC-12, AC-14, AC-15, AC-16, AC-17, AC-18, AC-19 | — | T-1 | 3 / 15 / 30 (provisional) |
| T-3 Task domain: title and due-date validation | task | backend | 1 | U-1 | AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9 | TC-1, TC-2, TC-3, TC-4, TC-5, TC-6, TC-7, TC-8, TC-9, TC-10, TC-11, TC-12 | — | 4 / 20 / 30 |
| T-4 Task domain: TaskStore, InMemoryTaskStore and task service | task | backend | 1 | U-1 | AC-3, AC-4, AC-6, AC-9, AC-10, AC-11, AC-12, AC-13, AC-14, AC-15, AC-16, AC-17, AC-18 | TC-13, TC-14, TC-15, TC-16, TC-17, TC-18, TC-19, TC-20, TC-21, TC-22, TC-23, TC-24, TC-25 | T-3 | 5 / 25 / 35 |
| T-5 API: POST /api/tasks and GET /api/tasks (core contract) | task | backend | 1 | U-2, U-3 | AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10, AC-11, AC-15, AC-16, AC-17, AC-18 | TC-26, TC-27, TC-28, TC-29, TC-30, TC-31, TC-32, TC-33, TC-34, TC-35, TC-36, TC-37, TC-38, TC-39, TC-46, TC-49, TC-50, TC-51, TC-52, TC-53 | T-4 | 6 / 35 / 45 |
| T-6 API: contract error handler, body limits and latency checks | task | backend | 1 | U-2, U-3 | AC-1, AC-3, AC-6, AC-15, AC-16 | TC-40, TC-41, TC-42, TC-43, TC-44, TC-45, TC-47, TC-48, TC-54 | T-5 | 5 / 30 / 40 |
| T-7 Tasks screen: API client and open-task list with empty state | task | frontend | 1 | U-5 | AC-1, AC-15, AC-16, AC-17, AC-18, AC-19 | — | T-1, T-5 | 5 / 35 / 45 (provisional) |
| T-8 Add-task form | task | frontend | 1 | U-6 | AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10, AC-11 | — | T-1, T-5, T-7 | 5 / 35 / 45 (provisional) |
| T-9 QA: create and list tasks end to end | qa | frontend | 1 | U-5, U-6 | AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10, AC-11, AC-15, AC-16, AC-17, AC-18, AC-19 | — | T-2, T-3, T-4, T-5, T-6, T-7, T-8 | 4 / 60 / 30 |

### E-2: Complete tasks (mark done)
Story S-2: mark an open task done. Marking it again is idempotent, and an unknown id returns 'task not found'. Done tasks leave the open list. Covers POST /api/tasks/{id}/done (U-4) and the Mark done button on each list row (U-7). The domain's markDone is built in E-1 (U-1).

| Task | Type | Track | Sprint | Units | ACs | Test cases | Depends on | AI / test / review min |
|---|---|---|---|---|---|---|---|---|
| T-10 API: POST /api/tasks/{id}/done | task | backend | 1 | U-4 | AC-12, AC-13, AC-14, AC-15 | TC-55, TC-56, TC-57, TC-58, TC-59 | T-4, T-5, T-6 | 4 / 25 / 30 |
| T-11 Mark task done from the list | task | frontend | 1 | U-7 | AC-12, AC-13, AC-14, AC-15, AC-19 | — | T-1, T-7, T-10 | 4 / 30 / 35 (provisional) |
| T-12 QA: complete tasks end to end | qa | frontend | 1 | U-7 | AC-12, AC-13, AC-14, AC-15, AC-19 | — | T-2, T-10, T-11 | 3 / 40 / 20 |

## Sprints
- Sprint 1: T-1, T-2, T-3, T-4, T-5, T-6, T-7, T-8, T-9, T-10, T-11, T-12 (13.9 h, review 7.2 h)

## Risks
- Risk: the Tasks screen design (T-1) is late or rejected, which blocks all front-end work (T-7, T-8, T-11) and the UI test cases. Mitigation: start T-1 on day 1, in parallel with the backend chain T-3 to T-6, and keep it to a single screen so one review round is likely enough.
- Risk: the backend chain T-3 → T-4 → T-5 → T-6 → T-10 is sequential, so a slow review on one link pushes everything after it. Mitigation: review backend PRs first each day (reviewer capacity of 3 h/day is far above the about 7.3 h total), and keep each PR to the cases listed in the task.
- Risk: the latency test cases (TC-48, TC-54, TC-59) may be flaky on shared CI runners. Mitigation: measure server-side duration around app.inject, warm up before measuring, and if CI is noisy, ask the Tech Lead whether to tag the latency tests and run them in a separate job.
- Risk: replacing the scaffold page breaks e2e/smoke.spec.ts (the heading and 'API: ok' line), and the technical spec's question about this is still open. Mitigation: decide it in the design review (T-1), so T-7 updates the smoke test in the same PR.
- Risk: open business questions Q-1 (teams and sign-in), Q-2 (reopen or view done tasks), Q-3 (past dates) and Q-4 (multi-line titles) could change the scope after work starts. Mitigation: the plan builds the current documented assumptions; ask the BA/PO to confirm them before sprint 1 starts, and add any change as a new task, not by editing tasks that are in flight.
- Risk: the in-memory store loses tasks on restart, which can surprise people during QA play-tests. Mitigation: QA runs each check against a fresh server, and persistence (node:sqlite behind TaskStore) stays an explicit open question.

## Assumptions
- Priority 2 'editing and completing' is covered only by marking tasks done (S-2). The approved specs have no story or AC for editing a title or due date.
- Priority 3 'filtering' is explicitly out of scope in docs/spec/business.md ('Filtering, searching, or sort orders other than by due date'), so no epic or tasks are planned for it.
- U-2 and U-3 are combined in T-5 because the POST test cases check results through GET /api/tasks and the GET cases seed data through POST. U-1 is split into validation (T-3) and store/service (T-4) to keep each PR reviewable.
- There is one design for the single Tasks screen (docs/design/tasks/), covering list, add form and mark done, with one ui_tests task. It sits in E-1 because E-1 is built first.
- Estimates use the calibration data: about 1.5 to 2.8 min per coding run plus fix loops gives 3 to 6 AI min per task, about 52 AI min in total (about $9 at $0.174/min). The plan has about 380 test min and about 430 review min, roughly 14 h in total.
- All work fits in one 7-day sprint (about 7.3 h of review against 21 h of reviewer capacity), so everything is in sprint 1, ordered by priority through the dependencies. That leaves a wide buffer before the 2026-12-15 deadline.
- QA tasks are on the frontend track because they test end to end through the UI. They list only frontend units, so no task names units from the other track.
- The in-memory store, no auth and no pagination follow the technical spec's current assumptions.

## Open questions
- Priority 3 is 'filtering', but business.md lists filtering and searching as out of scope for v1, and there are no stories, ACs or contracts for it. Should it stay deferred? If not, the BA needs to add stories and ACs, and the Tech Lead needs to add a contract change (for example a query parameter on GET /api/tasks), before it can be planned.
- Priority 2 says 'editing and completing', but the specs only define marking a task done. Is editing a task's title or due date wanted in v1? If so, it needs new ACs, a PATCH contract and design updates. If not, can we treat priority 2 as mark-done only?
- May T-7 change the scaffold heading and the 'API: ok' line and update e2e/smoke.spec.ts to match the Tasks screen design, or must they stay as they are?
- Are 'Title is required', 'Title can be at most 200 characters' and 'Invalid due date' the final user-facing texts, or will design or the BA provide other copy before T-1 and T-8?
- Can the BA/PO confirm the assumptions behind Q-1 (one shared list, no sign-in), Q-2 (no reopen and no done view), Q-3 (past due dates accepted) and Q-4 (line breaks inside a title allowed) before sprint 1? Any change would add tasks.
- Is in-memory persistence acceptable for v1? A node:sqlite TaskStore would be about one more backend task (about 5 AI min, 1 h of test and review time) and still fits the budget.
- Should the latency test cases (TC-48, TC-54, TC-59) run in the normal npm test run, or in a separate job that is allowed to fail, to avoid flaky CI?
