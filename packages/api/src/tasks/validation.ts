export type FieldErrorCode = 'title_required' | 'title_too_long' | 'invalid_due_date';

export interface FieldError {
  field: 'title' | 'dueDate';
  code: FieldErrorCode;
  message: string;
}

export interface NewTaskInput {
  title?: string;
  dueDate?: string | null;
}

export interface NewTask {
  title: string;
  dueDate: string | null;
}

export type ValidationResult = { ok: true; value: NewTask } | { ok: false; errors: FieldError[] };

export const MAX_TITLE_LENGTH = 200;

export const ERROR_MESSAGES: Record<FieldErrorCode, string> = {
  title_required: 'Title is required',
  title_too_long: 'Title can be at most 200 characters',
  invalid_due_date: 'Invalid due date',
};

export function isValidCalendarDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const y = Number(s.slice(0, 4));
  const m = Number(s.slice(5, 7));
  const d = Number(s.slice(8, 10));
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

export function validateNewTask(input: NewTaskInput): ValidationResult {
  const errors: FieldError[] = [];
  const title = (input.title ?? '').trim();
  if (title === '') {
    errors.push({ field: 'title', code: 'title_required', message: ERROR_MESSAGES.title_required });
  } else if ([...title].length > MAX_TITLE_LENGTH) {
    errors.push({ field: 'title', code: 'title_too_long', message: ERROR_MESSAGES.title_too_long });
  }

  const raw = input.dueDate;
  const dueDate = raw === undefined || raw === null || raw === '' ? null : raw;
  if (dueDate !== null && !isValidCalendarDate(dueDate)) {
    errors.push({ field: 'dueDate', code: 'invalid_due_date', message: ERROR_MESSAGES.invalid_due_date });
  }

  return errors.length > 0 ? { ok: false, errors } : { ok: true, value: { title, dueDate } };
}
