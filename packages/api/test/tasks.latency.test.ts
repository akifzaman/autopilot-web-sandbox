import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { listOpenTasks } from '../src/tasks/service.js';
import { InMemoryTaskStore } from '../src/tasks/store.js';

const p95 = (durations: number[]): number => {
  const sorted = [...durations].sort((a, b) => a - b);
  return sorted[Math.ceil(0.95 * sorted.length) - 1] as number;
};

const apps: { close(): Promise<undefined> }[] = [];
afterEach(async () => {
  await Promise.all(apps.splice(0).map((a) => a.close()));
});

describe('latency with 1,000 open tasks', () => {
  it('TC-48 POST p95 is under 20 ms', { timeout: 60_000 }, async () => {
    const app = buildApp();
    apps.push(app);
    const post = (i: number) =>
      app.inject({ method: 'POST', url: '/api/tasks', payload: { title: `Task ${i}` } });
    for (let i = 0; i < 1000; i++) await post(i);
    for (let i = 0; i < 20; i++) await post(i);
    const durations: number[] = [];
    for (let i = 0; i < 200; i++) {
      const start = performance.now();
      const res = await post(i);
      durations.push(performance.now() - start);
      expect(res.statusCode).toBe(201);
    }
    expect(p95(durations)).toBeLessThan(20);
  });

  it('TC-59 POST done p95 is under 20 ms', { timeout: 60_000 }, async () => {
    const store = new InMemoryTaskStore();
    const ids: string[] = [];
    for (let i = 0; i < 1000; i++) ids.push(store.insert({ title: `Task ${i}`, dueDate: null }).id);
    const app = buildApp({ store });
    apps.push(app);
    const done = (id: string) => app.inject({ method: 'POST', url: `/api/tasks/${id}/done` });
    for (let i = 0; i < 20; i++) await app.inject({ method: 'GET', url: '/api/tasks' });
    const durations: number[] = [];
    for (const id of ids.slice(0, 200)) {
      const start = performance.now();
      const res = await done(id);
      durations.push(performance.now() - start);
      expect(res.statusCode).toBe(200);
      expect(res.json().status).toBe('done');
    }
    expect(p95(durations)).toBeLessThan(20);
    const res = await app.inject({ method: 'GET', url: '/api/tasks' });
    expect(res.json().tasks).toHaveLength(800);
  });

  it('TC-54 GET p95 is under 50 ms', { timeout: 60_000 }, async () => {
    const store = new InMemoryTaskStore();
    const ids: string[] = [];
    for (let i = 0; i < 10000; i++) {
      const dueDate = i % 3 === 0 ? null : `2026-${String((i % 12) + 1).padStart(2, '0')}-15`;
      ids.push(store.insert({ title: `Task ${i}`, dueDate }).id);
    }
    ids.slice(0, 9000).forEach((id) => store.setStatus(id, 'done'));
    const app = buildApp({ store });
    apps.push(app);
    const expected = listOpenTasks(store).map((t) => t.id);
    const get = () => app.inject({ method: 'GET', url: '/api/tasks' });
    for (let i = 0; i < 20; i++) await get();
    const durations: number[] = [];
    for (let i = 0; i < 100; i++) {
      const start = performance.now();
      const res = await get();
      durations.push(performance.now() - start);
      expect(res.statusCode).toBe(200);
      expect(res.json().tasks.map((t: { id: string }) => t.id)).toEqual(expected);
    }
    expect(expected).toHaveLength(1000);
    expect(p95(durations)).toBeLessThan(50);
  });
});
