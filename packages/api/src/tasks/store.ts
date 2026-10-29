import { randomUUID } from 'node:crypto';
import type { NewTask } from './validation.js';

export type TaskStatus = 'open' | 'done';

export interface Task {
  id: string;
  title: string;
  dueDate: string | null;
  status: TaskStatus;
  createdAt: string;
  seq: number;
}

export interface TaskStore {
  insert(task: NewTask): Task;
  findById(id: string): Task | undefined;
  listByStatus(status: TaskStatus): Task[];
  setStatus(id: string, status: TaskStatus): Task | undefined;
}

export class InMemoryTaskStore implements TaskStore {
  private tasks = new Map<string, Task>();
  private nextSeq = 1;

  insert(task: NewTask): Task {
    const created: Task = {
      id: randomUUID(),
      title: task.title,
      dueDate: task.dueDate,
      status: 'open',
      createdAt: new Date().toISOString(),
      seq: this.nextSeq++,
    };
    this.tasks.set(created.id, created);
    return { ...created };
  }

  findById(id: string): Task | undefined {
    const t = this.tasks.get(id);
    return t ? { ...t } : undefined;
  }

  listByStatus(status: TaskStatus): Task[] {
    return [...this.tasks.values()].filter((t) => t.status === status).map((t) => ({ ...t }));
  }

  setStatus(id: string, status: TaskStatus): Task | undefined {
    const t = this.tasks.get(id);
    if (!t) return undefined;
    const updated: Task = { ...t, status };
    this.tasks.set(id, updated);
    return { ...updated };
  }
}
