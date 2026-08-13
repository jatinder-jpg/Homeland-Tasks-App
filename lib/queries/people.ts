import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

export type MemberWithCounts = Database["public"]["Tables"]["tp_profiles"]["Row"] & {
  totalTasks: number;
  completedTasks: number;
  incompleteTasks: number;
};

export async function getOrgMembers(
  supabase: SupabaseClient<Database>,
  opts: { search?: string } = {},
): Promise<MemberWithCounts[]> {
  let query = supabase.from("tp_profiles").select("*").order("full_name", { ascending: true });

  if (opts.search) {
    query = query.ilike("full_name", `%${opts.search}%`);
  }

  const { data: profiles, error } = await query;
  if (error) throw error;

  const { data: assigneeRows } = await supabase
    .from("tp_task_assignees")
    .select("profile_id, task:tp_tasks!inner(status, is_draft, is_archived)")
    .eq("task.is_draft", false)
    .eq("task.is_archived", false);

  const counts = new Map<string, { total: number; completed: number; incomplete: number }>();
  for (const row of (assigneeRows ?? []) as unknown as { profile_id: string; task: { status: string } }[]) {
    const bucket = counts.get(row.profile_id) ?? { total: 0, completed: 0, incomplete: 0 };
    bucket.total += 1;
    if (row.task.status === "done") bucket.completed += 1;
    else bucket.incomplete += 1;
    counts.set(row.profile_id, bucket);
  }

  return (profiles ?? []).map((profile) => {
    const bucket = counts.get(profile.id) ?? { total: 0, completed: 0, incomplete: 0 };
    return {
      ...profile,
      totalTasks: bucket.total,
      completedTasks: bucket.completed,
      incompleteTasks: bucket.incomplete,
    };
  });
}

export type PriorityBreakdown = { priority: "high" | "medium" | "low"; count: number };

export async function getPriorityBreakdown(
  supabase: SupabaseClient<Database>,
  opts: { assigneeId: string },
): Promise<PriorityBreakdown[]> {
  const { data, error } = await supabase
    .from("tp_task_assignees")
    .select("task:tp_tasks!inner(priority, is_draft, is_archived)")
    .eq("profile_id", opts.assigneeId)
    .eq("task.is_draft", false)
    .eq("task.is_archived", false);

  if (error) throw error;

  const counts = { high: 0, medium: 0, low: 0 };
  for (const row of (data ?? []) as unknown as { task: { priority: string } }[]) {
    const priority = row.task.priority;
    if (priority === "high" || priority === "medium" || priority === "low") {
      counts[priority] += 1;
    }
  }

  return [
    { priority: "high", count: counts.high },
    { priority: "medium", count: counts.medium },
    { priority: "low", count: counts.low },
  ];
}
