"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Send, MoreVertical, Pencil, Trash2, Check, X, Reply, Smile, Paperclip, FileText } from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { sendMessageAction, editMessageAction, deleteMessageAction, toggleReactionAction } from "@/lib/actions/discussion";
import { recordFileAction } from "@/lib/actions/documents";
import { uploadFileToStorage } from "@/lib/utils/upload-to-storage";
import { usePresenceStatus, usePresenceLastSeen } from "@/lib/presence/presence-context";
import { formatDateTime } from "@/lib/utils/format-date";
import type { ChannelWithMembers, MessageWithSender } from "@/lib/queries/discussion";

const QUICK_EMOJI = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

function channelDisplayName(channel: ChannelWithMembers, currentUserId: string) {
  if (channel.type === "group") return channel.name || "Group Chat";
  const other = channel.members.find((m) => m.profile_id !== currentUserId);
  return other?.profile.full_name ?? "Direct message";
}

function otherMemberId(channel: ChannelWithMembers, currentUserId: string) {
  if (channel.type !== "direct") return undefined;
  return channel.members.find((m) => m.profile_id !== currentUserId)?.profile_id;
}

function isReadByOthers(message: MessageWithSender, channel: ChannelWithMembers, currentUserId: string) {
  const others = channel.members.filter((m) => m.profile_id !== currentUserId);
  if (others.length === 0) return false;
  return others.every((m) => m.last_read_at && m.last_read_at >= message.created_at);
}

function ReadTicks({ read }: { read: boolean }) {
  return (
    <svg
      viewBox="0 0 16 10"
      className={`inline-block h-2.5 w-4 ${read ? "text-sky-400" : "text-primary-foreground/70"}`}
      fill="none"
    >
      <path d="M1 5l3 3 4-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 5l3 3 6-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChatHeaderStatus({ channel, currentUserId }: { channel: ChannelWithMembers; currentUserId: string }) {
  const otherId = otherMemberId(channel, currentUserId);
  const status = usePresenceStatus(otherId);
  const lastSeenAt = usePresenceLastSeen(otherId);

  if (channel.type !== "direct") {
    return <p className="text-xs text-muted-foreground">{channel.members.length} member(s)</p>;
  }
  if (status === "online") {
    return <p className="text-xs text-emerald-600 dark:text-emerald-400">Online</p>;
  }
  if (lastSeenAt) {
    return <p className="text-xs text-muted-foreground">Last seen {formatDateTime(new Date(lastSeenAt))}</p>;
  }
  return <p className="text-xs text-muted-foreground">Offline</p>;
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
  const [replyingTo, setReplyingTo] = useState<MessageWithSender | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          setMessages((prev) => [...prev, { ...row, sender: null, attachment: null, replyTo: null, reactions: [] }]);
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
    const replyToMessageId = replyingTo?.id ?? null;
    setReplyingTo(null);
    startTransition(async () => {
      const result = await sendMessageAction(channel.id, body, { replyToMessageId });
      if (result && "error" in result) toast.error(result.error);
    });
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setIsUploading(true);
    const uploaded = await uploadFileToStorage(file);
    if ("error" in uploaded) {
      toast.error(uploaded.error);
      setIsUploading(false);
      return;
    }

    const recorded = await recordFileAction({
      name: file.name,
      storagePath: uploaded.storagePath,
      mimeType: uploaded.mimeType,
      sizeBytes: uploaded.sizeBytes,
      source: "comment",
    });
    setIsUploading(false);

    if (recorded && "error" in recorded) {
      toast.error(recorded.error);
      return;
    }

    const replyToMessageId = replyingTo?.id ?? null;
    setReplyingTo(null);
    startTransition(async () => {
      const result = await sendMessageAction(channel.id, "", { attachmentFileId: recorded.id, replyToMessageId });
      if (result && "error" in result) toast.error(result.error);
    });
  }

  async function openAttachment(storagePath: string) {
    const supabase = createClient();
    const { data, error } = await supabase.storage.from("tp-documents").createSignedUrl(storagePath, 3600);
    if (error || !data) {
      toast.error(error?.message ?? "Could not open file");
      return;
    }
    window.open(data.signedUrl, "_blank");
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

  function handleReact(messageId: string, emoji: string) {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const withoutMine = m.reactions.filter((r) => r.profile_id !== currentUserId);
        const hadThis = m.reactions.some((r) => r.profile_id === currentUserId && r.emoji === emoji);
        return { ...m, reactions: hadThis ? withoutMine : [...withoutMine, { emoji, profile_id: currentUserId }] };
      }),
    );
    startTransition(async () => {
      const result = await toggleReactionAction(messageId, emoji);
      if (result && "error" in result) toast.error(result.error);
    });
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="border-b px-4 py-3">
        <p className="font-semibold">{channelDisplayName(channel, currentUserId)}</p>
        <ChatHeaderStatus channel={channel} currentUserId={currentUserId} />
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
          const isImage = message.attachment?.mime_type?.startsWith("image/");
          const reactionGroups = new Map<string, number>();
          for (const r of message.reactions) reactionGroups.set(r.emoji, (reactionGroups.get(r.emoji) ?? 0) + 1);
          const myReaction = message.reactions.find((r) => r.profile_id === currentUserId)?.emoji;

          return (
            <div key={message.id} className={`group flex flex-col ${isMine ? "items-end" : "items-start"}`}>
              <div className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : ""}`}>
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
                    {!message.is_deleted && message.replyTo && (
                      <div
                        className={`mb-1.5 rounded-lg border-l-2 px-2 py-1 text-xs ${
                          isMine
                            ? "border-primary-foreground/40 bg-primary-foreground/10"
                            : "border-primary/40 bg-background/60"
                        }`}
                      >
                        <p className="font-medium">{message.replyTo.sender?.full_name ?? "…"}</p>
                        <p className="truncate opacity-80">
                          {message.replyTo.is_deleted ? "This message was deleted" : message.replyTo.body}
                        </p>
                      </div>
                    )}

                    {message.is_deleted ? (
                      "This message was deleted"
                    ) : (
                      <>
                        {message.attachment &&
                          (isImage ? (
                            <button
                              type="button"
                              onClick={() => openAttachment(message.attachment!.storage_path)}
                              className="mb-1 block"
                            >
                              <span className="flex items-center gap-1.5 text-xs underline">
                                <FileText className="size-3.5" />
                                {message.attachment.name}
                              </span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openAttachment(message.attachment!.storage_path)}
                              className="mb-1 flex items-center gap-1.5 text-xs underline"
                            >
                              <FileText className="size-3.5" />
                              {message.attachment.name}
                            </button>
                          ))}
                        {message.body && <span>{message.body}</span>}
                        <div
                          className={`mt-0.5 flex items-center gap-1 text-[10px] ${isMine ? "justify-end text-primary-foreground/70" : "text-muted-foreground"}`}
                        >
                          {message.edited_at && <span>edited</span>}
                          {isMine && <ReadTicks read={isReadByOthers(message, channel, currentUserId)} />}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {!isEditing && !message.is_deleted && (
                  <div className="flex shrink-0 items-center opacity-0 group-hover:opacity-100">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button type="button" aria-label="React" className="rounded p-1 hover:bg-accent">
                          <Smile className="size-3.5 text-muted-foreground/70" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="flex w-auto flex-row gap-1 p-1.5" align="center">
                        {QUICK_EMOJI.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleReact(message.id, emoji)}
                            className={`rounded p-1 text-base hover:bg-accent ${myReaction === emoji ? "bg-accent" : ""}`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </PopoverContent>
                    </Popover>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          aria-label="Message options"
                          className="rounded p-1 hover:bg-accent"
                        >
                          <MoreVertical className="size-3.5 text-muted-foreground/70" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align={isMine ? "end" : "start"}>
                        <DropdownMenuItem onSelect={() => setReplyingTo(message)}>
                          <Reply className="size-3.5" />
                          Reply
                        </DropdownMenuItem>
                        {isMine && (
                          <>
                            <DropdownMenuItem onSelect={() => startEdit(message)}>
                              <Pencil className="size-3.5" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem variant="destructive" onSelect={() => setDeleteTargetId(message.id)}>
                              <Trash2 className="size-3.5" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>

              {reactionGroups.size > 0 && (
                <div className={`mt-1 flex flex-wrap gap-1 ${isMine ? "mr-9" : "ml-9"}`}>
                  {Array.from(reactionGroups.entries()).map(([emoji, count]) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleReact(message.id, emoji)}
                      className={`flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs ${
                        myReaction === emoji ? "border-primary bg-primary/10" : "bg-card"
                      }`}
                    >
                      <span>{emoji}</span>
                      <span className="text-muted-foreground">{count}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {replyingTo && (
        <div className="flex items-center justify-between gap-2 border-t bg-muted/40 px-4 py-2 text-xs">
          <div className="min-w-0">
            <p className="font-medium">Replying to {replyingTo.sender?.full_name ?? "…"}</p>
            <p className="truncate text-muted-foreground">
              {replyingTo.is_deleted ? "This message was deleted" : replyingTo.body}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setReplyingTo(null)}
            aria-label="Cancel reply"
            className="shrink-0 rounded p-1 hover:bg-accent"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 border-t p-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          aria-label="Attach file"
        >
          <Paperclip className="size-4 text-muted-foreground" />
        </button>
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
        <Input
          placeholder={isUploading ? "Uploading…" : "Type a message…"}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={isUploading}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button size="icon" onClick={handleSend} disabled={isPending || !draft.trim() || isUploading}>
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
