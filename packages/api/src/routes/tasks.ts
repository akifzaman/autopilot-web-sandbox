import type { FastifyPluginAsync } from 'fastify';
import { createTask, listOpenTasks, markDone } from '../tasks/service.js';
import type { Task, TaskStore } from '../tasks/store.js';
import type { NewTaskInput } from '../tasks/validation.js';

export interface TaskRoutesOptions {
  store: TaskStore;
}

// `title` is deliberately not required here: a missing title must reach business
// validation and fail as title_required (technical.md, TC-30).
const createTaskBodySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: { type: 'string', maxLength: 10000 },
    dueDate: { type: ['string', 'null'] },
  },
} as const;

const notFoundBody = { error: 'not_found', message: 'task not found' } as const;

type ApiTask = Omit<Task, 'seq'>;

function toApiTask(task: Task): ApiTask {
  return {
    id: task.id,
    title: task.title,
    dueDate: task.dueDate,
    status: task.status,
    createdAt: task.createdAt,
  };
}

export const taskRoutes: FastifyPluginAsync<TaskRoutesOptions> = async (app, { store }) => {
  app.post<{ Body: NewTaskInput }>(
    '/tasks',
    { schema: { body: createTaskBodySchema } },
    async (request, reply) => {
      const result = createTask(store, request.body ?? {});
      if (!result.ok) {
        return reply.code(400).send({
          error: 'validation_failed',
          message: 'The task could not be created.',
          errors: result.errors,
        });
      }
      return reply.code(201).send(toApiTask(result.task));
    },
  );

  // No params schema on purpose: a maxLength failure would go through contractErrorHandler
  // as 400 invalid_request, but over-long ids must return 404 not_found.
  app.post<{ Params: { id: string } }>('/tasks/:id/done', async (request, reply) => {
    const { id } = request.params;
    if (id.length === 0 || id.length > 64) return reply.code(404).send(notFoundBody);
    const result = markDone(store, id);
    if (!result.ok) return reply.code(404).send(notFoundBody);
    return reply.code(200).send(toApiTask(result.task));
  });

  app.get('/tasks', async () => ({ tasks: listOpenTasks(store).map(toApiTask) }));
};
