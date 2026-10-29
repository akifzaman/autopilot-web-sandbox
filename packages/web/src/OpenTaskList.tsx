import type { Task } from "./api/tasks";

interface Props {
  tasks: Task[];
  onMarkDone: (id: string) => void;
  pendingIds: ReadonlySet<string>;
}

export function OpenTaskList({ tasks, onMarkDone, pendingIds }: Props) {
  return (
    <ul aria-label="Open tasks">
      {tasks.map((task) => (
        <li key={task.id}>
          {task.title}
          {task.dueDate ? (
            <>
              {" "}
              <time dateTime={task.dueDate}>Due {task.dueDate}</time>
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
