import type { FastifyPluginAsync } from 'fastify';
import { createTask, listOpenTasks } from '../tasks/service.js';
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

  app.get('/tasks', async () => ({ tasks: listOpenTasks(store).map(toApiTask) }));
};
