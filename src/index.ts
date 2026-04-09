import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { Command } from "commander";
import { confirm } from "@inquirer/prompts";
import {
  loadEnv,
  requireEnv,
  loadConfig,
  matchSpace,
  copyToClipboard,
} from "./config.js";
import { listTasks, createTask, updateTask, deleteTask } from "./dart.js";
import { renderTaskList, renderTask } from "./format.js";
import { runSetup, addSpaces, removeSpaces } from "./setup.js";
import { checkForUpdate, uninstall } from "./update.js";
import type { Task, TaskCreate, TaskUpdate } from "./types.js";

loadEnv();

const __dirname = dirname(fileURLToPath(import.meta.url));
const { version } = JSON.parse(
  readFileSync(join(__dirname, "../package.json"), "utf-8")
) as { version: string };

const program = new Command();

program
  .name("dtd")
  .description("Dart AI task management CLI")
  .version(version);

// ── setup ──────────────────────────────────────────────────────────────────
program
  .command("setup")
  .description("Configure API key and tracked spaces")
  .action(async () => {
    await runSetup();
  });

// ── list ───────────────────────────────────────────────────────────────────
program
  .command("list")
  .description("List tasks from tracked spaces")
  .option("--space <name>", "Filter by space (partial match)")
  .option("--assignee <name>", "Filter by assignee name or email")
  .option("--status <status>", "Filter by status (backlog, todo, doing, done)")
  .option("--priority <priority>", "Filter by priority (critical, high, medium, low)")
  .option("--tag <tag>", "Filter by tag")
  .option("--no-copy", "Skip clipboard copy")
  .action(async (opts) => {
    const token = requireEnv("DART_API_KEY");
    const config = loadConfig();

    // Resolve spaces to query
    let spaces = config.spaces;
    if (opts.space) {
      const matched = matchSpace(spaces, opts.space as string);
      if (!matched) {
        console.error(
          `Space not found: "${opts.space}". Tracked: ${spaces.join(", ")}`
        );
        process.exit(1);
      }
      spaces = [matched];
    }

    // Build filter params
    const params: Record<string, string> = {};
    if (opts.assignee) params.assignee = opts.assignee as string;
    if (opts.status) params.status = opts.status as string;
    if (opts.priority) params.priority = opts.priority as string;
    if (opts.tag) params.tag = opts.tag as string;

    // Fetch per space
    const grouped = new Map<string, Task[]>();
    for (const space of spaces) {
      const tasks = await listTasks({ dartboard: space, ...params }, token);
      if (tasks.length > 0) grouped.set(space, tasks);
    }

    if (grouped.size === 0) {
      console.log("No tasks found.");
      return;
    }

    const output = renderTaskList(grouped);
    console.log(output);

    if (opts.copy) {
      const copied = copyToClipboard(output);
      if (copied) console.log("\n(copied to clipboard)");
    }
  });

// ── create ─────────────────────────────────────────────────────────────────
const collectTags = (val: string, prev: string[]) => [...prev, val];

program
  .command("create")
  .description("Create a new task")
  .requiredOption("--title <title>", "Task title")
  .option("--space <name>", "Dartboard (partial match against tracked spaces)")
  .option("--status <status>", "Status (backlog, doing, done)")
  .option("--priority <priority>", "Priority (critical, high, medium, low)")
  .option("--tag <tag>", "Tag (repeatable: --tag bug --tag feature)", collectTags, [] as string[])
  .option("--assignee <name>", "Assignee name or email")
  .option("--description <text>", "Task description")
  .option("--size <size>", "Size (xs, small, medium, large, xl)")
  .option("--due <date>", "Due date YYYY-MM-DD")
  .action(async (opts) => {
    const token = requireEnv("DART_API_KEY");
    const config = loadConfig();

    // Resolve dartboard
    let dartboard: string;
    if (opts.space) {
      const matched = matchSpace(config.spaces, opts.space as string);
      if (!matched) {
        console.error(
          `Space not found: "${opts.space}". Tracked: ${config.spaces.join(", ")}`
        );
        process.exit(1);
      }
      dartboard = matched;
    } else if (config.spaces.length > 0) {
      dartboard = config.spaces[0];
    } else {
      console.error("No spaces configured. Use --space or run: dtd spaces add");
      process.exit(1);
    }

    const payload: TaskCreate = {
      title: opts.title as string,
      dartboard,
      ...(opts.status && { status: opts.status as string }),
      ...(opts.priority && { priority: opts.priority as string }),
      ...((opts.tag as string[]).length > 0 && { tags: opts.tag as string[] }),
      ...(opts.assignee && { assignees: [opts.assignee as string] }),
      ...(opts.description && { description: opts.description as string }),
      ...(opts.size && { size: opts.size as string }),
      ...(opts.due && { dueAt: opts.due as string }),
    };

    const task = await createTask(payload, token);
    console.log("\nCreated:\n");
    console.log(renderTask(task));
    console.log();
  });

// ── update ─────────────────────────────────────────────────────────────────
program
  .command("update <id>")
  .description("Update an existing task")
  .option("--title <title>", "New title")
  .option("--status <status>", "New status")
  .option("--priority <priority>", "New priority")
  .option("--tag <tag>", "Replace tags (repeatable)", collectTags, [] as string[])
  .option("--assignee <name>", "New assignee name or email")
  .option("--description <text>", "New description")
  .option("--size <size>", "New size")
  .option("--due <date>", "New due date YYYY-MM-DD")
  .action(async (id: string, opts) => {
    const token = requireEnv("DART_API_KEY");

    const payload: Omit<TaskUpdate, "id"> = {
      ...(opts.title && { title: opts.title as string }),
      ...(opts.status && { status: opts.status as string }),
      ...(opts.priority && { priority: opts.priority as string }),
      ...((opts.tag as string[]).length > 0 && { tags: opts.tag as string[] }),
      ...(opts.assignee && { assignees: [opts.assignee as string] }),
      ...(opts.description && { description: opts.description as string }),
      ...(opts.size && { size: opts.size as string }),
      ...(opts.due && { dueAt: opts.due as string }),
    };

    if (Object.keys(payload).length === 0) {
      console.error("No fields to update. Provide at least one option.");
      process.exit(1);
    }

    const task = await updateTask(id, payload, token);
    console.log("\nUpdated:\n");
    console.log(renderTask(task));
    console.log();
  });

// ── delete ─────────────────────────────────────────────────────────────────
program
  .command("delete <id>")
  .description("Move a task to trash")
  .option("--yes", "Skip confirmation prompt")
  .action(async (id: string, opts) => {
    const token = requireEnv("DART_API_KEY");

    if (!opts.yes) {
      const ok = await confirm({
        message: `Move task ${id} to trash?`,
        default: false,
      });
      if (!ok) {
        console.log("Cancelled.");
        return;
      }
    }

    const task = await deleteTask(id, token);
    console.log("\nDeleted (moved to trash):\n");
    console.log(renderTask(task));
    console.log();
  });

// ── spaces ─────────────────────────────────────────────────────────────────
const spaces = program.command("spaces").description("Manage tracked spaces");

spaces
  .command("list")
  .description("Show tracked spaces with task counts")
  .action(async () => {
    const token = requireEnv("DART_API_KEY");
    const config = loadConfig();

    if (config.spaces.length === 0) {
      console.log("No spaces configured. Run: dtd spaces add");
      return;
    }

    console.log("\nTracked spaces:\n");
    for (const space of config.spaces) {
      const tasks = await listTasks({ dartboard: space }, token);
      console.log(`  ${space}  (${tasks.length} tasks)`);
    }
    console.log();
  });

spaces
  .command("add")
  .description("Add dartboards to track")
  .action(async () => {
    const token = requireEnv("DART_API_KEY");
    await addSpaces(token);
  });

spaces
  .command("remove")
  .description("Remove tracked dartboards")
  .action(async () => {
    await removeSpaces();
  });

// ── uninstall ──────────────────────────────────────────────────────────────
program
  .command("uninstall")
  .description("Remove dtd binary and config directory")
  .action(async () => {
    await uninstall();
  });

// ── update check (skipped for uninstall/setup/spaces to avoid noise) ───────
const command = process.argv[2];
if (command !== "uninstall" && command !== "setup" && command !== "spaces") {
  await checkForUpdate();
}

program.parse();
