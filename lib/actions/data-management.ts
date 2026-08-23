"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database.types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

async function requireSuperAdmin(
  supabase: SupabaseServerClient,
): Promise<{ userId: string; organizationId: string } | { error: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("tp_profiles")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "super_admin") {
    return { error: "Only the super admin can do this" };
  }

  return { userId: user.id, organizationId: profile.organization_id };
}

type BackupTask = Database["public"]["Tables"]["tp_tasks"]["Row"] & {
  assignees: string[];
  followers: string[];
  subtasks: Database["public"]["Tables"]["tp_task_subtasks"]["Row"][];
  checklist: Database["public"]["Tables"]["tp_task_checklist_items"]["Row"][];
};

type BackupChannel = Database["public"]["Tables"]["tp_discussion_channels"]["Row"] & {
  messages: Database["public"]["Tables"]["tp_discussion_messages"]["Row"][];
};

export type BackupPayload = {
  version: 1;
  exportedAt: string;
  organizationId: string;
  tasks: BackupTask[];
  channels: BackupChannel[];
};

function groupBy<T>(rows: T[], key: keyof T): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const k = String(row[key]);
    const list = map.get(k) ?? [];
    list.push(row);
    map.set(k, list);
  }
  return map;
}

export async function getBackupDataAction(): Promise<BackupPayload | { error: string }> {
  const supabase = await createClient();
  const auth = await requireSuperAdmin(supabase);
  if ("error" in auth) return auth;

  const { data: tasks } = await supabase.from("tp_tasks").select("*").eq("organization_id", auth.organizationId);
  const taskIds = (tasks ?? []).map((t) => t.id);

  const [{ data: assignees }, { data: followers }, { data: subtasks }, { data: checklist }] = await Promise.all([
    taskIds.length
      ? supabase.from("tp_task_assignees").select("task_id, profile_id").in("task_id", taskIds)
      : Promise.resolve({ data: [] }),
    taskIds.length
      ? supabase.from("tp_task_followers").select("task_id, profile_id").in("task_id", taskIds)
      : Promise.resolve({ data: [] }),
    taskIds.length
      ? supabase.from("tp_task_subtasks").select("*").in("task_id", taskIds)
      : Promise.resolve({ data: [] }),
    taskIds.length
      ? supabase.from("tp_task_checklist_items").select("*").in("task_id", taskIds)
      : Promise.resolve({ data: [] }),
  ]);

  const assigneesByTask = groupBy((assignees ?? []) as { task_id: string; profile_id: string }[], "task_id");
  const followersByTask = groupBy((followers ?? []) as { task_id: string; profile_id: string }[], "task_id");
  const subtasksByTask = groupBy(
    (subtasks ?? []) as Database["public"]["Tables"]["tp_task_subtasks"]["Row"][],
    "task_id",
  );
  const checklistByTask = groupBy(
    (checklist ?? []) as Database["public"]["Tables"]["tp_task_checklist_items"]["Row"][],
    "task_id",
  );

  const backupTasks: BackupTask[] = (tasks ?? []).map((t) => ({
    ...t,
    assignees: (assigneesByTask.get(t.id) ?? []).map((a) => a.profile_id),
    followers: (followersByTask.get(t.id) ?? []).map((f) => f.profile_id),
    subtasks: subtasksByTask.get(t.id) ?? [],
    checklist: checklistByTask.get(t.id) ?? [],
  }));

  const { data: channels } = await supabase
    .from("tp_discussion_channels")
    .select("*")
    .eq("organization_id", auth.organizationId);
  const channelIds = (channels ?? []).map((c) => c.id);

  const { data: messages } = channelIds.length
    ? await supabase.from("tp_discussion_messages").select("*").in("channel_id", channelIds)
    : { data: [] };

  const messagesByChannel = groupBy(
    (messages ?? []) as Database["public"]["Tables"]["tp_discussion_messages"]["Row"][],
    "channel_id",
  );

  const backupChannels: BackupChannel[] = (channels ?? []).map((c) => ({
    ...c,
    messages: messagesByChannel.get(c.id) ?? [],
  }));

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    organizationId: auth.organizationId,
    tasks: backupTasks,
    channels: backupChannels,
  };
}

export async function wipeOrgDataAction(confirmPhrase: string) {
  const supabase = await createClient();
  const auth = await requireSuperAdmin(supabase);
  if ("error" in auth) return auth;

  if (confirmPhrase !== "DELETE") {
    return { error: 'Type "DELETE" to confirm' };
  }

  const { error: tasksError } = await supabase.from("tp_tasks").delete().eq("organization_id", auth.organizationId);
  if (tasksError) return { error: tasksError.message };

  const { error: channelsError } = await supabase
    .from("tp_discussion_channels")
    .delete()
    .eq("organization_id", auth.organizationId);
  if (channelsError) return { error: channelsError.message };

  revalidatePath("/", "layout");
  return { success: true };
}

export async function restoreBackupAction(backup: BackupPayload) {
  const supabase = await createClient();
  const auth = await requireSuperAdmin(supabase);
  if ("error" in auth) return auth;

  if (!backup || backup.version !== 1) {
    return { error: "This file doesn't look like a valid backup" };
  }

  const { data: memberRows } = await supabase
    .from("tp_profiles")
    .select("id")
    .eq("organization_id", auth.organizationId);
  const validProfileIds = new Set((memberRows ?? []).map((m) => m.id));

  let restoredTasks = 0;
  for (const task of backup.tasks) {
    const createdBy = validProfileIds.has(task.created_by) ? task.created_by : auth.userId;

    const { data: inserted, error: insertError } = await supabase
      .from("tp_tasks")
      .insert({
        organization_id: auth.organizationId,
        name: `[Restored] ${task.name}`,
        description: task.description,
        priority: task.priority,
        status: task.status,
        due_date: task.due_date,
        is_draft: task.is_draft,
        is_archived: task.is_archived,
        is_pinned: task.is_pinned,
        is_recurring: task.is_recurring,
        site_visit: task.site_visit,
        progress: task.progress,
        workflow_status: task.workflow_status,
        created_by: createdBy,
      })
      .select("id")
      .single();

    if (insertError || !inserted) continue;
    restoredTasks += 1;

    const validAssignees = task.assignees.filter((id) => validProfileIds.has(id));
    if (validAssignees.length > 0) {
      await supabase
        .from("tp_task_assignees")
        .insert(validAssignees.map((profileId) => ({ task_id: inserted.id, profile_id: profileId })));
    }

    const validFollowers = task.followers.filter((id) => validProfileIds.has(id));
    if (validFollowers.length > 0) {
      await supabase
        .from("tp_task_followers")
        .insert(validFollowers.map((profileId) => ({ task_id: inserted.id, profile_id: profileId })));
    }

    if (task.subtasks.length > 0) {
      await supabase.from("tp_task_subtasks").insert(
        task.subtasks.map((s) => ({
          task_id: inserted.id,
          organization_id: auth.organizationId,
          title: s.title,
          is_done: s.is_done,
          assignee_id: s.assignee_id && validProfileIds.has(s.assignee_id) ? s.assignee_id : null,
        })),
      );
    }

    if (task.checklist.length > 0) {
      await supabase.from("tp_task_checklist_items").insert(
        task.checklist.map((c) => ({
          task_id: inserted.id,
          organization_id: auth.organizationId,
          label: c.label,
          is_done: c.is_done,
        })),
      );
    }
  }

  let restoredChannels = 0;
  for (const channel of backup.channels) {
    const { data: insertedChannel, error: channelError } = await supabase
      .from("tp_discussion_channels")
      .insert({
        organization_id: auth.organizationId,
        type: channel.type === "task" ? "group" : channel.type,
        name: `[Restored] ${channel.name || "Chat"}`,
        created_by: auth.userId,
      })
      .select("id")
      .single();

    if (channelError || !insertedChannel) continue;
    restoredChannels += 1;

    await supabase
      .from("tp_discussion_channel_members")
      .insert({ channel_id: insertedChannel.id, profile_id: auth.userId });

    const validMessages = channel.messages.filter((m) => validProfileIds.has(m.sender_id));
    if (validMessages.length > 0) {
      await supabase.from("tp_discussion_messages").insert(
        validMessages.map((m) => ({
          channel_id: insertedChannel.id,
          sender_id: m.sender_id,
          body: m.body,
          is_deleted: m.is_deleted,
          edited_at: m.edited_at,
          created_at: m.created_at,
        })),
      );
    }
  }

  revalidatePath("/", "layout");
  return { success: true as const, restoredTasks, restoredChannels };
}
