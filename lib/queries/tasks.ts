import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

export type TaskWithAssignee = Database["public"]["Tables"]["tp_tasks"]["Row"] & {
  assignee: { id: string; full_name: string } | null;
  assignees: { id: string; full_name: string }[];
  department: { id: string; name: string } | null;
  departments: { id: string; name: string }[];
  client: { id: string; name: string } | null;
  service: { id: string; name: string } | null;
  creator: { id: string; full_name: string } | null;
  project: { id: string; name: string } | null;
  followers: { id: string; full_name: string }[];
  hasUnreadComment: boolean;
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

async function getRelatedForTasks<T extends { id: string }>(
  supabase: SupabaseClient<Database>,
  table: "tp_task_assignees" | "tp_task_departments" | "tp_task_followers",
  embed: string,
  taskIds: string[],
): Promise<Map<string, T[]>> {
  const map = new Map<string, T[]>();
  if (taskIds.length === 0) return map;

  const { data } = await supabase.from(table).select(`task_id, related:${embed}`).in("task_id", taskIds);

  for (const row of (data ?? []) as unknown as { task_id: string; related: T | null }[]) {
    if (!row.related) continue;
    const list = map.get(row.task_id) ?? [];
    list.push(row.related);
    map.set(row.task_id, list);
  }
  return map;
}

async function getUnreadCommentTaskIds(
  supabase: SupabaseClient<Database>,
  taskIds: string[],
  currentUserId: string,
): Promise<Set<string>> {
  const unread = new Set<string>();
  if (taskIds.length === 0 || !currentUserId) return unread;

  const { data: channels } = await supabase
    .from("tp_discussion_channels")
    .select("id, task_id, last_message_at")
    .eq("type", "task")
    .in("task_id", taskIds)
    .not("last_message_at", "is", null);

  const channelRows = (channels ?? []) as { id: string; task_id: string; last_message_at: string }[];
  if (channelRows.length === 0) return unread;

  const channelIds = channelRows.map((c) => c.id);

  const [{ data: lastMessages }, { data: reads }] = await Promise.all([
    supabase
      .from("tp_discussion_messages")
      .select("channel_id, sender_id, created_at")
      .in("channel_id", channelIds)
      .order("created_at", { ascending: false }),
    supabase.from("tp_task_reads").select("task_id, read_at").eq("profile_id", currentUserId).in("task_id", taskIds),
  ]);

  const lastSenderByChannel = new Map<string, string>();
  for (const m of (lastMessages ?? []) as { channel_id: string; sender_id: string; created_at: string }[]) {
    if (!lastSenderByChannel.has(m.channel_id)) lastSenderByChannel.set(m.channel_id, m.sender_id);
  }

  const readAtByTask = new Map<string, string>();
  for (const r of (reads ?? []) as { task_id: string; read_at: string }[]) {
    readAtByTask.set(r.task_id, r.read_at);
  }

  for (const channel of channelRows) {
    const lastSenderId = lastSenderByChannel.get(channel.id);
    if (!lastSenderId || lastSenderId === currentUserId) continue;
    const readAt = readAtByTask.get(channel.task_id);
    if (!readAt || readAt < channel.last_message_at) unread.add(channel.task_id);
  }

  return unread;
}

export async function getTasks(
  supabase: SupabaseClient<Database>,
  opts: {
    includeDrafts?: boolean;
    archivedOnly?: boolean;
    recurringOnly?: boolean;
    search?: string;
    projectId?: string;
    currentUserId?: string;
  } = {},
): Promise<TaskWithAssignee[]> {
  let query = supabase
    .from("tp_tasks")
    .select(
      "*, assignee:tp_profiles!tp_tasks_assignee_id_fkey(id, full_name), department:tp_departments!tp_tasks_department_id_fkey(id, name), client:tp_clients(id, name), service:tp_services(id, name), creator:tp_profiles!tp_tasks_created_by_fkey(id, full_name), project:tp_projects(id, name)",
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
  const taskIds = tasks.map((t) => t.id);

  const [assigneesByTask, departmentsByTask, followersByTask, unreadCommentTaskIds] = await Promise.all([
    getRelatedForTasks<{ id: string; full_name: string }>(
      supabase,
      "tp_task_assignees",
      "tp_profiles(id, full_name)",
      taskIds,
    ),
    getRelatedForTasks<{ id: string; name: string }>(
      supabase,
      "tp_task_departments",
      "tp_departments(id, name)",
      taskIds,
    ),
    getRelatedForTasks<{ id: string; full_name: string }>(
      supabase,
      "tp_task_followers",
      "tp_profiles(id, full_name)",
      taskIds,
    ),
    getUnreadCommentTaskIds(supabase, taskIds, opts.currentUserId ?? ""),
  ]);

  return tasks.map((t) => ({
    ...t,
    assignees: assigneesByTask.get(t.id) ?? [],
    departments: departmentsByTask.get(t.id) ?? [],
    followers: followersByTask.get(t.id) ?? [],
    hasUnreadComment: unreadCommentTaskIds.has(t.id),
  }));
}

export async function getTaskDetail(
  supabase: SupabaseClient<Database>,
  taskId: string,
): Promise<TaskDetail | null> {
  const [
    { data: task, error: taskError },
    { data: assignees },
    { data: departments },
    { data: followers },
    { data: subtasks },
    { data: checklist },
    { data: customFieldRows },
  ] = await Promise.all([
    supabase
      .from("tp_tasks")
      .select(
        "*, assignee:tp_profiles!tp_tasks_assignee_id_fkey(id, full_name), department:tp_departments!tp_tasks_department_id_fkey(id, name), client:tp_clients(id, name), service:tp_services(id, name), creator:tp_profiles!tp_tasks_created_by_fkey(id, full_name), project:tp_projects(id, name)",
      )
      .eq("id", taskId)
      .single(),
    supabase.from("tp_task_assignees").select("profile:tp_profiles(id, full_name)").eq("task_id", taskId),
    supabase.from("tp_task_departments").select("department:tp_departments(id, name)").eq("task_id", taskId),
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
    departments: ((departments ?? []) as unknown as { department: { id: string; name: string } }[]).map(
      (d) => d.department,
    ),
    followers: ((followers ?? []) as unknown as { profile: { id: string; full_name: string } }[]).map(
      (f) => f.profile,
    ),
    subtasks: (subtasks ?? []) as unknown as TaskSubtask[],
    checklist: (checklist ?? []) as unknown as TaskChecklistItem[],
    customFieldValues,
    hasUnreadComment: false,
  };
}
