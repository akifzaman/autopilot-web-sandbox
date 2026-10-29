import { useCallback, useEffect, useState } from 'react';
import { listOpenTasks, type Task } from './api/tasks';
import { AddTaskForm } from './AddTaskForm';
import { OpenTaskList } from './OpenTaskList';

type ListState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "loaded"; tasks: Task[] };

export function TasksScreen() {
  const [state, setState] = useState<ListState>({ status: "loading" });

  const [pending, setPending] = useState<ReadonlySet<string>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);

  const markDone = async (id: string) => {
    setPending((p) => new Set(p).add(id));
    setNotice(null);
    const result = await markTaskDone(id);
    setPending((p) => {
      const next = new Set(p);
      next.delete(id);
      return next;
    });
    if (result.kind === "ok" || result.kind === "not_found") {
      setState((s) =>
        s.status === "loaded"
          ? { status: "loaded", tasks: s.tasks.filter((t) => t.id !== id) }
          : s,
      );
      if (result.kind === "not_found") setNotice("Task not found");
    } else {
      setNotice("Could not mark the task done. Try again.");
    }
  };

  const load = useCallback(async (isCancelled: () => boolean) => {
    const result = await listOpenTasks();
    if (isCancelled()) return;
    setState(
      result.kind === "ok"
        ? { status: "loaded", tasks: result.tasks }
        : { status: "error" },
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    void load(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [load]);

  const retry = () => {
    setState({ status: "loading" });
    void load(() => false);
  };

  const refresh = () => {
    void load(() => false);
  };

  return (
    <>
      <h1>Tasks</h1>
      <AddTaskForm onCreated={refresh} />
      {/* U-7 adds the notice here */}
      <h2>Open tasks</h2>
      {state.status === "loading" && <p role="status">Loading tasks…</p>}
      {state.status === "error" && (
        <>
          <p role="alert">Could not load tasks.</p>
          <button type="button" onClick={retry}>
            Try again
          </button>
        </>
      )}
      {state.status === "loaded" && state.tasks.length === 0 && (
        <p>No open tasks</p>
      )}
      {state.status === "loaded" && state.tasks.length > 0 && (
        <OpenTaskList
          tasks={state.tasks}
          onMarkDone={(id) => void markDone(id)}
          pendingIds={pending}
        />
      )}
    </>
  );
}
