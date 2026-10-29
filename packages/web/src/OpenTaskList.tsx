import type { Task } from './api/tasks';

export function OpenTaskList({ tasks }: { tasks: Task[] }) {
  return (
    <ul aria-label="Open tasks">
      {tasks.map((task) => (
        <li key={task.id}>
          {task.title}
          {task.dueDate ? (
            <>
              {' '}
              <time dateTime={task.dueDate}>Due {task.dueDate}</time>
            </>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
