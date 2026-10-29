import { describe, expect, it } from 'vitest';
import { InMemoryTaskStore } from '../../src/tasks/store.js';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('InMemoryTaskStore', () => {
  it('TC-16 assigns unique ids and a strictly increasing seq', () => {
    const store = new InMemoryTaskStore();
    const tasks = Array.from({ length: 1000 }, () => store.insert({ title: 'Same', dueDate: null }));
    expect(new Set(tasks.map((t) => t.id)).size).toBe(1000);
    tasks.forEach((t, i) => {
      expect(t.id).toMatch(UUID_V4);
      if (i > 0) expect(t.seq).toBeGreaterThan(tasks[i - 1]!.seq);
      expect(store.findById(t.id)).toEqual(t);
    });
  });
});
