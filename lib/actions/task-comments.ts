"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getTaskChannelMessages, type TaskMessage } from "@/lib/queries/task-comments";

export async function getOrCreateTaskChannelAction(
  taskId: string,
): Promise<{ channelId: string; messages: TaskMessage[] } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: existing } = await supabase
    .from("tp_discussion_channels")
    .select("id")
    .eq("task_id", taskId)
    .eq("type", "task")
    .maybeSingle();

  if (existing) {
    const messages = await getTaskChannelMessages(supabase, existing.id);
    return { channelId: existing.id, messages };
  }

  const { data: task } = await supabase.from("tp_tasks").select("organization_id, name").eq("id", taskId).single();
  if (!task) return { error: "Task not found" };

  const { data: channel, error } = await supabase
    .from("tp_discussion_channels")
    .insert({
      organization_id: task.organization_id,
      type: "task",
      task_id: taskId,
      name: task.name,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  return { channelId: channel.id, messages: [] };
}

export async function sendTaskCommentAction(
  channelId: string,
  taskId: string,
  body: string,
  attachmentFileId?: string | null,
) {
  const trimmed = body.trim();
  if (!trimmed && !attachmentFileId) return { error: "Message can't be empty" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error: insertError } = await supabase.from("tp_discussion_messages").insert({
    channel_id: channelId,
    sender_id: user.id,
    body: trimmed,
    attachment_file_id: attachmentFileId || null,
  });
  if (insertError) return { error: insertError.message };

  await supabase
    .from("tp_discussion_channels")
    .update({
      last_message_at: new Date().toISOString(),
      last_message_preview: trimmed.slice(0, 140),
    })
    .eq("id", channelId);

  revalidatePath("/task");
  return { success: true };
}
