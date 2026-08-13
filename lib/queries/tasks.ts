import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

export type TaskWithAssignee = Database["public"]["Tables"]["tp_tasks"]["Row"] & {
  assignee: { id: string; full_name: string } | null;
  assignees: { id: string; full_name: string }[];
  department: { id: string; name: string } | null;
  client: { id: string; name: string } | null;
  service: { id: string; name: string } | null;
};

export type TaskSubtask = Database["public"]["Tables"]["tp_task_subtasks"]["Row"] & {
  assignee: { id: string; full_name: string } | null;
};
export type TaskChecklistItem = Database["public"]["Tables"]["tp_task_checklist_items"]["Row"];

export type TaskDetail = TaskWithAssignee & {
  followers: { id: string; full_name: string }[];
  subtasks: TaskSubtask[];
  checklist: TaskChecklistItem[];
  customFieldValues: Record<string, string>;
};

async function getAssigneesForTasks(
  supabase: SupabaseClient<Database>,
  taskIds: string[],
): Promise<Map<string, { id: string; full_name: string }[]>> {
  const map = new Map<string, { id: string; full_name: string }[]>();
  if (taskIds.length === 0) return map;

  const { data } = await supabase
    .from("tp_task_assignees")
    .select("task_id, profile:tp_profiles(id, full_name)")
    .in("task_id", taskIds);

  for (const row of (data ?? []) as unknown as { task_id: string; profile: { id: string; full_name: string } | null }[]) {
    if (!row.profile) continue;
    const list = map.get(row.task_id) ?? [];
    list.push(row.profile);
    map.set(row.task_id, list);
  }
  return map;
}

export async function getTasks(
  supabase: SupabaseClient<Database>,
  opts: {
    includeDrafts?: boolean;
    archivedOnly?: boolean;
    recurringOnly?: boolean;
    search?: string;
    projectId?: string;
  } = {},
): Promise<TaskWithAssignee[]> {
  let query = supabase
    .from("tp_tasks")
    .select(
      "*, assignee:tp_profiles!tp_tasks_assignee_id_fkey(id, full_name), department:tp_departments(id, name), client:tp_clients(id, name), service:tp_services(id, name)",
    )
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });

  if (opts.recurringOnly) {
    query = query.eq("is_recurring", true).eq("is_archived", false);
  } else {
    query = opts.archivedOnly
      ? query.eq("is_archived", true)
      : query.eq("is_draft", Boolean(opts.includeDrafts)).eq("is_archived", false);
  }

  if (opts.search) {
    query = query.ilike("name", `%${opts.search}%`);
  }

  if (opts.projectId) {
    query = query.eq("project_id", opts.projectId);
  }

  const { data, error } = await query;
  if (error) throw error;
  const tasks = (data ?? []) as unknown as TaskWithAssignee[];

  const assigneesByTask = await getAssigneesForTasks(supabase, tasks.map((t) => t.id));
  return tasks.map((t) => ({ ...t, assignees: assigneesByTask.get(t.id) ?? [] }));
}

export async function getTaskDetail(
  supabase: SupabaseClient<Database>,
  taskId: string,
): Promise<TaskDetail | null> {
  const [
    { data: task, error: taskError },
    { data: assignees },
    { data: followers },
    { data: subtasks },
    { data: checklist },
    { data: customFieldRows },
  ] = await Promise.all([
    supabase
      .from("tp_tasks")
      .select(
        "*, assignee:tp_profiles!tp_tasks_assignee_id_fkey(id, full_name), department:tp_departments(id, name), client:tp_clients(id, name), service:tp_services(id, name)",
      )
      .eq("id", taskId)
      .single(),
    supabase.from("tp_task_assignees").select("profile:tp_profiles(id, full_name)").eq("task_id", taskId),
    supabase.from("tp_task_followers").select("profile:tp_profiles(id, full_name)").eq("task_id", taskId),
    supabase
      .from("tp_task_subtasks")
      .select("*, assignee:tp_profiles(id, full_name)")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true }),
    supabase
      .from("tp_task_checklist_items")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true }),
    supabase.from("tp_task_custom_field_values").select("custom_field_id, value").eq("task_id", taskId),
  ]);

  if (taskError || !task) return null;

  const customFieldValues: Record<string, string> = {};
  for (const row of customFieldRows ?? []) {
    if (row.value !== null) customFieldValues[row.custom_field_id] = row.value;
  }

  return {
    ...(task as unknown as TaskWithAssignee),
    assignees: ((assignees ?? []) as unknown as { profile: { id: string; full_name: string } }[]).map(
      (a) => a.profile,
    ),
    followers: ((followers ?? []) as unknown as { profile: { id: string; full_name: string } }[]).map(
      (f) => f.profile,
    ),
    subtasks: (subtasks ?? []) as unknown as TaskSubtask[],
    checklist: (checklist ?? []) as unknown as TaskChecklistItem[],
    customFieldValues,
  };
}
