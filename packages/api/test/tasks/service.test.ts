import { randomUUID } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InMemoryTaskStore } from '../../src/tasks/store.js';
import type { Task } from '../../src/tasks/store.js';
import { compareOpenTasks, createTask, listOpenTasks, markDone } from '../../src/tasks/service.js';
import type { NewTaskInput } from '../../src/tasks/validation.js';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function make(store: InMemoryTaskStore, input: NewTaskInput): Task {
  const r = createTask(store, input);
  if (!r.ok) throw new Error('create failed');
  return r.task;
}

afterEach(() => {
  vi.useRealTimers();
});

describe('task service', () => {
  it('TC-13 creates an open task with a past due date', () => {
    const store = new InMemoryTaskStore();
    const r = createTask(store, { title: 'Write report', dueDate: '2020-01-01' });
    if (!r.ok) throw new Error('expected ok');
    expect(r.task.status).toBe('open');
    expect(r.task.title).toBe('Write report');
    expect(r.task.dueDate).toBe('2020-01-01');
    expect(r.task.id).toMatch(UUID_V4);
    expect(new Date(r.task.createdAt).toISOString()).toBe(r.task.createdAt);
    expect(r.task.createdAt.endsWith('Z')).toBe(true);
    expect(listOpenTasks(store)).toEqual([r.task]);
  });

  it('TC-14 stores nothing when validation fails', () => {
    const store = new InMemoryTaskStore();
    const cases: [NewTaskInput, string][] = [
      [{ title: '' }, 'title_required'],
      [{ title: '   ' }, 'title_required'],
      [{ title: 'a'.repeat(201) }, 'title_too_long'],
      [{ title: 'X', dueDate: '2026-02-30' }, 'invalid_due_date'],
    ];
    for (const [input, code] of cases) {
      const r = createTask(store, input);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.errors[0]?.code).toBe(code);
    }
    expect(listOpenTasks(store)).toEqual([]);
    expect(store.listByStatus('open')).toEqual([]);
    expect(store.listByStatus('done')).toEqual([]);
  });

  it('TC-15 creates separate tasks for duplicate title and due date', () => {
    const store = new InMemoryTaskStore();
    const a = make(store, { title: 'Write report', dueDate: '2026-11-15' });
    const b = make(store, { title: 'Write report', dueDate: '2026-11-15' });
    expect(a.id).not.toBe(b.id);
    expect(a.status).toBe('open');
    expect(b.status).toBe('open');
    expect(listOpenTasks(store)).toEqual([a, b]);
  });

  it('TC-17 markDone sets done and removes from the open list', () => {
    const store = new InMemoryTaskStore();
    const a = make(store, { title: 'A', dueDate: '2026-11-15' });
    const r = markDone(store, a.id);
    if (!r.ok) throw new Error('expected ok');
    expect(r.task).toEqual({ ...a, status: 'done' });
    expect(listOpenTasks(store).map((t) => t.id)).not.toContain(a.id);
  });

  it('TC-18 markDone on a done task succeeds and changes nothing', () => {
    const store = new InMemoryTaskStore();
    const a = make(store, { title: 'A' });
    const first = markDone(store, a.id);
    const second = markDone(store, a.id);
    expect(second.ok).toBe(true);
    expect(second).toEqual(first);
    if (second.ok) expect(second.task.status).toBe('done');
  });

  it('TC-19 markDone with an unknown id returns not_found', () => {
    const store = new InMemoryTaskStore();
    const a = make(store, { title: 'A' });
    const b = make(store, { title: 'B' });
    for (const id of [randomUUID(), '', 'abc']) {
      expect(markDone(store, id)).toEqual({ ok: false, error: 'not_found' });
    }
    expect(store.findById(a.id)).toEqual(a);
    expect(store.findById(b.id)).toEqual(b);
    expect(listOpenTasks(store)).toEqual([a, b]);
  });

  it('TC-20 lists every open task and no done tasks', () => {
    const store = new InMemoryTaskStore();
    const t = [1, 2, 3, 4, 5].map((n) => make(store, { title: `T${n}` }));
    markDone(store, t[1]!.id);
    markDone(store, t[3]!.id);
    const open = listOpenTasks(store);
    expect(open.map((x) => x.id)).toEqual([t[0]!.id, t[2]!.id, t[4]!.id]);
    expect(open.every((x) => x.status === 'open')).toBe(true);
  });

  it('TC-21 sorts by due date, earliest first', () => {
    const store = new InMemoryTaskStore();
    make(store, { title: 'a', dueDate: '2026-12-01' });
    make(store, { title: 'b', dueDate: '2026-11-01' });
    make(store, { title: 'c', dueDate: '2026-11-15' });
    expect(listOpenTasks(store).map((t) => t.dueDate)).toEqual(['2026-11-01', '2026-11-15', '2026-12-01']);
  });

  it('TC-22 compareOpenTasks orders across month and year boundaries', () => {
    const dates = ['2027-01-01', '2026-12-31', '2026-02-01', '2025-12-31'];
    const tasks: Task[] = dates.map((dueDate, i) => ({
      id: String(i),
      title: 't',
      dueDate,
      status: 'open',
      createdAt: '2026-01-01T00:00:00.000Z',
      seq: i + 1,
    }));
    expect(tasks.sort(compareOpenTasks).map((t) => t.dueDate)).toEqual([
      '2025-12-31',
      '2026-02-01',
      '2026-12-31',
      '2027-01-01',
    ]);
  });

  it('TC-23 puts tasks without a due date after dated tasks', () => {
    const store = new InMemoryTaskStore();
    make(store, { title: 'N1' });
    make(store, { title: 'D1', dueDate: '2030-01-01' });
    make(store, { title: 'N2', dueDate: null });
    make(store, { title: 'D2', dueDate: '2020-01-01' });
    expect(listOpenTasks(store).map((t) => t.title)).toEqual(['D2', 'D1', 'N1', 'N2']);
  });

  it('TC-24 breaks ties in insertion order, oldest first', () => {
    const store = new InMemoryTaskStore();
    make(store, { title: 'A', dueDate: '2026-11-15' });
    make(store, { title: 'X' });
    make(store, { title: 'B', dueDate: '2026-11-15' });
    make(store, { title: 'Y' });
    make(store, { title: 'C', dueDate: '2026-11-15' });
    expect(listOpenTasks(store).map((t) => t.title)).toEqual(['A', 'B', 'C', 'X', 'Y']);
  });

  it('TC-25 tie-breaks by seq even when createdAt is identical', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-29T12:00:00.000Z'));
    const store = new InMemoryTaskStore();
    for (const title of ['P', 'Q', 'R']) make(store, { title, dueDate: '2026-11-15' });
    for (const title of ['S', 'T']) make(store, { title });
    const open = listOpenTasks(store);
    expect(new Set(open.map((t) => t.createdAt)).size).toBe(1);
    expect(open.map((t) => t.title)).toEqual(['P', 'Q', 'R', 'S', 'T']);
  });
});
