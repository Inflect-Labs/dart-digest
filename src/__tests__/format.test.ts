import { describe, it, expect } from "vitest";
import { prioritySort, renderTask } from "../format.js";
import type { Task } from "../types.js";

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: "abc123def456",
  htmlUrl: "https://app.dartai.com/t/abc123def456",
  title: "Test task",
  parentId: null,
  dartboard: "General/Tasks",
  type: "Task",
  status: "Doing",
  assignees: [],
  tags: [],
  priority: null,
  startAt: "",
  dueAt: "",
  size: null,
  customProperties: {},
  createdBy: "Ethan Trang",
  createdAt: "2026-04-09T00:00:00Z",
  updatedBy: "Ethan Trang",
  updatedAt: "2026-04-09T00:00:00Z",
  ...overrides,
});

describe("prioritySort", () => {
  it("sorts critical → high → medium → low → null", () => {
    const tasks = [
      makeTask({ priority: "Low" }),
      makeTask({ priority: "Critical" }),
      makeTask({ priority: null }),
      makeTask({ priority: "High" }),
      makeTask({ priority: "Medium" }),
    ];
    const sorted = prioritySort(tasks);
    expect(sorted.map((t) => t.priority)).toEqual([
      "Critical",
      "High",
      "Medium",
      "Low",
      null,
    ]);
  });

  it("does not mutate the original array", () => {
    const tasks = [makeTask({ priority: "Low" }), makeTask({ priority: "High" })];
    const copy = [...tasks];
    prioritySort(tasks);
    expect(tasks).toEqual(copy);
  });
});

describe("renderTask", () => {
  it("shows [STATUS] in uppercase", () => {
    const output = renderTask(makeTask({ status: "Backlog" }));
    expect(output).toContain("[BACKLOG]");
  });

  it("shows 'unassigned' when assignees is empty", () => {
    const output = renderTask(makeTask({ assignees: [] }));
    expect(output).toContain("unassigned");
  });

  it("shows @Name when assignee present", () => {
    const output = renderTask(makeTask({ assignees: ["Ethan Trang"] }));
    expect(output).toContain("@Ethan Trang");
    expect(output).not.toContain("unassigned");
  });

  it("shows tags joined with ·", () => {
    const output = renderTask(makeTask({ tags: ["Bug", "Feature"] }));
    expect(output).toContain("Tags: Bug · Feature");
  });

  it("truncates description at 80 chars with ellipsis", () => {
    const output = renderTask(makeTask({ description: "A".repeat(100) }));
    expect(output).toContain("A".repeat(80) + "…");
  });

  it("does not show description line when empty", () => {
    const output = renderTask(makeTask({ description: "" }));
    expect(output.split("\n").length).toBe(1);
  });

  it("shows priority when present", () => {
    const output = renderTask(makeTask({ priority: "High" }));
    expect(output).toContain("High");
  });
});
