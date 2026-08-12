import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

export type NotificationWithActor = Database["public"]["Tables"]["tp_notifications"]["Row"] & {
  actor: { id: string; full_name: string } | null;
};

export async function getUnreadNotificationCount(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<number> {
  const { count } = await supabase
    .from("tp_notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", userId)
    .eq("is_read", false);

  return count ?? 0;
}

export async function getRecentNotifications(
  supabase: SupabaseClient<Database>,
  opts: { userId: string; limit?: number },
): Promise<NotificationWithActor[]> {
  const { data, error } = await supabase
    .from("tp_notifications")
    .select("*, actor:tp_profiles!tp_notifications_actor_id_fkey(id, full_name)")
    .eq("recipient_id", opts.userId)
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 10);

  if (error) throw error;
  return (data ?? []) as unknown as NotificationWithActor[];
}
