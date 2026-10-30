# Retrospective: Sprint 1

> Project `autopilot-web-sandbox` · 2026-10-29 to 2026-11-04 · branch `sprint/1` · drafted by Hermes Autopilot (claude-opus-5-5 medium) from the tracker's metrics.

## Summary
Sprint 1 met its goal: all 17 tasks are Done, so tasks can be created, listed and marked done, and the AWS-22 and AWS-27 change requests (overdue highlight) also shipped. The +29% effort overrun (20.4 h actual against 15.9 h estimated) does not come from slow work. Two items made it: AWS-13 (1176 min, 1174 of them waiting for review) and bug AWS-21 (1083 min, 1081 waiting for review). The other 14 tasks over tolerance came in 83–99% under estimate, so both the estimates and the wall-clock way of counting review wait need fixing before Sprint 2.

## Metrics
- Tasks: 17/17 Done, bugs AWS-21
- Effort of the Done tasks: estimate 15.9 h, actual 20.4 h (+29%); AI cost $12.39
- Beyond the ±10% tolerance: AWS-3 -98%, AWS-4 -98%, AWS-5 -83%, AWS-6 -95%, AWS-7 -95%, AWS-8 -95%, AWS-9 -90%, AWS-10 -96%, AWS-11 -99%, AWS-12 -91%, AWS-13 +1408%, AWS-14 -99%, AWS-23 -91%, AWS-24 -95%, AWS-25 -93%, AWS-26 -25%
- Failed attempts by cause: defect 3, pipeline 1, review 1
- Escalated or stopped: AWS-21
- Review wait (Plan + PR review, wall clock: the PM has not set work hours): average 2.9 h, longest AWS-13 19.6 h
- Change requests: AWS-22 applied (+1.6 h), AWS-27 applied (-0.1 h)
- Re-forecast after an estimate gap: AWS-26

## Tasks
| Task | Type | Estimate (min) | Actual (min) | Gap | Review wait (min) | QA wait (min) | Failed attempts |
|---|---|---|---|---|---|---|---|
| AWS-21 TC-UI-2 and TC-UI-9 are not automated as Playwright tests named by case id, and the screen does n... | bug | 0 | 1083 | — | 1081 | 3 | 0 |
| AWS-3 Design: Tasks screen (list, add form, mark done, states) | design | 49 | 1 | -98% | 36 | 7 | 1 |
| AWS-4 UI test cases for the Tasks screen | ui_tests | 51 | 1 | -98% | 3 | 0 | 0 |
| AWS-5 Task domain: title and due-date validation | task | 54 | 9 | -83% | 8 | 6 | 0 |
| AWS-6 Task domain: TaskStore, InMemoryTaskStore and task service | task | 65 | 3 | -95% | 2 | 1 | 0 |
| AWS-7 API: POST /api/tasks and GET /api/tasks (core contract) | task | 86 | 4 | -95% | 3 | 2 | 0 |
| AWS-8 API: contract error handler, body limits and latency checks | task | 75 | 4 | -95% | 3 | 2 | 0 |
| AWS-9 Tasks screen: API client and open-task list with empty state | task | 97 | 10 | -90% | 7 | 17 | 1 |
| AWS-10 Add-task form | task | 90 | 4 | -96% | 2 | 1 | 0 |
| AWS-11 QA: create and list tasks end to end | qa | 94 | 0 | -99% | 0 | 10 | 0 |
| AWS-12 API: POST /api/tasks/{id}/done | task | 59 | 5 | -91% | 3 | 1 | 0 |
| AWS-13 Mark task done from the list | task | 78 | 1176 | +1408% | 1174 | 2 | 0 |
| AWS-14 QA: complete tasks end to end | qa | 63 | 1 | -99% | 0 | 2 | 0 |
| AWS-23 Design: overdue highlight on the Tasks screen list | design | 17 | 2 | -91% | 86 | 109 | 0 |
| AWS-24 UI test cases: overdue tasks shown in red | ui_tests | 17 | 1 | -95% | 3 | 0 | 0 |
| AWS-25 Show overdue open tasks in red in the open-task list | task | 58 | 4 | -93% | 2 | 2 | 0 |
| AWS-26 QA: overdue tasks shown in red end to end | qa | 1 | 1 | -25% | 0 | 2 | 0 |

## Went well
- Delivery: 17/17 tasks Done, and both sprint-goal flows were checked end to end by QA tasks AWS-11 and AWS-14.
- Change requests were absorbed cheaply: AWS-22 added only +1.6 h and AWS-27 -0.1 h, and the whole overdue chain (AWS-23 → AWS-24 → AWS-25 → AWS-26) was Done in the same sprint.
- Low AI cost: $12.39 for 17 tasks.
- First-pass quality was high: 15 of 17 tasks had 0 failed attempts, and the core API tasks (AWS-5 to AWS-8, AWS-12) had review and QA waits of 1–8 min.
- Re-forecasting worked: after the estimate gap, AWS-26 was re-forecast to 1 min and landed at -25%, much closer than the -90% or more on earlier tasks.

## To improve
- Estimates are far too high for AI-executed work: 14 tasks were 83–99% under (for example AWS-7 86 → 4 min and AWS-11 94 → 0 min), so the 15.9 h estimate means little.
- Review wait is counted as effort: AWS-13 (1174 of 1176 min) and AWS-21 (1081 of 1083 min) explain almost the whole +29% overrun. The wait is measured in wall-clock time because the PM has not set work hours.
- Long review queues: the average review wait was 2.9 h and the longest was AWS-13 at 19.6 h, while the work itself took minutes.
- A Definition-of-Done rule slipped through: bug AWS-21 (TC-UI-2 and TC-UI-9 not automated as Playwright tests named by case id) passed review on the Tasks screen tasks and had to be escalated.
- Failed attempts: 3 were caused by defects, 1 by the pipeline and 1 by review (AWS-3 and AWS-9 each needed a retry).
- The design task AWS-23 waited 86 min for review and 109 min for QA. That is the longest QA wait this sprint, for a 2-minute task.

## Actions
- Set team work hours and report review wait separately from effort (owner: PM): Before Sprint 2 starts, set the team's work hours so review and QA waits are counted in working time, not wall-clock time. Report actual effort without the review wait. Check: the Sprint 2 metrics show effort and review wait as separate figures. Reason: review wait made up 1174 of AWS-13's 1176 min and 1081 of AWS-21's 1083 min, which caused the +29% overrun.
- Two fixed review slots a day with a 4-hour cap (owner: PM): Book two daily slots (morning and afternoon) for Plan and PR review. Any item waiting more than 4 working hours is raised at the next stand-up. Check: in Sprint 2 the longest review wait is under 4 working hours and the average is under 1 h. Reason: the average review wait was 2.9 h, AWS-13 waited 19.6 h, AWS-21 waited 18 h and AWS-23 waited 86 min.
- Recalibrate estimates from Sprint 1 actuals (owner: Tech Lead): Update the estimating rule so the AI work time of each task type (task, design, ui_tests, qa) is based on the Sprint 1 median actual, plus a separate review allowance, instead of the current 50–97 min figures. Check: at least 70% of Sprint 2 Done tasks land within ±10% of estimate. Reason: 14 of 17 tasks were 83–99% under estimate, and only AWS-26, re-forecast to 1 min, came close.
- Automated check that every linked TC id has a named test (owner: QA): Add a CI step to `npm run lint` or `npm test` that reads the case ids in docs/tests/**/*.yaml and fails if any TC-<n> or TC-UI-<n> linked to a Done task has no test in packages/*/test, packages/web/src or e2e/ whose name contains that id. Check: the step fails on a branch where one TC-UI test is renamed. Reason: bug AWS-21 (TC-UI-2 and TC-UI-9 not automated as Playwright tests named by case id) passed review and was escalated.
- Find the cause of each failed attempt and fix the pipeline one (owner: Tech Lead): Write down the cause of each of the 5 failed attempts (3 defect, 1 pipeline, 1 review; including the retries on AWS-3 and AWS-9). Fix the pipeline failure, for example by making sure the e2e build runs before Playwright in CI. Add a pre-review checklist item for each defect type. Check: Sprint 2 has 0 pipeline-caused failed attempts and at most 1 defect-caused. Reason: 5 failed attempts in Sprint 1, 3 of them caused by defects.
