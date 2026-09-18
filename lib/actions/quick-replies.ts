"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type QuickReply = { id: string; text: string; created_by: string };

export async function getQuickRepliesAction(): Promise<QuickReply[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("tp_quick_replies")
    .select("id, text, created_by")
    .order("created_at", { ascending: true });

  return data ?? [];
}

export async function createQuickReplyAction(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return { error: "Quick reply text can't be empty" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("tp_profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();
  if (!profile) return { error: "No profile found" };

  const { error } = await supabase
    .from("tp_quick_replies")
    .insert({ organization_id: profile.organization_id, created_by: user.id, text: trimmed });
  if (error) return { error: error.message };

  revalidatePath("/task");
  return { success: true };
}

export async function deleteQuickReplyAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tp_quick_replies").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/task");
  return { success: true };
}
