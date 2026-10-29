import { render, screen, within } from '@testing-library/react';
import { expect, it } from 'vitest';
import type { Task } from './api/tasks';
import { OpenTaskList } from './OpenTaskList';

const make = (id: string, title: string, dueDate: string | null): Task => ({
  id,
  title,
  dueDate,
  status: 'open',
  createdAt: '2026-10-01T00:00:00.000Z',
});

it('AC-16 AC-17 AC-18 renders rows in server order without re-sorting', () => {
  render(<OpenTaskList tasks={[make('1', 'c', '2026-12-01'), make('2', 'a', null), make('3', 'b', '2026-11-01')]} />);
  const items = screen.getAllByRole('listitem');
  expect(items.map((li) => li.textContent)).toEqual(['c Due 2026-12-01', 'a', 'b Due 2026-11-01']);
});

it('AC-1 shows the title and no due date when dueDate is null', () => {
  render(<OpenTaskList tasks={[make('1', 'Write report', null), make('2', 'Dated', '2026-11-15')]} />);
  const [plain, dated] = screen.getAllByRole('listitem') as [HTMLElement, HTMLElement];
  expect(plain.textContent).toBe('Write report');
  expect(plain.querySelector('time')).toBeNull();
  expect(within(plain).queryByText(/Due/)).toBeNull();
  const time = dated.querySelector('time');
  expect(time).toHaveTextContent('Due 2026-11-15');
  expect(time).toHaveAttribute('datetime', '2026-11-15');
});

it('renders markup in a title as literal text', () => {
  const { container } = render(<OpenTaskList tasks={[make('1', '<b>x</b>', null)]} />);
  expect(container.querySelector('b')).toBeNull();
  expect(screen.getByText('<b>x</b>')).toBeInTheDocument();
});
