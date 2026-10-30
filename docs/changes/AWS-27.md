# Change request AWS-27

> Project `autopilot-web-sandbox` · opened by akif (BA/PO) · draft 1 · applied when this PR is merged into `sprint/1`: then the tracker is updated.

## Request
update docs/design/tasks-screen/ in place instead of a new folder; mark today as computed in the browser

## Summary
AWS-27 decides open question Q-5: "today" for the overdue highlight is the member's local calendar date, computed in the browser. It also has the overdue design (AWS-23) update docs/design/tasks-screen/ in place instead of adding a new folder. This adds AC-23 and adds it to the 4 open overdue tasks (AWS-23 to AWS-26). There are no new or dropped tasks and no API change.

## Business spec
Acceptance criteria: added AC-23

## Impact on the plan
Remaining work 1.6 h → 1.6 h (-0.1 h), AI cost $1.23 → $1.15 (-0.08 USD): within the constraints
- ✅ Effort: needs 1.6 h · 1.6 h left of 40 h
- ✅ Time: needs 1 sprint(s) of 7 days · 6 sprint(s) until 2026-12-15
- ✅ Review: needs 0.9 h, busiest sprint 1: 0.9 h · 15.0 h per sprint
- ✅ AI cost: needs $1.15 · $18.56 left of $30

## Tasks
Tasks not listed here keep their baseline.
- ✏️ AWS-23 Design: overdue highlight on the Tasks screen list: 0.3 h → 0.3 h, ACs AC-20, AC-21, AC-22, AC-23 (This task needs rework while it's in PR review. The overdue highlight must be designed in the existing Tasks screen design: update docs/design/tasks-screen/ (screen.md, fields.yaml, mockup.html, mockup.png) in place, with no new design folder. The screen spec must also state that 'today' is the browser's local calendar date (R-16, AC-23).)
- ✏️ AWS-24 UI test cases: overdue tasks shown in red: 0.2 h → 0.2 h, ACs AC-20, AC-21, AC-22, AC-23 (The UI test cases go into the existing docs/tests/ui/tasks-screen.* files. They need a case for AC-23: the browser's local date is used for 'today', not UTC. Example: the clock and time zone are set so the local date is 2026-11-10 while the UTC date is 2026-11-11 or 2026-11-09.)
- ✏️ AWS-25 Show overdue open tasks in red in the open-task list: 0.6 h → 0.6 h, ACs AC-20, AC-21, AC-22, AC-23 (Today must be computed from the browser's local date parts (getFullYear, getMonth, getDate), not from toISOString(), which gives the UTC date. Component tests need a mocked clock and time zone for AC-23. The code follows the in-place tasks-screen design. There is no API, openapi.yaml or technical.md change.)
- ✏️ AWS-26 QA: overdue tasks shown in red end to end: 0.5 h → 0.5 h, ACs AC-20, AC-21, AC-22, AC-23 (End-to-end QA must also cover AC-23. Run Playwright with a fixed clock and a time zone where the local date and the UTC date differ, and check that the red highlight follows the local date.)

## Assumptions
- The phrase 'mark today as computed in the browser' is the BA/PO's answer to Q-5. Q-5 is removed, and the decision is written down as rule R-16, a data rule and a new testable AC-23 (local date, not UTC or the server's date).
- 'Update docs/design/tasks-screen/ in place' applies to the overdue design task AWS-23. The Tasks screen was designed by AWS-3, so the overdue highlight is added to that design and not put in a new folder. The UI test cases (AWS-24) likewise extend docs/tests/ui/tasks-screen.*.
- AWS-23 is in PR review, so its open PR is reworked under the same task; no new task is needed. AWS-3 is Done but its files are only extended through AWS-23, so no rework task is needed for AWS-3.
- There's no backend work: overdue and today stay browser-only, so openapi.yaml and technical.md don't change.
- Estimates follow the calibration (median 1.0 AI minute, 90% under 2.7 min) and add a little test time for mocking the clock and time zone.

## Open questions
- Q-6 (still open): Should only the due date or the whole row turn red, and should there also be a text cue such as 'Overdue' for accessibility? The in-place design update for AWS-23 needs this answer.
