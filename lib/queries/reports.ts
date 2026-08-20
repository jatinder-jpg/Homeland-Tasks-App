import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

export type StatusWiseRow = { status: string; count: number };

export async function getStatusWiseReport(supabase: SupabaseClient<Database>): Promise<StatusWiseRow[]> {
  const { data, error } = await supabase
    .from("tp_tasks")
    .select("status")
    .eq("is_draft", false)
    .eq("is_archived", false);
  if (error) throw error;

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    counts.set(row.status, (counts.get(row.status) ?? 0) + 1);
  }

  return Array.from(counts.entries()).map(([status, count]) => ({ status, count }));
}

export type ProjectWiseRow = {
  id: string;
  name: string;
  totalTasks: number;
  completedTasks: number;
  incompleteTasks: number;
};

export async function getProjectWiseReport(supabase: SupabaseClient<Database>): Promise<ProjectWiseRow[]> {
  const { data: projects, error } = await supabase
    .from("tp_projects")
    .select("id, name")
    .order("name", { ascending: true });
  if (error) throw error;

  const { data: tasks } = await supabase
    .from("tp_tasks")
    .select("project_id, status")
    .eq("is_draft", false)
    .eq("is_archived", false)
    .not("project_id", "is", null);

  const counts = new Map<string, { total: number; completed: number; incomplete: number }>();
  for (const task of tasks ?? []) {
    if (!task.project_id) continue;
    const bucket = counts.get(task.project_id) ?? { total: 0, completed: 0, incomplete: 0 };
    bucket.total += 1;
    if (task.status === "done") bucket.completed += 1;
    else bucket.incomplete += 1;
    counts.set(task.project_id, bucket);
  }

  return (projects ?? []).map((project) => {
    const bucket = counts.get(project.id) ?? { total: 0, completed: 0, incomplete: 0 };
    return {
      id: project.id,
      name: project.name,
      totalTasks: bucket.total,
      completedTasks: bucket.completed,
      incompleteTasks: bucket.incomplete,
    };
  });
}

export type ActivityFeedRow = {
  id: string;
  action: string;
  detail: string | null;
  created_at: string;
  actor: { id: string; full_name: string } | null;
  task: { id: string; name: string } | null;
};

export async function getOrgActivityFeed(
  supabase: SupabaseClient<Database>,
  opts: { limit?: number } = {},
): Promise<ActivityFeedRow[]> {
  const { data, error } = await supabase
    .from("tp_task_activity_log")
    .select("id, action, detail, created_at, actor:tp_profiles(id, full_name), task:tp_tasks(id, name)")
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 100);
  if (error) throw error;
  return (data ?? []) as unknown as ActivityFeedRow[];
}
