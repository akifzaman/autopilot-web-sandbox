import { fileURLToPath } from 'node:url';
import { buildApp } from './app.js';

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? '0.0.0.0';
const webDist = fileURLToPath(new URL('../../web/dist', import.meta.url));

const app = buildApp({ webDist, logger: true });

app.listen({ port, host }).catch((error: unknown) => {
  app.log.error(error);
  process.exit(1);
});
