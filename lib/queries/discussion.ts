import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

export type ChannelWithMembers = Database["public"]["Tables"]["tp_discussion_channels"]["Row"] & {
  members: { profile_id: string; last_read_at: string | null; profile: { id: string; full_name: string } }[];
  unreadCount: number;
};

export type MessageAttachment = { id: string; name: string; storage_path: string; mime_type: string | null };

export type MessageReplyTo = {
  id: string;
  body: string;
  is_deleted: boolean;
  sender: { id: string; full_name: string } | null;
};

export type MessageReaction = { emoji: string; profile_id: string };

export type MessageWithSender = Database["public"]["Tables"]["tp_discussion_messages"]["Row"] & {
  sender: { id: string; full_name: string } | null;
  attachment: MessageAttachment | null;
  replyTo: MessageReplyTo | null;
  reactions: MessageReaction[];
};

export async function getChannelsForUser(
  supabase: SupabaseClient<Database>,
  opts: { userId: string; archivedOnly?: boolean },
): Promise<ChannelWithMembers[]> {
  const { data, error } = await supabase
    .from("tp_discussion_channel_members")
    .select(
      "last_read_at, channel:tp_discussion_channels(*, members:tp_discussion_channel_members(profile_id, last_read_at, profile:tp_profiles(id, full_name)))",
    )
    .eq("profile_id", opts.userId);

  if (error) throw error;

  type RawChannel = Omit<ChannelWithMembers, "unreadCount">;
  const rows = (data ?? []) as unknown as {
    last_read_at: string | null;
    channel: RawChannel | null;
  }[];

  const scoped = rows
    .filter((r) => r.channel !== null)
    .filter((r) => Boolean(r.channel!.is_archived) === Boolean(opts.archivedOnly));

  const channelIds = scoped.map((r) => r.channel!.id);
  const lastReadByChannel = new Map(scoped.map((r) => [r.channel!.id, r.last_read_at]));

  const unreadCounts = await getUnreadCounts(supabase, channelIds, opts.userId, lastReadByChannel);

  const channels: ChannelWithMembers[] = scoped.map((r) => ({
    ...r.channel!,
    unreadCount: unreadCounts.get(r.channel!.id) ?? 0,
  }));

  return channels.sort((a, b) => {
    const aTime = a.last_message_at ?? a.created_at;
    const bTime = b.last_message_at ?? b.created_at;
    return bTime.localeCompare(aTime);
  });
}

async function getUnreadCounts(
  supabase: SupabaseClient<Database>,
  channelIds: string[],
  userId: string,
  lastReadByChannel: Map<string, string | null>,
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (channelIds.length === 0) return counts;

  const { data } = await supabase
    .from("tp_discussion_messages")
    .select("channel_id, sender_id, created_at")
    .in("channel_id", channelIds)
    .neq("sender_id", userId);

  for (const row of (data ?? []) as { channel_id: string; sender_id: string; created_at: string }[]) {
    const lastReadAt = lastReadByChannel.get(row.channel_id);
    if (lastReadAt && row.created_at <= lastReadAt) continue;
    counts.set(row.channel_id, (counts.get(row.channel_id) ?? 0) + 1);
  }
  return counts;
}

export async function getChannelDetail(
  supabase: SupabaseClient<Database>,
  channelId: string,
): Promise<ChannelWithMembers | null> {
  const { data, error } = await supabase
    .from("tp_discussion_channels")
    .select("*, members:tp_discussion_channel_members(profile_id, last_read_at, profile:tp_profiles(id, full_name))")
    .eq("id", channelId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return { ...(data as unknown as ChannelWithMembers), unreadCount: 0 };
}

export async function getChannelMessages(
  supabase: SupabaseClient<Database>,
  opts: { channelId: string },
): Promise<MessageWithSender[]> {
  const { data, error } = await supabase
    .from("tp_discussion_messages")
    .select(
      "*, sender:tp_profiles!tp_discussion_messages_sender_id_fkey(id, full_name), attachment:tp_files(id, name, storage_path, mime_type)",
    )
    .eq("channel_id", opts.channelId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  const messages = (data ?? []) as unknown as MessageWithSender[];
  if (messages.length === 0) return messages;

  const messageIds = messages.map((m) => m.id);
  const replyIds = Array.from(new Set(messages.map((m) => m.reply_to_message_id).filter((id): id is string => !!id)));

  const [{ data: replyRows }, { data: reactionRows }] = await Promise.all([
    replyIds.length
      ? supabase
          .from("tp_discussion_messages")
          .select("id, body, is_deleted, sender:tp_profiles!tp_discussion_messages_sender_id_fkey(id, full_name)")
          .in("id", replyIds)
      : Promise.resolve({ data: [] }),
    supabase.from("tp_discussion_message_reactions").select("message_id, emoji, profile_id").in("message_id", messageIds),
  ]);

  const replyById = new Map((replyRows ?? []).map((r) => [r.id, r as unknown as MessageReplyTo]));
  const reactionsByMessage = new Map<string, MessageReaction[]>();
  for (const row of (reactionRows ?? []) as { message_id: string; emoji: string; profile_id: string }[]) {
    const list = reactionsByMessage.get(row.message_id) ?? [];
    list.push({ emoji: row.emoji, profile_id: row.profile_id });
    reactionsByMessage.set(row.message_id, list);
  }

  return messages.map((m) => ({
    ...m,
    replyTo: m.reply_to_message_id ? (replyById.get(m.reply_to_message_id) ?? null) : null,
    reactions: reactionsByMessage.get(m.id) ?? [],
  }));
}
