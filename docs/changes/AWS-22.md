# Change request AWS-22

> Project `autopilot-web-sandbox` · opened by akif (BA/PO) · draft 1 · applied when this PR is merged into `sprint/1`: then the tracker is updated.

## Request
tasks also need an optional due date; overdue open tasks show in red

## Summary
AWS-22 is mostly in place already, because the optional due date shipped in Sprint 1 (AC-2, AC-9, AC-10, AC-16 to AC-18). The only new behaviour is a red highlight on overdue open tasks, which adds story S-4, rule R-15 and AC-20 to AC-22, and 4 new front-end-only tasks (design, UI test cases, code, QA) with no API change.

## Business spec
Acceptance criteria: added AC-20, AC-21, AC-22

## Impact on the plan
Remaining work 0.0 h → 1.6 h (+1.6 h), AI cost $0.0 → $1.25 (+1.25 USD): within the constraints
- ✅ Effort: needs 1.6 h · 1.6 h left of 40 h
- ✅ Time: needs 1 sprint(s) of 7 days · 6 sprint(s) until 2026-12-15
- ✅ Review: needs 0.9 h, busiest sprint 1: 0.9 h · 15.0 h per sprint
- ✅ AI cost: needs $1.25 · $19.47 left of $30

## Tasks
Tasks not listed here keep their baseline.
- ➕ N-1 Design: overdue highlight on the Tasks screen list (design, frontend, epic AWS-1, sprint 1): 0.3 h, ACs AC-20, AC-21, AC-22
- ➕ N-2 UI test cases: overdue tasks shown in red (ui_tests, frontend, epic AWS-1, sprint 1): 0.2 h, ACs AC-20, AC-21, AC-22, after N-1
- ➕ N-3 Show overdue open tasks in red in the open-task list (task, frontend, epic AWS-1, sprint 1): 0.6 h, ACs AC-20, AC-21, AC-22, after N-1, N-2
- ➕ N-4 QA: overdue tasks shown in red end to end (qa, frontend, epic AWS-1, sprint 1): 0.5 h, ACs AC-20, AC-21, AC-22, after N-2, N-3

## Assumptions
- The optional due date already exists end to end (AWS-5, AWS-7, AWS-10 are Done, with AC-2, AC-9 and AC-10), so the only new behaviour is the overdue highlight.
- Overdue is worked out in the browser from the existing dueDate field and the local date, so there is no backend work and no openapi.yaml change.
- All baseline tasks are Done, so nothing is affected or dropped; the work goes into 4 new Sprint 1 tasks under epic AWS-1 (the list).
- Estimates follow the calibration (median 1.0 AI minute, 90% under 2.7).

## Open questions
- Q-5: Is 'today' for overdue the member's local date (assumed) or one team-wide date such as UTC?
- Q-6: Should the due date only or the whole row turn red, and should there also be a text cue such as 'Overdue' for accessibility?
