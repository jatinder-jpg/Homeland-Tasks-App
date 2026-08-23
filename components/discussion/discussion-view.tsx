"use client";

import { useEffect, useState, useTransition } from "react";
import { MessageSquare } from "lucide-react";
import { ChannelList } from "@/components/discussion/channel-list";
import { MessageThread } from "@/components/discussion/message-thread";
import { getChannelDataAction } from "@/lib/actions/discussion";
import type { ChannelWithMembers, MessageWithSender } from "@/lib/queries/discussion";

export function DiscussionView({
  initialChannels,
  archivedChannels: initialArchivedChannels,
  members,
  currentUserId,
}: {
  initialChannels: ChannelWithMembers[];
  archivedChannels: ChannelWithMembers[];
  members: { id: string; full_name: string }[];
  currentUserId: string;
}) {
  const [channels, setChannels] = useState(initialChannels);
  const [archivedChannels, setArchivedChannels] = useState(initialArchivedChannels);
  const [selectedId, setSelectedId] = useState<string | null>(initialChannels[0]?.id ?? null);
  const [activeChannel, setActiveChannel] = useState<ChannelWithMembers | null>(null);
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!selectedId) {
      setActiveChannel(null);
      return;
    }
    startTransition(async () => {
      const { channel, messages: msgs } = await getChannelDataAction(selectedId);
      setActiveChannel(channel);
      setMessages(msgs);
    });
  }, [selectedId]);

  function handleCreated(channelId: string) {
    if (!channels.some((c) => c.id === channelId)) {
      startTransition(async () => {
        const { channel } = await getChannelDataAction(channelId);
        if (channel) setChannels((prev) => [channel, ...prev]);
      });
    }
    setSelectedId(channelId);
  }

  function handleDeleted(channelId: string) {
    setChannels((prev) => prev.filter((c) => c.id !== channelId));
    setArchivedChannels((prev) => prev.filter((c) => c.id !== channelId));
    if (selectedId === channelId) setSelectedId(null);
  }

  function handleRenamed(channelId: string, name: string) {
    setChannels((prev) => prev.map((c) => (c.id === channelId ? { ...c, name } : c)));
    setArchivedChannels((prev) => prev.map((c) => (c.id === channelId ? { ...c, name } : c)));
    setActiveChannel((prev) => (prev && prev.id === channelId ? { ...prev, name } : prev));
  }

  function handleArchiveChange(channelId: string, archived: boolean) {
    if (archived) {
      const channel = channels.find((c) => c.id === channelId);
      setChannels((prev) => prev.filter((c) => c.id !== channelId));
      if (channel) setArchivedChannels((prev) => [{ ...channel, is_archived: true }, ...prev]);
      if (selectedId === channelId) setSelectedId(null);
    } else {
      const channel = archivedChannels.find((c) => c.id === channelId);
      setArchivedChannels((prev) => prev.filter((c) => c.id !== channelId));
      if (channel) setChannels((prev) => [{ ...channel, is_archived: false }, ...prev]);
    }
  }

  return (
    <div className="flex h-full min-w-0">
      <ChannelList
        channels={channels}
        archivedChannels={archivedChannels}
        selectedId={selectedId}
        onSelect={setSelectedId}
        members={members}
        currentUserId={currentUserId}
        onCreated={handleCreated}
        onArchiveChange={handleArchiveChange}
        onDeleted={handleDeleted}
        onRenamed={handleRenamed}
      />
      {activeChannel && !isPending ? (
        <MessageThread
          key={activeChannel.id}
          channel={activeChannel}
          initialMessages={messages}
          currentUserId={currentUserId}
        />
      ) : (
        <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
          <MessageSquare className="size-10" />
          <p>{isPending ? "Loading…" : "Select or start a conversation"}</p>
        </div>
      )}
    </div>
  );
}
