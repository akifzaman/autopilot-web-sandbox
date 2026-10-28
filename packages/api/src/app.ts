import { existsSync } from 'node:fs';
import fastifyStatic from '@fastify/static';
import Fastify, { type FastifyInstance } from 'fastify';

export interface AppOptions {
  /** Folder of the built front-end. When set and present, the API also serves it (one port for previews). */
  webDist?: string;
  logger?: boolean;
}

export function buildApp(options: AppOptions = {}): FastifyInstance {
  const app = Fastify({ logger: options.logger ?? false });

  app.register(
    async (api) => {
      api.get('/health', async () => ({ status: 'ok' }));
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
