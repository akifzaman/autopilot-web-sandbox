import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { AddTaskForm } from './AddTaskForm';

const created = { status: 201, json: async () => ({ id: '1' }) };
const invalid = (errors: unknown[]) => ({
  status: 400,
  json: async () => ({ error: 'validation_failed', errors }),
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const body = (fetchMock: ReturnType<typeof vi.fn>) =>
  JSON.parse((fetchMock.mock.calls[0]?.[1] as { body: string }).body) as unknown;

function submit(title: string, date = '') {
  fireEvent.change(screen.getByLabelText('Title'), { target: { value: title } });
  if (date) fireEvent.change(screen.getByLabelText('Due date (optional)'), { target: { value: date } });
  fireEvent.click(screen.getByRole('button', { name: 'Add task' }));
}

it('AC-1 posts { title } without dueDate when the date is empty, then clears inputs and calls onCreated', async () => {
  const f = vi.fn().mockResolvedValue(created);
  vi.stubGlobal('fetch', f);
  const onCreated = vi.fn();
  render(<AddTaskForm onCreated={onCreated} />);
  submit('Write report');
  await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
  expect(body(f)).toEqual({ title: 'Write report' });
  expect(screen.getByLabelText('Title')).toHaveValue('');
  expect(screen.getByLabelText('Due date (optional)')).toHaveValue('');
});

it('AC-2 posts { title, dueDate: "2026-11-15" } unchanged', async () => {
  const f = vi.fn().mockResolvedValue(created);
  vi.stubGlobal('fetch', f);
  render(<AddTaskForm onCreated={vi.fn()} />);
  submit('Write report', '2026-11-15');
  await waitFor(() => expect(f).toHaveBeenCalled());
  expect(body(f)).toEqual({ title: 'Write report', dueDate: '2026-11-15' });
});

it('AC-3 AC-4 shows the server message Title is required under Title with aria-invalid/aria-describedby and keeps the values', async () => {
  const f = vi.fn().mockResolvedValue(
    invalid([{ field: 'title', code: 'title_required', message: 'Title is required' }]),
  );
  vi.stubGlobal('fetch', f);
  const onCreated = vi.fn();
  render(<AddTaskForm onCreated={onCreated} />);
  submit('   ', '2026-11-15');
  const msg = await screen.findByText('Title is required');
  const input = screen.getByLabelText('Title');
  expect(input).toHaveAttribute('aria-invalid', 'true');
  expect(input).toHaveAttribute('aria-describedby', msg.id);
  expect(input).toHaveValue('   ');
  expect(screen.getByLabelText('Due date (optional)')).toHaveValue('2026-11-15');
  expect(screen.getByLabelText('Due date (optional)')).not.toHaveAttribute('aria-invalid');
  expect(onCreated).not.toHaveBeenCalled();
});

it('AC-6 shows Title can be at most 200 characters under Title', async () => {
  const f = vi.fn().mockResolvedValue(
    invalid([{ field: 'title', code: 'title_too_long', message: 'Title can be at most 200 characters' }]),
  );
  vi.stubGlobal('fetch', f);
  render(<AddTaskForm onCreated={vi.fn()} />);
  submit('a'.repeat(201));
  expect(await screen.findByText('Title can be at most 200 characters')).toBeInTheDocument();
  expect((body(f) as { title: string }).title).toHaveLength(201);
  expect(screen.getByLabelText('Title')).toHaveValue('a'.repeat(201));
});

it('AC-9 shows Invalid due date under Due date only when field is dueDate', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      invalid([{ field: 'dueDate', code: 'invalid_due_date', message: 'Invalid due date' }]),
    ),
  );
  render(<AddTaskForm onCreated={vi.fn()} />);
  submit('Write report', '2026-11-15');
  const msg = await screen.findByText('Invalid due date');
  const date = screen.getByLabelText('Due date (optional)');
  expect(date).toHaveAttribute('aria-invalid', 'true');
  expect(date).toHaveAttribute('aria-describedby', msg.id);
  expect(screen.getByLabelText('Title')).not.toHaveAttribute('aria-invalid');
  expect(screen.getByLabelText('Title')).toHaveValue('Write report');
});

it('shows both field errors together and clears them on the next submit', async () => {
  let release: (v: unknown) => void = () => undefined;
  const f = vi
    .fn()
    .mockResolvedValueOnce(
      invalid([
        { field: 'title', code: 'title_required', message: 'Title is required' },
        { field: 'dueDate', code: 'invalid_due_date', message: 'Invalid due date' },
      ]),
    )
    .mockReturnValueOnce(new Promise((r) => (release = r)));
  vi.stubGlobal('fetch', f);
  render(<AddTaskForm onCreated={vi.fn()} />);
  submit('');
  expect(await screen.findByText('Title is required')).toBeInTheDocument();
  expect(screen.getByText('Invalid due date')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Add task' }));
  await waitFor(() => expect(screen.queryByText('Title is required')).toBeNull());
  expect(screen.getByRole('button', { name: 'Add task' })).toBeDisabled();
  release(created);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Add task' })).toBeEnabled());
});

it('shows a form-level alert on a 500 and on a rejected fetch', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 500, json: async () => ({}) }));
  const { unmount } = render(<AddTaskForm onCreated={vi.fn()} />);
  submit('x');
  expect(await screen.findByRole('alert')).toHaveTextContent('Could not add the task. Try again.');
  unmount();
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')));
  render(<AddTaskForm onCreated={vi.fn()} />);
  submit('x');
  expect(await screen.findByRole('alert')).toHaveTextContent('Could not add the task. Try again.');
});

it('does no client validation: an empty title still POSTs', async () => {
  const f = vi.fn().mockResolvedValue(created);
  vi.stubGlobal('fetch', f);
  render(<AddTaskForm onCreated={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Add task' }));
  await waitFor(() => expect(f).toHaveBeenCalledTimes(1));
  expect(body(f)).toEqual({ title: '' });
});
