import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

export type TaskWithAssignee = Database["public"]["Tables"]["tp_tasks"]["Row"] & {
  assignee: { id: string; full_name: string } | null;
  team: { id: string; name: string } | null;
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
      "*, assignee:tp_profiles!tp_tasks_assignee_id_fkey(id, full_name), team:tp_teams(id, name), client:tp_clients(id, name), service:tp_services(id, name)",
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
  return (data ?? []) as unknown as TaskWithAssignee[];
}

export async function getTaskDetail(
  supabase: SupabaseClient<Database>,
  taskId: string,
): Promise<TaskDetail | null> {
  const [
    { data: task, error: taskError },
    { data: followers },
    { data: subtasks },
    { data: checklist },
    { data: customFieldRows },
  ] = await Promise.all([
    supabase
      .from("tp_tasks")
      .select(
        "*, assignee:tp_profiles!tp_tasks_assignee_id_fkey(id, full_name), team:tp_teams(id, name), client:tp_clients(id, name), service:tp_services(id, name)",
      )
      .eq("id", taskId)
      .single(),
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
    followers: ((followers ?? []) as unknown as { profile: { id: string; full_name: string } }[]).map(
      (f) => f.profile,
    ),
    subtasks: (subtasks ?? []) as unknown as TaskSubtask[],
    checklist: (checklist ?? []) as unknown as TaskChecklistItem[],
    customFieldValues,
  };
}
