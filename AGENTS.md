# AGENTS.md

Instructions for AI coding agents (Hermes Autopilot reads this automatically).

## Project
`autopilot-web-sandbox` is a small web application: a TypeScript API (Fastify) and a React front-end (Vite)
in one npm workspace. It exists to exercise the Hermes Autopilot AIDLC pipeline end to end: specs, task
breakdown, backend and front-end tracks, design tasks, QA play-tests.

## Commands
- Install: `npm ci`
- Lint: `npm run lint` (ESLint + TypeScript type checks of all packages)
- Test: `npm test` (Vitest in `packages/api` and `packages/web`)
- Build: `npm run build`
- E2E / UI tests: `npm run e2e` (Playwright, builds first, runs against the production build)
- Preview: `npm run build && PORT=<port> npm start` (the API serves the built front-end on the same port)
Lint and test must pass before a commit is pushed. Run E2E when a task changes the front-end.

## Layout
- `packages/api/src/app.ts` — `buildApp()`: all API routes live under `/api`
- `packages/api/test/` — API tests (Vitest, `app.inject`, no real port)
- `packages/web/src/` — React front-end; component tests next to the component (`*.test.tsx`)
- `e2e/` — Playwright UI and end-to-end tests
- `docs/spec/business.md` — business logic spec (acceptance criteria `AC-<n>`), source of truth for behaviour
- `docs/spec/technical.md`, `docs/spec/units.yaml` — technical spec and units of work
- `docs/api/openapi.yaml` — API contracts: routes, request and response shapes
- `docs/tests/` — approved test cases (`TC-<n>`, UI cases `TC-UI-<n>`)
- `docs/design/<screen>/` — approved screen designs (`screen.md`, `mockup.html`, `mockup.png`)
- `docs/plan/` — baseline task breakdown

## Rules
- Implement only what the task, its acceptance criteria and its test cases ask for. No unrelated refactors.
- Every linked test case gets an automated test whose name contains the case id, e.g.
  `it('TC-12 rejects an empty title', ...)`.
- API responses must match `docs/api/openapi.yaml`. A needed contract change is a question, not a silent edit.
- Front-end screens follow their approved design in `docs/design/`.
- TypeScript strict mode; no `any` unless a comment says why. No `console.log` in source.
- Never commit secrets, `dist/`, `node_modules/` or test reports.
- If the spec is ambiguous, stop and ask instead of guessing.
