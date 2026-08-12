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

  const { data: tasks } = await supabase
    .from("tp_tasks")
    .select("assignee_id, status")
    .eq("is_draft", false)
    .eq("is_archived", false);

  const counts = new Map<string, { total: number; completed: number; incomplete: number }>();
  for (const task of tasks ?? []) {
    if (!task.assignee_id) continue;
    const bucket = counts.get(task.assignee_id) ?? { total: 0, completed: 0, incomplete: 0 };
    bucket.total += 1;
    if (task.status === "done") bucket.completed += 1;
    else bucket.incomplete += 1;
    counts.set(task.assignee_id, bucket);
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
    .from("tp_tasks")
    .select("priority")
    .eq("assignee_id", opts.assigneeId)
    .eq("is_draft", false)
    .eq("is_archived", false);

  if (error) throw error;

  const counts = { high: 0, medium: 0, low: 0 };
  for (const row of data ?? []) {
    if (row.priority === "high" || row.priority === "medium" || row.priority === "low") {
      counts[row.priority] += 1;
    }
  }

  return [
    { priority: "high", count: counts.high },
    { priority: "medium", count: counts.medium },
    { priority: "low", count: counts.low },
  ];
}
