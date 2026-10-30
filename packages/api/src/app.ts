import { existsSync } from 'node:fs';
import fastifyStatic from '@fastify/static';
import Fastify, { type FastifyInstance } from 'fastify';
import { contractErrorHandler } from './errors.js';
import { taskRoutes } from './routes/tasks.js';
import { InMemoryTaskStore, type TaskStore } from './tasks/store.js';

export interface AppOptions {
  /** Folder of the built front-end. When set and present, the API also serves it (one port for previews). */
  webDist?: string;
  logger?: boolean;
  /** Task storage. Defaults to a new in-memory store per app. */
  store?: TaskStore;
}

export function buildApp(options: AppOptions = {}): FastifyInstance {
  // Fastify's default Ajv coerces types and strips extra properties, which would turn
  // wrongly shaped bodies into 201s; the contract needs them rejected as 400.
  const app = Fastify({
    logger: options.logger ?? false,
    bodyLimit: 16 * 1024,
    ajv: { customOptions: { coerceTypes: false, removeAdditional: false } },
  });
  app.setErrorHandler(contractErrorHandler);
  // Fastify parses text/plain by default; the API accepts JSON only, so it answers 415.
  app.removeContentTypeParser('text/plain');
  const store = options.store ?? new InMemoryTaskStore();

  app.register(
    async (api) => {
      api.get('/health', async () => ({ status: 'ok' }));
      await api.register(taskRoutes, { store });
    },
    { prefix: '/api' },
  );

  if (options.webDist && existsSync(options.webDist)) {
    app.register(fastifyStatic, { root: options.webDist });
    // Client-side routes fall back to index.html; unknown API routes stay 404 JSON.
    app.setNotFoundHandler((request, reply) =>
      request.url.startsWith('/api/')
        ? reply.code(404).send({ error: 'not found' })
        : reply.sendFile('index.html'),
    );
  }

  return app;
}
