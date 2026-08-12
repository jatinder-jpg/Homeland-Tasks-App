"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/actions/notifications";
import { getChannelDetail, getChannelMessages } from "@/lib/queries/discussion";

export async function getChannelDataAction(channelId: string) {
  const supabase = await createClient();
  const [channel, messages] = await Promise.all([
    getChannelDetail(supabase, channelId),
    getChannelMessages(supabase, { channelId }),
  ]);
  return { channel, messages };
}

export async function archiveChannelAction(channelId: string, archived: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("tp_discussion_channels")
    .update({
      is_archived: archived,
      archived_at: archived ? new Date().toISOString() : null,
    })
    .eq("id", channelId);

  if (error) return { error: error.message };

  revalidatePath("/discussion");
  return { success: true };
}

export async function createChannelAction(input: {
  type: "group" | "direct";
  name?: string;
  memberIds: string[];
}) {
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

  const memberIds = Array.from(new Set(input.memberIds.filter((id) => id !== user.id)));

  if (input.type === "direct") {
    if (memberIds.length !== 1) {
      return { error: "Direct chat requires exactly one other member" };
    }
    const targetId = memberIds[0];

    const { data: myMemberships } = await supabase
      .from("tp_discussion_channel_members")
      .select("channel_id, channel:tp_discussion_channels(type)")
      .eq("profile_id", user.id);

    const directChannelIds = (myMemberships ?? [])
      .filter((row) => (row.channel as unknown as { type: string } | null)?.type === "direct")
      .map((row) => row.channel_id);

    if (directChannelIds.length > 0) {
      const { data: existingMembership } = await supabase
        .from("tp_discussion_channel_members")
        .select("channel_id")
        .eq("profile_id", targetId)
        .in("channel_id", directChannelIds)
        .maybeSingle();

      if (existingMembership) {
        return { success: true as const, id: existingMembership.channel_id };
      }
    }
  }

  const { data: channel, error: channelError } = await supabase
    .from("tp_discussion_channels")
    .insert({
      organization_id: profile.organization_id,
      type: input.type,
      name: input.type === "group" ? input.name || null : null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (channelError) return { error: channelError.message };

  const memberRows = [user.id, ...memberIds].map((profileId) => ({
    channel_id: channel.id,
    profile_id: profileId,
  }));

  const { error: membersError } = await supabase
    .from("tp_discussion_channel_members")
    .insert(memberRows);

  if (membersError) return { error: membersError.message };

  revalidatePath("/discussion");
  return { success: true as const, id: channel.id };
}

export async function sendMessageAction(channelId: string, body: string) {
  const trimmed = body.trim();
  if (!trimmed) return { error: "Message can't be empty" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error: insertError } = await supabase.from("tp_discussion_messages").insert({
    channel_id: channelId,
    sender_id: user.id,
    body: trimmed,
  });
  if (insertError) return { error: insertError.message };

  await supabase
    .from("tp_discussion_channels")
    .update({
      last_message_at: new Date().toISOString(),
      last_message_preview: trimmed.slice(0, 140),
    })
    .eq("id", channelId);

  const { data: profile } = await supabase
    .from("tp_profiles")
    .select("organization_id, full_name")
    .eq("id", user.id)
    .single();

  const { data: otherMembers } = await supabase
    .from("tp_discussion_channel_members")
    .select("profile_id")
    .eq("channel_id", channelId)
    .neq("profile_id", user.id);

  if (profile && otherMembers) {
    await Promise.all(
      otherMembers.map((m) =>
        createNotification({
          organizationId: profile.organization_id,
          recipientId: m.profile_id,
          actorId: user.id,
          type: "discussion_message",
          title: `New message from ${profile.full_name}`,
          body: trimmed.slice(0, 100),
          link: `/discussion?channel=${channelId}`,
        }),
      ),
    );
  }

  revalidatePath("/discussion");
  return { success: true };
}
