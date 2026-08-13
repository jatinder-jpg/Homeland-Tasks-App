"use server";

import { createClient } from "@/lib/supabase/server";

export type CreateNotificationInput = {
  organizationId: string;
  recipientId: string;
  actorId: string | null;
  type:
    | "task_assigned"
    | "project_assigned"
    | "discussion_message"
    | "folder_shared"
    | "file_shared"
    | "task_urgent_alert";
  title: string;
  body?: string;
  link?: string;
};

/**
 * Fire-and-forget: notifications are a side effect of task/project/message
 * actions, so a failure here must never fail or roll back the primary action.
 */
export async function createNotification(input: CreateNotificationInput) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("tp_notifications").insert({
      organization_id: input.organizationId,
      recipient_id: input.recipientId,
      actor_id: input.actorId,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link,
    });
    if (error) console.error("createNotification failed:", error.message);
  } catch (err) {
    console.error("createNotification failed:", err);
  }
}

export async function markNotificationReadAction(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("tp_notifications")
    .update({ is_read: true })
    .eq("id", id)
    .eq("recipient_id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}

export async function markAllNotificationsReadAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("tp_notifications")
    .update({ is_read: true })
    .eq("recipient_id", user.id)
    .eq("is_read", false);

  if (error) return { error: error.message };
  return { success: true };
}
