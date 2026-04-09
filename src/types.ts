export interface Task {
  id: string;
  htmlUrl: string;
  title: string;
  parentId: string | null;
  dartboard: string;
  type: string;
  status: string;
  assignees: string[];
  tags: string[];
  priority: string | null;
  startAt: string;
  dueAt: string;
  size: string | null;
  description?: string;
  customProperties: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

export interface TaskCreate {
  title: string;
  dartboard?: string;
  status?: string;
  priority?: string;
  tags?: string[];
  assignees?: string[];
  description?: string;
  size?: string;
  dueAt?: string;
}

export interface TaskUpdate extends Partial<Omit<TaskCreate, "title">> {
  id: string;
  title?: string;
}

export interface Config {
  spaces: string[];
  defaults: {
    daysBack: number;
  };
}

export interface DateRange {
  since: string;
  until: string;
}

export interface DartWorkspaceConfig {
  today: string;
  user: { name: string; email: string };
  dartboards: string[];
  statuses: string[];
  priorities: string[];
  tags: string[];
  assignees: Array<{ name: string; email?: string }>;
  sizes: string[];
}

export interface PaginatedTasks {
  count: number;
  next: string | null;
  previous: string | null;
  results: Task[];
}
