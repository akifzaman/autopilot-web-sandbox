import type { Task, TaskStore } from './store.js';
import { validateNewTask } from './validation.js';
import type { FieldError, NewTaskInput } from './validation.js';

export type CreateTaskResult = { ok: true; task: Task } | { ok: false; errors: FieldError[] };
export type MarkDoneResult = { ok: true; task: Task } | { ok: false; error: 'not_found' };

export function compareOpenTasks(a: Task, b: Task): number {
  if (a.dueDate === b.dueDate) return a.seq - b.seq;
  if (a.dueDate === null) return 1;
  if (b.dueDate === null) return -1;
  return a.dueDate < b.dueDate ? -1 : 1;
}

export function createTask(store: TaskStore, input: NewTaskInput): CreateTaskResult {
  const result = validateNewTask(input);
  if (!result.ok) return { ok: false, errors: result.errors };
  return { ok: true, task: store.insert(result.value) };
}

export function listOpenTasks(store: TaskStore): Task[] {
  return store
    .listByStatus('open')
    .filter((t) => t.status === 'open')
    .sort(compareOpenTasks);
}

export function markDone(store: TaskStore, id: string): MarkDoneResult {
  const task = store.findById(id);
  if (!task) return { ok: false, error: 'not_found' };
  if (task.status === 'done') return { ok: true, task };
  const updated = store.setStatus(id, 'done');
  if (!updated) return { ok: false, error: 'not_found' };
  return { ok: true, task: updated };
}
