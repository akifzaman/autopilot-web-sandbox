import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { InMemoryTaskStore } from '../src/tasks/store.js';

const apps: FastifyInstance[] = [];
function make(store?: InMemoryTaskStore): FastifyInstance {
  const app = buildApp(store ? { store } : {});
  apps.push(app);
  return app;
}
afterEach(async () => {
  await Promise.all(apps.splice(0).map((a) => a.close()));
});

const post = (app: FastifyInstance, payload: object) =>
  app.inject({ method: 'POST', url: '/api/tasks', payload });
const list = async (app: FastifyInstance) =>
  (await app.inject({ method: 'GET', url: '/api/tasks' })).json();

describe('POST /api/tasks', () => {
  it('TC-26 creates an open task without a due date', async () => {
    const app = make();
    const res = await post(app, { title: 'Write report' });
    expect(res.statusCode).toBe(201);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    const body = res.json();
    expect(Object.keys(body).sort()).toEqual(['createdAt', 'dueDate', 'id', 'status', 'title']);
    expect(body.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(body.title).toBe('Write report');
    expect(body.dueDate).toBeNull();
    expect(body.status).toBe('open');
    expect(new Date(body.createdAt).toISOString()).toBe(body.createdAt);
    expect((await list(app)).tasks).toContainEqual(body);
  });

  it('TC-27 creates a task with exactly the given due date', async () => {
    const res = await post(make(), { title: 'Write report', dueDate: '2026-11-15' });
    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({ title: 'Write report', dueDate: '2026-11-15', status: 'open' });
  });

  it('TC-28 treats a null or empty dueDate as no due date', async () => {
    const app = make();
    for (const dueDate of [null, '']) {
      const res = await post(app, { title: 'A', dueDate });
      expect(res.statusCode).toBe(201);
      expect(res.json().dueDate).toBeNull();
    }
  });

  it('TC-29 rejects an empty title', async () => {
    const app = make();
    const res = await post(app, { title: '' });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({
      error: 'validation_failed',
      message: expect.any(String),
      errors: [{ field: 'title', code: 'title_required', message: 'Title is required' }],
    });
    expect(await list(app)).toEqual({ tasks: [] });
  });

  it('TC-30 treats a missing title like an empty title', async () => {
    const app = make();
    for (const body of [{}, { dueDate: '2026-11-15' }]) {
      const res = await post(app, body);
      expect(res.statusCode).toBe(400);
      expect(res.json().error).toBe('validation_failed');
      expect(res.json().errors).toHaveLength(1);
      expect(res.json().errors[0].code).toBe('title_required');
    }
    expect(await list(app)).toEqual({ tasks: [] });
  });

  it('TC-31 rejects a whitespace-only title', async () => {
    const app = make();
    const res = await post(app, { title: '   ' });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('validation_failed');
    expect(res.json().errors).toMatchObject([{ field: 'title', code: 'title_required' }]);
    expect(await list(app)).toEqual({ tasks: [] });
  });

  it('TC-32 accepts and stores a 200-character title', async () => {
    const app = make();
    const title = 'a'.repeat(200);
    const res = await post(app, { title });
    expect(res.statusCode).toBe(201);
    expect(res.json().title).toBe(title);
    expect((await list(app)).tasks[0].title).toBe(title);
  });

  it('TC-33 rejects a 201-character title', async () => {
    const app = make();
    const res = await post(app, { title: 'a'.repeat(201) });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('validation_failed');
    expect(res.json().errors).toEqual([
      { field: 'title', code: 'title_too_long', message: 'Title can be at most 200 characters' },
    ]);
    expect(await list(app)).toEqual({ tasks: [] });
  });

  it('TC-34 trims the title before storing it', async () => {
    const app = make();
    const res = await post(app, { title: '  Write report  ' });
    expect(res.statusCode).toBe(201);
    expect(res.json().title).toBe('Write report');
    expect((await list(app)).tasks[0].title).toBe('Write report');
  });

  it('TC-35 accepts a title that is 200 characters only after trimming', async () => {
    const res = await post(make(), { title: `     ${'a'.repeat(200)}     ` });
    expect(res.statusCode).toBe(201);
    expect(res.json().title).toHaveLength(200);
    expect(res.json().title).toBe(res.json().title.trim());
  });

  it.each(['2026-02-30', '2027-02-29', '2026-13-01', 'tomorrow-ish', '2026-11-15T10:00'])(
    'TC-36 rejects invalid due date %s',
    async (dueDate) => {
      const app = make();
      const res = await post(app, { title: 'Write report', dueDate });
      expect(res.statusCode).toBe(400);
      expect(res.json().error).toBe('validation_failed');
      expect(res.json().errors).toEqual([
        { field: 'dueDate', code: 'invalid_due_date', message: 'Invalid due date' },
      ]);
      expect(await list(app)).toEqual({ tasks: [] });
    },
  );

  it('TC-37 returns both field errors in one response', async () => {
    const app = make();
    const res = await post(app, { title: '', dueDate: '2026-02-30' });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('validation_failed');
    const errors = res.json().errors as { field: string; code: string }[];
    expect(errors).toHaveLength(2);
    expect(errors).toContainEqual(expect.objectContaining({ field: 'title', code: 'title_required' }));
    expect(errors).toContainEqual(expect.objectContaining({ field: 'dueDate', code: 'invalid_due_date' }));
    expect(await list(app)).toEqual({ tasks: [] });
  });

  it('TC-38 accepts a due date in the past', async () => {
    const res = await post(make(), { title: 'Old task', dueDate: '2020-01-01' });
    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({ dueDate: '2020-01-01', status: 'open' });
  });

  it('TC-39 creates two tasks for a duplicate title and due date', async () => {
    const app = make();
    const a = await post(app, { title: 'Write report', dueDate: '2026-11-15' });
    const b = await post(app, { title: 'Write report', dueDate: '2026-11-15' });
    expect(a.statusCode).toBe(201);
    expect(b.statusCode).toBe(201);
    expect(a.json().id).not.toBe(b.json().id);
    expect((await list(app)).tasks).toHaveLength(2);
  });

  it('TC-46 stores HTML-like and multi-line titles verbatim', async () => {
    const app = make();
    for (const title of ['<script>alert(1)</script>', 'Line 1\nLine 2']) {
      const res = await post(app, { title });
      expect(res.statusCode).toBe(201);
      expect(res.headers['content-type']).toMatch(/application\/json/);
      expect(res.json().title).toBe(title);
    }
  });
});

describe('GET /api/tasks', () => {
  it('TC-49 returns an empty list when there are no tasks', async () => {
    const res = await make().inject({ method: 'GET', url: '/api/tasks' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.json()).toEqual({ tasks: [] });
  });

  it('TC-50 lists added tasks, including duplicates, in the Task shape', async () => {
    const app = make();
    const a = (await post(app, { title: 'Dup', dueDate: '2026-11-15' })).json();
    const b = (await post(app, { title: 'Dup', dueDate: '2026-11-15' })).json();
    const { tasks } = await list(app);
    expect(tasks).toEqual([a, b]);
    for (const t of tasks) {
      expect(Object.keys(t).sort()).toEqual(['createdAt', 'dueDate', 'id', 'status', 'title']);
      expect(t.status).toBe('open');
    }
  });

  it('TC-51 excludes done tasks', async () => {
    const store = new InMemoryTaskStore();
    const app = make(store);
    const a = (await post(app, { title: 'A' })).json();
    const b = (await post(app, { title: 'B' })).json();
    const c = (await post(app, { title: 'C' })).json();
    store.setStatus(b.id, 'done');
    const { tasks } = await list(app);
    expect(tasks).toEqual([a, c]);
    expect(tasks.some((t: { status: string }) => t.status === 'done')).toBe(false);
  });

  it('TC-52 sorts by due date, undated last, ties oldest first', async () => {
    const app = make();
    const items: [string, string | null][] = [
      ['N1', null],
      ['D-dec', '2026-12-01'],
      ['D-nov1', '2026-11-01'],
      ['N2', null],
      ['D-nov15a', '2026-11-15'],
      ['D-nov15b', '2026-11-15'],
    ];
    for (const [title, dueDate] of items) await post(app, { title, dueDate });
    const { tasks } = await list(app);
    expect(tasks.map((t: { title: string }) => t.title)).toEqual([
      'D-nov1',
      'D-nov15a',
      'D-nov15b',
      'D-dec',
      'N1',
      'N2',
    ]);
  });

  it('TC-53 ignores query parameters and does not share stores between apps', async () => {
    const s1 = new InMemoryTaskStore();
    const app1 = make(s1);
    const open = (await post(app1, { title: 'Open' })).json();
    const done = (await post(app1, { title: 'Done' })).json();
    s1.setStatus(done.id, 'done');
    const res = await app1.inject({ method: 'GET', url: '/api/tasks?status=done' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ tasks: [open] });
    const app2 = make();
    const res2 = await app2.inject({ method: 'GET', url: '/api/tasks' });
    expect(res2.statusCode).toBe(200);
    expect(res2.json()).toEqual({ tasks: [] });
    const app3 = make();
    await post(app2, { title: 'X' });
    expect(await list(app3)).toEqual({ tasks: [] });
  });
});

describe('POST /api/tasks/{id}/done', () => {
  const done = (app: FastifyInstance, id: string) =>
    app.inject({ method: 'POST', url: `/api/tasks/${id}/done` });
  const notFound = { error: 'not_found', message: 'task not found' };

  it('TC-55 marks an open task done and removes it from the list', async () => {
    const app = make();
    const a = (await post(app, { title: 'A' })).json();
    const b = (await post(app, { title: 'B' })).json();
    const c = (await post(app, { title: 'C' })).json();
    const res = await done(app, b.id);
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ...b, status: 'done' });
    expect((await list(app)).tasks).toEqual([a, c]);
  });

  it('TC-56 returns 200 unchanged for an already-done task, including concurrent calls', async () => {
    const app = make();
    const a = (await post(app, { title: 'A' })).json();
    const first = await done(app, a.id);
    const again = await done(app, a.id);
    expect(again.statusCode).toBe(200);
    expect(again.json()).toEqual(first.json());
    const b = (await post(app, { title: 'B' })).json();
    const both = await Promise.all([done(app, b.id), done(app, b.id)]);
    for (const res of both) {
      expect(res.statusCode).toBe(200);
      expect(res.json().status).toBe('done');
    }
    expect((await list(app)).tasks).toEqual([]);
  });

  it('TC-57 returns 404 for an unknown id and changes nothing', async () => {
    const app = make();
    const a = (await post(app, { title: 'A' })).json();
    const b = (await post(app, { title: 'B' })).json();
    const res = await done(app, '3f1c2b9e-8d4a-4c1e-9b7a-2a6f0d1e5c33');
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual(notFound);
    expect((await list(app)).tasks).toEqual([a, b]);
  });

  it('TC-58 returns 404 for malformed, forged and over-long ids', async () => {
    const app = make();
    const a = (await post(app, { title: 'A' })).json();
    const flipped = a.id.slice(0, -1) + (a.id.endsWith('0') ? '1' : '0');
    const ids = [
      'abc',
      'not-a-uuid',
      encodeURIComponent("1' OR '1'='1"),
      encodeURIComponent('../tasks'),
      a.id.toUpperCase(),
      flipped,
      'a'.repeat(65),
    ];
    for (const id of ids) {
      const res = await done(app, id);
      expect(res.statusCode).toBe(404);
      expect(res.json()).toEqual(notFound);
      expect(res.payload).not.toContain(a.id);
      expect(res.payload).not.toContain(a.title);
    }
    expect((await list(app)).tasks).toEqual([a]);
  });
});

describe('POST /api/tasks contract errors', () => {
  const raw = (app: FastifyInstance, payload: string, contentType: string) =>
    app.inject({
      method: 'POST',
      url: '/api/tasks',
      headers: { 'content-type': contentType },
      payload,
    });
  const json = (app: FastifyInstance, body: unknown) =>
    raw(app, JSON.stringify(body), 'application/json');
  const invalid = { error: 'invalid_request', message: expect.any(String) };

  it('TC-40 rejects wrongly shaped bodies with invalid_request', async () => {
    const app = make();
    const bodies = [
      { title: 123 },
      { title: null },
      { title: 'A', dueDate: 20261115 },
      ['Write report'],
      'Write report',
      { title: 'A', priority: 1 },
    ];
    for (const body of bodies) {
      const res = await json(app, body);
      expect(res.statusCode).toBe(400);
      expect(res.json()).toEqual(invalid);
    }
    expect(await list(app)).toEqual({ tasks: [] });
  });

  it('TC-41 rejects malformed or empty JSON with invalid_request', async () => {
    const app = make();
    for (const payload of ['{"title":', '']) {
      const res = await raw(app, payload, 'application/json');
      expect(res.statusCode).toBe(400);
      expect(res.json()).toEqual(invalid);
    }
    expect(await list(app)).toEqual({ tasks: [] });
  });

  it("TC-42 doesn't let clients set id, status or createdAt", async () => {
    const app = make();
    const bodies = [
      { title: 'A', status: 'done' },
      { title: 'A', id: '11111111-1111-4111-8111-111111111111' },
      { title: 'A', createdAt: '2000-01-01T00:00:00.000Z' },
    ];
    for (const body of bodies) {
      const res = await json(app, body);
      expect(res.statusCode).toBe(400);
      expect(res.json().error).toBe('invalid_request');
    }
    expect(await list(app)).toEqual({ tasks: [] });
  });

  it('TC-43 rejects non-JSON content types with 415', async () => {
    const app = make();
    for (const [payload, type] of [
      ['Write report', 'text/plain'],
      ['title=Write+report', 'application/x-www-form-urlencoded'],
    ] as const) {
      const res = await raw(app, payload, type);
      expect(res.statusCode).toBe(415);
      expect(res.json()).toEqual(invalid);
    }
    expect(await list(app)).toEqual({ tasks: [] });
  });

  it('TC-44 rejects titles over the schema maximum cheaply', async () => {
    const app = make();
    const over = await json(app, { title: 'a'.repeat(10001) });
    expect(over.statusCode).toBe(400);
    expect(over.json().error).toBe('invalid_request');
    const at = await json(app, { title: 'a'.repeat(10000) });
    expect(at.statusCode).toBe(400);
    expect(at.json().error).toBe('validation_failed');
    expect(at.json().errors[0].code).toBe('title_too_long');
    expect(await list(app)).toEqual({ tasks: [] });
  });

  it('TC-45 rejects bodies larger than 16 KiB', async () => {
    const app = make();
    const res = await json(app, { title: 'é'.repeat(10000) });
    expect(res.statusCode).toBe(413);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(Object.keys(res.json())).not.toContain('stack');
    expect(res.payload).not.toMatch(/at |FST_/);
    expect(await list(app)).toEqual({ tasks: [] });
  });

  it('TC-47 returns the contract 500 body when the store fails', async () => {
    const base = new InMemoryTaskStore();
    const failing = {
      insert: () => {
        throw new Error('db exploded');
      },
      findById: base.findById.bind(base),
      listByStatus: base.listByStatus.bind(base),
      setStatus: base.setStatus.bind(base),
    };
    const app = buildApp({ store: failing });
    apps.push(app);
    const res = await json(app, { title: 'Write report' });
    expect(res.statusCode).toBe(500);
    expect(res.json()).toEqual({ error: 'internal_error', message: 'Something went wrong' });
    expect(res.payload).not.toContain('db exploded');
    expect(res.payload).not.toContain('stack');
  });
});
