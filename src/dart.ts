import type {
  Task,
  TaskCreate,
  TaskUpdate,
  DartWorkspaceConfig,
  PaginatedTasks,
} from "./types.js";

const BASE = "https://app.dartai.com/api/v0/public";

async function dartFetch<T>(
  url: string,
  options: RequestInit,
  token: string
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Dart API ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export async function getDartConfig(token: string): Promise<DartWorkspaceConfig> {
  return dartFetch<DartWorkspaceConfig>(`${BASE}/config`, {}, token);
}

export async function listTasks(
  params: Record<string, string>,
  token: string
): Promise<Task[]> {
  const tasks: Task[] = [];
  const query = new URLSearchParams({ limit: "100", ...params });
  let url: string | null = `${BASE}/tasks/list?${query}`;

  while (url) {
    const data: PaginatedTasks = await dartFetch<PaginatedTasks>(url, {}, token);
    tasks.push(...data.results);
    url = data.next;
  }
  return tasks;
}

export async function getTask(id: string, token: string): Promise<Task> {
  const data = await dartFetch<{ item: Task }>(`${BASE}/tasks/${id}`, {}, token);
  return data.item;
}

export async function createTask(payload: TaskCreate, token: string): Promise<Task> {
  const data = await dartFetch<{ item: Task }>(
    `${BASE}/tasks`,
    { method: "POST", body: JSON.stringify({ item: payload }) },
    token
  );
  return data.item;
}

export async function updateTask(
  id: string,
  payload: Omit<TaskUpdate, "id">,
  token: string
): Promise<Task> {
  const data = await dartFetch<{ item: Task }>(
    `${BASE}/tasks/${id}`,
    { method: "PUT", body: JSON.stringify({ item: { id, ...payload } }) },
    token
  );
  return data.item;
}

export async function deleteTask(id: string, token: string): Promise<Task> {
  const data = await dartFetch<{ item: Task }>(
    `${BASE}/tasks/${id}`,
    { method: "DELETE" },
    token
  );
  return data.item;
}
