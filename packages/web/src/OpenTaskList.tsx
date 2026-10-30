import type { Task } from "./api/tasks";

interface Props {
  tasks: Task[];
  onMarkDone: (id: string) => void;
  pendingIds: ReadonlySet<string>;
  today?: string;
}

export function localToday(now: Date = new Date()): string {
  const y = String(now.getFullYear());
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isOverdue(dueDate: string | null, today: string): boolean {
  return dueDate !== null && dueDate < today;
}

export function OpenTaskList({ tasks, onMarkDone, pendingIds, today }: Props) {
  const todayStr = today ?? localToday();
  return (
    <ul aria-label="Open tasks">
      {tasks.map((task) => (
        <li key={task.id}>
          {task.title}
          {task.dueDate ? (
            <>
              {" "}
              {isOverdue(task.dueDate, todayStr) ? (
                <>
                  <time className="overdue" dateTime={task.dueDate}>
                    Due {task.dueDate}
                  </time>{" "}
                  <span className="tag">Overdue</span>
                </>
              ) : (
                <time dateTime={task.dueDate}>Due {task.dueDate}</time>
              )}
            </>
          ) : null}{" "}
          <button
            type="button"
            aria-label={`Mark done: ${task.title}`}
            disabled={pendingIds.has(task.id)}
            onClick={() => onMarkDone(task.id)}
          >
            Mark done
          </button>
        </li>
      ))}
    </ul>
  );
}
