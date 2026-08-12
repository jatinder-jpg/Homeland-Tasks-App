"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AvatarBadge } from "@/components/task/avatar-badge";
import { createClient } from "@/lib/supabase/client";
import { sendMessageAction } from "@/lib/actions/discussion";
import type { ChannelWithMembers, MessageWithSender } from "@/lib/queries/discussion";

function channelDisplayName(channel: ChannelWithMembers, currentUserId: string) {
  if (channel.type === "group") return channel.name || "Group Chat";
  const other = channel.members.find((m) => m.profile_id !== currentUserId);
  return other?.profile.full_name ?? "Direct message";
}

export function MessageThread({
  channel,
  initialMessages,
  currentUserId,
}: {
  channel: ChannelWithMembers;
  initialMessages: MessageWithSender[];
  currentUserId: string;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    const rtChannel = supabase
      .channel(`discussion:${channel.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "tp_discussion_messages",
          filter: `channel_id=eq.${channel.id}`,
        },
        (payload) => {
          const row = payload.new as MessageWithSender;
          setMessages((prev) => [...prev, { ...row, sender: null }]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(rtChannel);
    };
  }, [channel.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    startTransition(async () => {
      const result = await sendMessageAction(channel.id, body);
      if (result && "error" in result) toast.error(result.error);
    });
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="border-b px-4 py-3">
        <p className="font-semibold">{channelDisplayName(channel, currentUserId)}</p>
        <p className="text-xs text-muted-foreground">{channel.members.length} member(s)</p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="pt-10 text-center text-sm text-muted-foreground">
            No messages yet. Say hello!
          </p>
        )}
        {messages.map((message) => {
          const isMine = message.sender_id === currentUserId;
          const senderName = message.sender?.full_name ?? "…";
          return (
            <div key={message.id} className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : ""}`}>
              <AvatarBadge name={senderName} />
              <div
                className={`max-w-xs rounded-2xl px-3 py-2 text-sm ${
                  isMine ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                {message.body}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-2 border-t p-3">
        <Input
          placeholder="Type a message…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button size="icon" onClick={handleSend} disabled={isPending || !draft.trim()}>
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}
