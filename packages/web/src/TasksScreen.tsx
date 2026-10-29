import { useCallback, useEffect, useState } from 'react';
import { listOpenTasks, type Task } from './api/tasks';
import { OpenTaskList } from './OpenTaskList';

type ListState = { status: 'loading' } | { status: 'error' } | { status: 'loaded'; tasks: Task[] };

export function TasksScreen() {
  const [state, setState] = useState<ListState>({ status: 'loading' });

  const load = useCallback(async (isCancelled: () => boolean) => {
    const result = await listOpenTasks();
    if (isCancelled()) return;
    setState(result.kind === 'ok' ? { status: 'loaded', tasks: result.tasks } : { status: 'error' });
  }, []);

  useEffect(() => {
    let cancelled = false;
    void load(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [load]);

  const retry = () => {
    setState({ status: 'loading' });
    void load(() => false);
  };

  return (
    <>
      <h1>Tasks</h1>
      {/* U-6 adds the Add task form and U-7 the notice here */}
      <h2>Open tasks</h2>
      {state.status === 'loading' && <p role="status">Loading tasks…</p>}
      {state.status === 'error' && (
        <div role="alert">
          <p>Could not load tasks.</p>
          <button type="button" onClick={retry}>
            Try again
          </button>
        </div>
      )}
      {state.status === 'loaded' && state.tasks.length === 0 && <p>No open tasks</p>}
      {state.status === 'loaded' && state.tasks.length > 0 && <OpenTaskList tasks={state.tasks} />}
    </>
  );
}
