import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export type DashboardCounts = {
  total: number;
  assignedToMe: number;
  dueToday: number;
  pastDue: number;
  newToday: number;
  closedToday: number;
};

export async function getDashboardCounts(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<DashboardCounts> {
  const today = todayISO();
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

  const [total, assignedToMe, dueToday, pastDue, newToday, closedToday] = await Promise.all([
    supabase
      .from("tp_tasks")
      .select("id", { count: "exact", head: true })
      .eq("is_draft", false)
      .eq("is_archived", false),
    supabase
      .from("tp_tasks")
      .select("id", { count: "exact", head: true })
      .eq("is_draft", false)
      .eq("is_archived", false)
      .eq("assignee_id", userId),
    supabase
      .from("tp_tasks")
      .select("id", { count: "exact", head: true })
      .eq("is_draft", false)
      .eq("is_archived", false)
      .eq("due_date", today),
    supabase
      .from("tp_tasks")
      .select("id", { count: "exact", head: true })
      .eq("is_draft", false)
      .eq("is_archived", false)
      .lt("due_date", today)
      .neq("status", "done"),
    supabase
      .from("tp_tasks")
      .select("id", { count: "exact", head: true })
      .eq("is_draft", false)
      .eq("is_archived", false)
      .gte("created_at", today)
      .lt("created_at", tomorrow),
    supabase
      .from("tp_tasks")
      .select("id", { count: "exact", head: true })
      .eq("is_draft", false)
      .eq("is_archived", false)
      .gte("completed_at", today)
      .lt("completed_at", tomorrow),
  ]);

  return {
    total: total.count ?? 0,
    assignedToMe: assignedToMe.count ?? 0,
    dueToday: dueToday.count ?? 0,
    pastDue: pastDue.count ?? 0,
    newToday: newToday.count ?? 0,
    closedToday: closedToday.count ?? 0,
  };
}

export type MonthlyStatRow = {
  period: string;
  completed: number;
  incomplete: number;
};

export async function getStatistics(
  supabase: SupabaseClient<Database>,
  opts: { scope: "all" | "mine"; range: "monthly" | "weekly"; userId: string },
): Promise<MonthlyStatRow[]> {
  let query = supabase
    .from("tp_tasks")
    .select("due_date, completed_at, created_at, status")
    .eq("is_draft", false)
    .eq("is_archived", false);

  if (opts.scope === "mine") {
    query = query.eq("assignee_id", opts.userId);
  }

  const { data } = await query;
  return aggregate(data ?? [], opts.range);
}

function aggregate(
  rows: { due_date: string | null; completed_at: string | null; created_at: string; status: string }[],
  range: "monthly" | "weekly",
): MonthlyStatRow[] {
  const buckets = new Map<string, { completed: number; incomplete: number }>();

  for (const row of rows) {
    const basis = row.completed_at ?? row.due_date ?? row.created_at;
    const date = new Date(basis);
    const period = range === "monthly" ? monthKey(date) : weekKey(date);
    const bucket = buckets.get(period) ?? { completed: 0, incomplete: 0 };
    if (row.status === "done") bucket.completed += 1;
    else bucket.incomplete += 1;
    buckets.set(period, bucket);
  }

  return Array.from(buckets.entries())
    .map(([period, counts]) => ({ period, ...counts }))
    .sort((a, b) => a.period.localeCompare(b.period));
}

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

function weekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - day + 1);
  return d.toISOString().slice(0, 10);
}
