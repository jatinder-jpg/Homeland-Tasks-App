import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

export type ChannelWithMembers = Database["public"]["Tables"]["tp_discussion_channels"]["Row"] & {
  members: { profile_id: string; profile: { id: string; full_name: string } }[];
};

export type MessageWithSender = Database["public"]["Tables"]["tp_discussion_messages"]["Row"] & {
  sender: { id: string; full_name: string } | null;
};

export async function getChannelsForUser(
  supabase: SupabaseClient<Database>,
  opts: { userId: string; archivedOnly?: boolean },
): Promise<ChannelWithMembers[]> {
  const { data, error } = await supabase
    .from("tp_discussion_channel_members")
    .select(
      "channel:tp_discussion_channels(*, members:tp_discussion_channel_members(profile_id, profile:tp_profiles(id, full_name)))",
    )
    .eq("profile_id", opts.userId);

  if (error) throw error;

  const channels = (data ?? [])
    .map((row) => row.channel)
    .filter((c): c is NonNullable<typeof c> => c !== null)
    .filter((c) => Boolean(c.is_archived) === Boolean(opts.archivedOnly)) as unknown as ChannelWithMembers[];

  return channels.sort((a, b) => {
    const aTime = a.last_message_at ?? a.created_at;
    const bTime = b.last_message_at ?? b.created_at;
    return bTime.localeCompare(aTime);
  });
}

export async function getChannelDetail(
  supabase: SupabaseClient<Database>,
  channelId: string,
): Promise<ChannelWithMembers | null> {
  const { data, error } = await supabase
    .from("tp_discussion_channels")
    .select("*, members:tp_discussion_channel_members(profile_id, profile:tp_profiles(id, full_name))")
    .eq("id", channelId)
    .maybeSingle();

  if (error) throw error;
  return data as unknown as ChannelWithMembers | null;
}

export async function getChannelMessages(
  supabase: SupabaseClient<Database>,
  opts: { channelId: string },
): Promise<MessageWithSender[]> {
  const { data, error } = await supabase
    .from("tp_discussion_messages")
    .select("*, sender:tp_profiles!tp_discussion_messages_sender_id_fkey(id, full_name)")
    .eq("channel_id", opts.channelId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as unknown as MessageWithSender[];
}
