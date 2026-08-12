import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

export type TaskMessage = Database["public"]["Tables"]["tp_discussion_messages"]["Row"] & {
  sender: { id: string; full_name: string } | null;
  attachment: { id: string; name: string; storage_path: string; mime_type: string | null } | null;
};

export async function getTaskChannelMessages(
  supabase: SupabaseClient<Database>,
  channelId: string,
): Promise<TaskMessage[]> {
  const { data, error } = await supabase
    .from("tp_discussion_messages")
    .select(
      "*, sender:tp_profiles!tp_discussion_messages_sender_id_fkey(id, full_name), attachment:tp_files(id, name, storage_path, mime_type)",
    )
    .eq("channel_id", channelId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as unknown as TaskMessage[];
}
