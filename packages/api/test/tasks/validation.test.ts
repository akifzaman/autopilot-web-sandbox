import { describe, expect, it } from 'vitest';
import { validateNewTask } from '../../src/tasks/validation.js';

const titleError = (code: string, message: string) => [{ field: 'title', code, message }];
const dueError = [{ field: 'dueDate', code: 'invalid_due_date', message: 'Invalid due date' }];

function errorsOf(input: Parameters<typeof validateNewTask>[0]) {
  const r = validateNewTask(input);
  return r.ok ? null : r.errors;
}

function valueOf(input: Parameters<typeof validateNewTask>[0]) {
  const r = validateNewTask(input);
  return r.ok ? r.value : null;
}

describe('validateNewTask', () => {
  it('TC-1 trims surrounding whitespace from the title', () => {
    expect(valueOf({ title: '  Write report  ' })).toEqual({ title: 'Write report', dueDate: null });
  });

  it('TC-2 trims tabs, newlines and Unicode whitespace', () => {
    for (const title of ['\tWrite report\n', ' Write report　', '\r\n Write report \r\n']) {
      expect(valueOf({ title })?.title).toBe('Write report');
    }
  });

  it('TC-3 rejects an empty title with title_required', () => {
    expect(errorsOf({ title: '' })).toEqual(titleError('title_required', 'Title is required'));
  });

  it('TC-4 rejects a whitespace-only title with title_required', () => {
    for (const title of ['   ', '\t\n ', ' 　']) {
      const errors = errorsOf({ title });
      expect(errors).toHaveLength(1);
      expect(errors?.[0]).toMatchObject({ field: 'title', code: 'title_required' });
    }
  });

  it('TC-5 accepts a 200-character title and keeps it whole', () => {
    const title = 'a'.repeat(200);
    expect(valueOf({ title })?.title).toBe(title);
  });

  it('TC-6 rejects a 201-character title with title_too_long', () => {
    expect(errorsOf({ title: 'a'.repeat(201) })).toEqual(
      titleError('title_too_long', 'Title can be at most 200 characters'),
    );
  });

  it('TC-7 applies the 200 limit after trimming', () => {
    const t = 'a'.repeat(200);
    expect(valueOf({ title: `     ${t}     ` })?.title).toBe(t);
  });

  it('TC-8 counts title length in Unicode code points', () => {
    const ok = '😀'.repeat(200);
    expect(ok.length).toBe(400);
    expect(valueOf({ title: ok })?.title).toBe(ok);
    expect(errorsOf({ title: '😀'.repeat(201) })?.[0]?.code).toBe('title_too_long');
  });

  it('TC-9 rejects due dates that are not real YYYY-MM-DD dates', () => {
    const bad = [
      '2026-02-30', '2027-02-29', '2026-13-01', '2026-00-10', '2026-11-00', '2026-11-31',
      'tomorrow-ish', '2026-11-15T10:00', '2026-1-5', '20261115', ' 2026-11-15', '2026-11-15 ',
      '15/11/2026',
    ];
    for (const dueDate of bad) {
      expect(errorsOf({ title: 'Write report', dueDate })).toEqual(dueError);
    }
  });

  it('TC-10 handles leap years correctly', () => {
    for (const dueDate of ['2028-02-29', '2000-02-29']) {
      expect(valueOf({ title: 'x', dueDate })?.dueDate).toBe(dueDate);
    }
    for (const dueDate of ['1900-02-29', '2100-02-29']) {
      expect(errorsOf({ title: 'x', dueDate })?.[0]?.code).toBe('invalid_due_date');
    }
  });

  it('TC-11 treats omitted, null or empty dueDate as no due date', () => {
    for (const input of [
      { title: 'Write report' },
      { title: 'Write report', dueDate: null },
      { title: 'Write report', dueDate: '' },
    ]) {
      expect(valueOf(input)).toEqual({ title: 'Write report', dueDate: null });
    }
  });

  it('TC-12 returns both field errors when title and dueDate are invalid', () => {
    const errors = errorsOf({ title: '   ', dueDate: '2026-02-30' });
    expect(errors).toHaveLength(2);
    expect(errors).toContainEqual(expect.objectContaining({ field: 'title', code: 'title_required' }));
    expect(errors).toContainEqual(expect.objectContaining({ field: 'dueDate', code: 'invalid_due_date' }));
  });
});
