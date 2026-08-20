"use server";

import { createClient } from "@/lib/supabase/server";

export type TaskActivityAction =
  | "updated"
  | "status_changed"
  | "archived"
  | "unarchived"
  | "completed"
  | "reopened"
  | "opened"
  | "commented";

export type TaskActivityEntry = {
  id: string;
  action: string;
  detail: string | null;
  created_at: string;
  actor: { id: string; full_name: string } | null;
};

export type TaskReadReceipt = {
  profile_id: string;
  read_at: string;
  profile: { id: string; full_name: string } | null;
};

export async function logTaskActivity(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: { taskId: string; actorId: string | null; action: TaskActivityAction; detail?: string },
) {
  const { data: task } = await supabase
    .from("tp_tasks")
    .select("organization_id")
    .eq("id", input.taskId)
    .single();
  if (!task) return;

  await supabase.from("tp_task_activity_log").insert({
    task_id: input.taskId,
    organization_id: task.organization_id,
    actor_id: input.actorId,
    action: input.action,
    detail: input.detail || null,
  });
}

export async function markTaskReadAction(taskId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("tp_task_reads")
    .upsert(
      { task_id: taskId, profile_id: user.id, read_at: new Date().toISOString() },
      { onConflict: "task_id,profile_id" },
    );

  await logTaskActivity(supabase, { taskId, actorId: user.id, action: "opened" });
}

export async function getTaskActivityAction(
  taskId: string,
): Promise<{ entries: TaskActivityEntry[]; reads: TaskReadReceipt[] }> {
  const supabase = await createClient();

  const [{ data: entries }, { data: reads }] = await Promise.all([
    supabase
      .from("tp_task_activity_log")
      .select("id, action, detail, created_at, actor:tp_profiles(id, full_name)")
      .eq("task_id", taskId)
      .order("created_at", { ascending: false }),
    supabase
      .from("tp_task_reads")
      .select("profile_id, read_at, profile:tp_profiles(id, full_name)")
      .eq("task_id", taskId)
      .order("read_at", { ascending: false }),
  ]);

  return {
    entries: (entries ?? []) as unknown as TaskActivityEntry[],
    reads: (reads ?? []) as unknown as TaskReadReceipt[],
  };
}
