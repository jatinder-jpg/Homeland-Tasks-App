"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Send, MoreVertical, Pencil, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AvatarBadge } from "@/components/task/avatar-badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { createClient } from "@/lib/supabase/client";
import { sendMessageAction, editMessageAction, deleteMessageAction } from "@/lib/actions/discussion";
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

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
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tp_discussion_messages",
          filter: `channel_id=eq.${channel.id}`,
        },
        (payload) => {
          const row = payload.new as MessageWithSender;
          setMessages((prev) => prev.map((m) => (m.id === row.id ? { ...m, ...row } : m)));
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

  function startEdit(message: MessageWithSender) {
    setEditingId(message.id);
    setEditDraft(message.body);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft("");
  }

  function saveEdit(messageId: string) {
    const body = editDraft.trim();
    if (!body) return;
    setEditingId(null);
    startTransition(async () => {
      const result = await editMessageAction(messageId, body);
      if (result && "error" in result) {
        toast.error(result.error);
        return;
      }
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, body, edited_at: new Date().toISOString() } : m)),
      );
    });
  }

  function confirmDelete() {
    if (!deleteTargetId) return;
    const messageId = deleteTargetId;
    setDeleteTargetId(null);
    startTransition(async () => {
      const result = await deleteMessageAction(messageId);
      if (result && "error" in result) {
        toast.error(result.error);
        return;
      }
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, is_deleted: true } : m)));
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
          const isEditing = editingId === message.id;
          return (
            <div key={message.id} className={`group flex items-end gap-2 ${isMine ? "flex-row-reverse" : ""}`}>
              <AvatarBadge name={senderName} profileId={message.sender_id} />

              {isEditing ? (
                <div className="flex max-w-xs flex-1 items-center gap-1.5">
                  <Input
                    autoFocus
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit(message.id);
                      if (e.key === "Escape") cancelEdit();
                    }}
                    className="h-8 text-sm"
                  />
                  <Button size="icon" variant="ghost" className="size-7 shrink-0" onClick={() => saveEdit(message.id)}>
                    <Check className="size-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="size-7 shrink-0" onClick={cancelEdit}>
                    <X className="size-3.5" />
                  </Button>
                </div>
              ) : (
                <div
                  className={`relative max-w-xs rounded-2xl px-3 py-2 text-sm ${
                    isMine ? "bg-primary text-primary-foreground" : "bg-muted"
                  } ${message.is_deleted ? "italic opacity-70" : ""}`}
                >
                  {message.is_deleted ? (
                    "This message was deleted"
                  ) : (
                    <>
                      {message.body}
                      {message.edited_at && (
                        <span
                          className={`ml-1.5 text-[10px] ${isMine ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                        >
                          (edited)
                        </span>
                      )}
                    </>
                  )}
                </div>
              )}

              {isMine && !isEditing && !message.is_deleted && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="Message options"
                      className="shrink-0 rounded p-1 text-muted-foreground/0 hover:bg-accent hover:text-foreground group-hover:text-muted-foreground/60"
                    >
                      <MoreVertical className="size-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isMine ? "end" : "start"}>
                    <DropdownMenuItem onSelect={() => startEdit(message)}>
                      <Pencil className="size-3.5" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem variant="destructive" onSelect={() => setDeleteTargetId(message.id)}>
                      <Trash2 className="size-3.5" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
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

      <AlertDialog open={deleteTargetId !== null} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete message?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the message for everyone in the chat. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
