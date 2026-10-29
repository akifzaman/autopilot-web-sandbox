import { useState, type FormEvent } from 'react';
import { createTask } from './api/tasks';

type Errors = Partial<Record<'title' | 'dueDate', string>>;

export function AddTaskForm({ onCreated }: { onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [failed, setFailed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrors({});
    setFailed(false);
    setSubmitting(true);
    const result = await createTask({ title, dueDate });
    if (result.kind === 'ok') {
      setTitle('');
      setDueDate('');
      onCreated();
    } else if (result.kind === 'validation_failed') {
      const next: Errors = {};
      for (const error of result.errors) next[error.field] = error.message;
      setErrors(next);
    } else {
      setFailed(true);
    }
    setSubmitting(false);
  };

  return (
    <form aria-label="Add task" noValidate onSubmit={(e) => void onSubmit(e)}>
      <label>
        Title
        <br />
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={errors.title ? 'title-error' : undefined}
        />
      </label>
      {errors.title && (
        <p className="err" id="title-error">
          {errors.title}
        </p>
      )}
      <label>
        Due date (optional)
        <br />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          aria-invalid={errors.dueDate ? true : undefined}
          aria-describedby={errors.dueDate ? 'dueDate-error' : undefined}
        />
      </label>
      {errors.dueDate && (
        <p className="err" id="dueDate-error">
          {errors.dueDate}
        </p>
      )}
      {failed && <p role="alert">Could not add the task. Try again.</p>}
      <p>
        <button type="submit" disabled={submitting}>
          Add task
        </button>
      </p>
    </form>
  );
}
