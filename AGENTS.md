# AGENTS.md

Instructions for AI coding agents (Hermes Autopilot reads this automatically).

## Project
A small web app to test the AIDLC pipeline.

## Commands
- Install: `npm ci`
- Lint: `npm run lint`
- Test: `npm test`
- Build: `npm run build`
- E2E / UI tests: `npm run e2e`
- Preview: `<command that serves the production build on $PORT, e.g. npm run build && PORT=$PORT npm start>`
Lint and test must pass before a commit is pushed. Run E2E when a task changes the front-end.

## Layout
- `<api source folder>` — API routes
- `<front-end source folder>` — front-end
- `<e2e folder>` — UI and end-to-end tests
- `docs/spec/business.md` — business logic spec (acceptance criteria `AC-<n>`), source of truth for behaviour
- `docs/spec/technical.md`, `docs/spec/units.yaml` — technical spec and units of work
- `docs/api/openapi.yaml` — API contracts
- `docs/tests/` — approved test cases (`TC-<n>`, UI cases `TC-UI-<n>`)
- `docs/design/<screen>/` — approved screen designs
- `docs/plan/` — baseline task breakdown

## Rules
- Implement only what the task, its acceptance criteria and its test cases ask for. No unrelated refactors.
- Every linked test case gets an automated test whose name contains the case id, e.g. `TC-12 rejects an empty title`.
- API responses must match `docs/api/openapi.yaml`. A needed contract change is a question, not a silent edit.
- Front-end screens follow their approved design in `docs/design/`.
- Never commit secrets, build output, dependency folders or test reports.
- If the spec is ambiguous, stop and ask instead of guessing.
