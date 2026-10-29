import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { TasksScreen } from './TasksScreen';

const task = (id: string, title: string) => ({
  id,
  title,
  dueDate: null,
  status: 'open',
  createdAt: '2026-10-01T00:00:00.000Z',
});
const ok = (tasks: unknown[]) => ({ status: 200, json: async () => ({ tasks }) });

afterEach(() => {
  vi.unstubAllGlobals();
});

it('shows Loading tasks… while fetch is pending', () => {
  vi.stubGlobal('fetch', vi.fn(() => new Promise(() => undefined)));
  render(<TasksScreen />);
  expect(screen.getByRole('status')).toHaveTextContent('Loading tasks…');
  expect(screen.queryByRole('list')).toBeNull();
});

it('AC-19 shows No open tasks for an empty list', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok([])));
  render(<TasksScreen />);
  expect(await screen.findByText('No open tasks')).toBeInTheDocument();
  expect(screen.queryByRole('list')).toBeNull();
  expect(screen.queryByRole('table')).toBeNull();
});

it('AC-15 lists the open tasks returned by the server', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok([task('1', 'Second'), task('2', 'First')])));
  render(<TasksScreen />);
  const items = await screen.findAllByRole('listitem');
  expect(items.map((li) => li.textContent)).toEqual(['Second', 'First']);
});

it('shows a load error on a 500 and recovers with Try again', async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce({ status: 500, json: async () => ({}) })
    .mockResolvedValueOnce(ok([task('1', 'Back')]));
  vi.stubGlobal('fetch', fetchMock);
  render(<TasksScreen />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Could not load tasks.');
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByText('Back')).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

it('shows a load error when fetch rejects', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
  render(<TasksScreen />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Could not load tasks.');
});

it('TC-UI-1 keeps the form usable while the list is loading', () => {
  vi.stubGlobal('fetch', vi.fn(() => new Promise(() => undefined)));
  render(<TasksScreen />);
  expect(screen.getByRole('form', { name: 'Add task' })).toBeInTheDocument();
  expect(screen.getByLabelText('Title')).toBeEnabled();
  expect(screen.getByLabelText('Due date (optional)')).toBeEnabled();
  expect(screen.getByRole('button', { name: 'Add task' })).toBeEnabled();
});

it('AC-1 after a 201 the list is re-fetched and shows the new task', async () => {
  const f = vi
    .fn()
    .mockResolvedValueOnce(ok([]))
    .mockResolvedValueOnce({ status: 201, json: async () => task('1', 'New') })
    .mockResolvedValueOnce(ok([task('1', 'New')]));
  vi.stubGlobal('fetch', f);
  render(<TasksScreen />);
  await screen.findByText('No open tasks');
  fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'New' } });
  fireEvent.click(screen.getByRole('button', { name: 'Add task' }));
  expect(await screen.findByRole('listitem')).toHaveTextContent('New');
  expect(f.mock.calls.map((c) => (c[1] as { method?: string } | undefined)?.method ?? 'GET')).toEqual([
    'GET',
    'POST',
    'GET',
  ]);
});
