# autopilot-web-sandbox

Test bed for the Hermes Autopilot AIDLC pipeline: a TypeScript API (Fastify) and a React front-end (Vite) in
one npm workspace. Features are added by the pipeline from the specs in `docs/`.

```bash
npm ci
npm run lint && npm test     # checks
npm run e2e                  # Playwright (run `npx playwright install chromium` once)
npm run build && npm start   # http://localhost:3000 (API under /api, front-end at /)
```

See `AGENTS.md` for the layout and the rules for AI agents.
