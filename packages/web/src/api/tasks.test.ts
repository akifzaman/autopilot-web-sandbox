import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTask, listOpenTasks, markTaskDone } from './tasks';

const reply = (status: number, body: unknown) => vi.fn().mockResolvedValue({ status, json: async () => body });
const task = { id: 'a b', title: 'T', dueDate: null, status: 'open', createdAt: 'x' };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('listOpenTasks', () => {
  it('maps 200 to ok in server order', async () => {
    vi.stubGlobal('fetch', reply(200, { tasks: [task, { ...task, id: 'z' }] }));
    const result = await listOpenTasks();
    expect(result.kind === 'ok' && result.tasks.map((t) => t.id)).toEqual(['a b', 'z']);
  });
  it('maps 500 to http_error', async () => {
    vi.stubGlobal('fetch', reply(500, {}));
    expect(await listOpenTasks()).toEqual({ kind: 'http_error', status: 500 });
  });
  it('maps a rejected fetch to network_error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('x')));
    expect(await listOpenTasks()).toEqual({ kind: 'network_error' });
  });
});

describe('createTask', () => {
  it('sends JSON and omits an empty dueDate', async () => {
    const fetchMock = reply(201, task);
    vi.stubGlobal('fetch', fetchMock);
    expect(await createTask({ title: 'T', dueDate: '' })).toEqual({ kind: 'ok', task });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/tasks');
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(JSON.parse(init.body as string)).toEqual({ title: 'T' });
  });
  it('sends dueDate when set', async () => {
    const fetchMock = reply(201, task);
    vi.stubGlobal('fetch', fetchMock);
    await createTask({ title: 'T', dueDate: '2026-11-15' });
    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    expect(JSON.parse(init.body as string)).toEqual({ title: 'T', dueDate: '2026-11-15' });
  });
  it('maps 400 validation_failed', async () => {
    const errors = [{ field: 'title', code: 'title_required', message: 'Title is required' }];
    vi.stubGlobal('fetch', reply(400, { error: 'validation_failed', errors }));
    expect(await createTask({ title: '' })).toEqual({ kind: 'validation_failed', errors });
  });
  it('maps 400 invalid_request to http_error', async () => {
    vi.stubGlobal('fetch', reply(400, { error: 'invalid_request' }));
    expect(await createTask({ title: 'x' })).toEqual({ kind: 'http_error', status: 400 });
  });
  it('maps a rejected fetch to network_error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('x')));
    expect(await createTask({ title: 'x' })).toEqual({ kind: 'network_error' });
  });
});

describe('markTaskDone', () => {
  it('posts to the encoded id and maps 200 to ok', async () => {
    const fetchMock = reply(200, task);
    vi.stubGlobal('fetch', fetchMock);
    expect(await markTaskDone('a b')).toEqual({ kind: 'ok', task });
    expect(fetchMock.mock.calls[0]![0]).toBe('/api/tasks/a%20b/done');
    expect((fetchMock.mock.calls[0]![1] as RequestInit).method).toBe('POST');
  });
  it('maps 404 to not_found', async () => {
    vi.stubGlobal('fetch', reply(404, {}));
    expect(await markTaskDone('x')).toEqual({ kind: 'not_found' });
  });
  it('maps 500 to http_error', async () => {
    vi.stubGlobal('fetch', reply(500, {}));
    expect(await markTaskDone('x')).toEqual({ kind: 'http_error', status: 500 });
  });
  it('maps a rejected fetch to network_error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('x')));
    expect(await markTaskDone('x')).toEqual({ kind: 'network_error' });
  });
});
