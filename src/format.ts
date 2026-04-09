import type { Task } from "./types.js";

const PRIORITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function prioritySort(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority?.toLowerCase() ?? ""] ?? 4;
    const pb = PRIORITY_ORDER[b.priority?.toLowerCase() ?? ""] ?? 4;
    return pa - pb;
  });
}

export function renderTask(task: Task): string {
  const status = `[${task.status.toUpperCase()}]`;
  const priority = task.priority ? `  ·  ${capitalize(task.priority)}` : "";
  const assignee =
    task.assignees.length > 0
      ? `  ·  @${task.assignees[0]}`
      : "  ·  unassigned";
  const tags =
    task.tags.length > 0 ? `\n  Tags: ${task.tags.join(" · ")}` : "";
  const desc =
    task.description?.trim()
      ? `\n  ${task.description.slice(0, 80)}${task.description.length > 80 ? "…" : ""}`
      : "";
  return `  ${status} ${task.title}${priority}${assignee}\n  ID: ${task.id}${tags}${desc}`;
}

export function renderTaskList(grouped: Map<string, Task[]>): string {
  const lines: string[] = [];
  let total = 0;

  for (const [space, tasks] of grouped) {
    const sorted = prioritySort(tasks);
    lines.push("──────────────");
    lines.push(`${space}  (${tasks.length} tasks)`);
    lines.push("──────────────");
    lines.push("");
    for (const task of sorted) {
      lines.push(renderTask(task));
      lines.push("");
    }
    total += tasks.length;
  }

  lines.push("──────────────");
  lines.push(
    `Total: ${total} task${total !== 1 ? "s" : ""} across ${grouped.size} space${grouped.size !== 1 ? "s" : ""}`
  );
  return lines.join("\n");
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
