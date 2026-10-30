export interface Task {
  id: string;
  title: string;
  dueDate: string | null;
  status: "open" | "done";
  createdAt: string;
}

export interface FieldError {
  field: "title" | "dueDate";
  code: "title_required" | "title_too_long" | "invalid_due_date";
  message: string;
}

export interface CreateTaskInput {
  title: string;
  dueDate?: string;
}

export type NetworkError = { kind: "network_error" };
export type HttpError = { kind: "http_error"; status: number };
export type ValidationFailed = {
  kind: "validation_failed";
  errors: FieldError[];
};
export type NotFound = { kind: "not_found" };

export type ListResult =
  { kind: "ok"; tasks: Task[] } | HttpError | NetworkError;
export type CreateResult =
  { kind: "ok"; task: Task } | ValidationFailed | HttpError | NetworkError;
export type MarkDoneResult =
  { kind: "ok"; task: Task } | NotFound | HttpError | NetworkError;

const networkError: NetworkError = { kind: "network_error" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function listOpenTasks(): Promise<ListResult> {
  try {
    const response = await fetch("/api/tasks");
    if (response.status !== 200)
      return { kind: "http_error", status: response.status };
    const body: unknown = await response.json();
    if (!isRecord(body) || !Array.isArray(body.tasks)) return networkError;
    return { kind: "ok", tasks: body.tasks as Task[] }; // shape is fixed by openapi.yaml TaskList
  } catch {
    return networkError;
  }
}

export async function createTask(
  input: CreateTaskInput,
): Promise<CreateResult> {
  try {
    const payload: CreateTaskInput = { title: input.title };
    if (input.dueDate) payload.dueDate = input.dueDate;
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (response.status === 201) {
      return { kind: "ok", task: (await response.json()) as Task }; // shape per openapi.yaml Task
    }
    if (response.status === 400) {
      const body: unknown = await response.json();
      if (
        isRecord(body) &&
        body.error === "validation_failed" &&
        Array.isArray(body.errors)
      ) {
        return {
          kind: "validation_failed",
          errors: body.errors as FieldError[],
        }; // shape per openapi.yaml
      }
    }
    return { kind: "http_error", status: response.status };
  } catch {
    return networkError;
  }
}

export async function markTaskDone(id: string): Promise<MarkDoneResult> {
  try {
    const response = await fetch(`/api/tasks/${encodeURIComponent(id)}/done`, {
      method: "POST",
    });
    if (response.status === 200)
      return { kind: "ok", task: (await response.json()) as Task }; // per openapi.yaml
    if (response.status === 404) return { kind: "not_found" };
    return { kind: "http_error", status: response.status };
  } catch {
    return networkError;
  }
}
