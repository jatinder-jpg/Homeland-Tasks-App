"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  Paperclip,
  Send,
  FileText,
  File as FileIcon,
  Image as ImageIcon,
  Contact as ContactIcon,
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  Check,
  X,
  MessageSquareQuote,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { AvatarBadge } from "@/components/task/avatar-badge";
import { createClient } from "@/lib/supabase/client";
import { getOrCreateTaskChannelAction, sendTaskCommentAction } from "@/lib/actions/task-comments";
import { editMessageAction, deleteMessageAction } from "@/lib/actions/discussion";
import { recordFileAction } from "@/lib/actions/documents";
import { getOrgMembersAction } from "@/lib/actions/tasks";
import { getQuickRepliesAction, type QuickReply } from "@/lib/actions/quick-replies";
import { uploadFileToStorage } from "@/lib/utils/upload-to-storage";
import type { TaskMessage } from "@/lib/queries/task-comments";

type ContactMember = { id: string; full_name: string; phone: string | null };

export function TaskCommentThread({ taskId }: { taskId: string }) {
  const [channelId, setChannelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<TaskMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState("");
  const [attachOpen, setAttachOpen] = useState(false);
  const [attachView, setAttachView] = useState<"menu" | "contact">("menu");
  const [members, setMembers] = useState<ContactMember[]>([]);
  const [contactSearch, setContactSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [quickReplyOpen, setQuickReplyOpen] = useState(false);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? ""));
    getOrgMembersAction().then((data) => setMembers(data as ContactMember[]));
    getQuickRepliesAction().then(setQuickReplies);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    getOrCreateTaskChannelAction(taskId).then((result) => {
      if (cancelled) return;
      setIsLoading(false);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setChannelId(result.channelId);
      setMessages(result.messages);
    });
    return () => {
      cancelled = true;
    };
  }, [taskId]);

  useEffect(() => {
    if (!channelId) return;
    const supabase = createClient();
    const rtChannel = supabase
      .channel(`task-comments:${channelId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "tp_discussion_messages", filter: `channel_id=eq.${channelId}` },
        (payload) => {
          const row = payload.new as TaskMessage;
          setMessages((prev) => [...prev, { ...row, sender: null, attachment: null }]);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "tp_discussion_messages", filter: `channel_id=eq.${channelId}` },
        (payload) => {
          const row = payload.new as TaskMessage;
          setMessages((prev) => prev.map((m) => (m.id === row.id ? { ...m, ...row } : m)));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(rtChannel);
    };
  }, [channelId]);

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  function handleSend() {
    const body = draft.trim();
    if (!body) return;
    if (!channelId) {
      toast.error("Comments are still loading, please try again in a moment");
      return;
    }
    setDraft("");
    startTransition(async () => {
      const result = await sendTaskCommentAction(channelId, taskId, body);
      if (result && "error" in result) toast.error(result.error);
    });
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!channelId) {
      toast.error("Comments are still loading, please try again in a moment");
      return;
    }

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
      taskId,
      source: "comment",
    });
    setIsUploading(false);

    if (recorded && "error" in recorded) {
      toast.error(recorded.error);
      return;
    }

    startTransition(async () => {
      const result = await sendTaskCommentAction(channelId, taskId, draft.trim(), recorded.id);
      if (result && "error" in result) toast.error(result.error);
      setDraft("");
    });
  }

  function handleSendContact(member: ContactMember) {
    if (!channelId) {
      toast.error("Comments are still loading, please try again in a moment");
      return;
    }
    setAttachOpen(false);
    setAttachView("menu");
    setContactSearch("");
    const contactText = `📇 ${member.full_name}${member.phone ? ` — ${member.phone}` : ""}`;
    startTransition(async () => {
      const result = await sendTaskCommentAction(channelId, taskId, contactText);
      if (result && "error" in result) toast.error(result.error);
    });
  }

  function startEdit(message: TaskMessage) {
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

  async function openAttachment(storagePath: string) {
    const supabase = createClient();
    const { data, error } = await supabase.storage.from("tp-documents").createSignedUrl(storagePath, 3600);
    if (error || !data) {
      toast.error(error?.message ?? "Could not open file");
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={messagesContainerRef} className="flex-1 space-y-3 overflow-y-auto p-3">
        {isLoading && (
          <p className="pt-10 text-center text-sm text-muted-foreground">Loading comments…</p>
        )}
        {!isLoading && messages.length === 0 && (
          <p className="pt-10 text-center text-sm text-muted-foreground">No comments yet. Say hello!</p>
        )}
        {messages.map((message) => {
          const isMine = message.sender_id === currentUserId;
          const senderName = message.sender?.full_name ?? "…";
          const isEditing = editingId === message.id;
          const isImage = message.attachment?.mime_type?.startsWith("image/");
          return (
            <div key={message.id} className={`group flex items-end gap-2 ${isMine ? "flex-row-reverse" : ""}`}>
              <AvatarBadge name={senderName} profileId={message.sender_id} />

              {isEditing ? (
                <div className="flex max-w-[75%] flex-1 items-center gap-1.5">
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
                  className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                    isMine ? "bg-primary text-primary-foreground" : "bg-muted"
                  } ${message.is_deleted ? "italic opacity-70" : ""}`}
                >
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
                      {message.edited_at && (
                        <div
                          className={`mt-0.5 text-[10px] ${isMine ? "text-right text-primary-foreground/70" : "text-muted-foreground"}`}
                        >
                          edited
                        </div>
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
                      aria-label="Comment options"
                      className="shrink-0 rounded p-1 opacity-100 hover:bg-accent sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <MoreVertical className="size-3.5 text-muted-foreground/70" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
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
      </div>

      <div className="flex items-center gap-2 border-t p-3">
        <Popover
          open={attachOpen}
          onOpenChange={(next) => {
            setAttachOpen(next);
            if (!next) {
              setAttachView("menu");
              setContactSearch("");
            }
          }}
        >
          <PopoverTrigger asChild>
            <button type="button" disabled={isUploading || !channelId} aria-label="Attach file">
              <Paperclip className="size-4 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-1.5" align="start" side="top">
            {attachView === "menu" ? (
              <div className="flex flex-col">
                <button
                  type="button"
                  className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm hover:bg-accent"
                  onClick={() => {
                    setAttachOpen(false);
                    fileInputRef.current?.click();
                  }}
                >
                  <FileIcon className="size-4 text-muted-foreground" />
                  File
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm hover:bg-accent"
                  onClick={() => {
                    setAttachOpen(false);
                    photoInputRef.current?.click();
                  }}
                >
                  <ImageIcon className="size-4 text-muted-foreground" />
                  Photo
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm hover:bg-accent"
                  onClick={() => setAttachView("contact")}
                >
                  <ContactIcon className="size-4 text-muted-foreground" />
                  Contact
                </button>
              </div>
            ) : (
              <div className="flex flex-col">
                <div className="relative mb-1">
                  <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    placeholder="Search people…"
                    className="h-8 pl-7 text-sm"
                    autoFocus
                  />
                </div>
                <div className="max-h-48 overflow-y-auto" onWheel={(e) => (e.currentTarget.scrollTop += e.deltaY)}>
                  {members
                    .filter((m) => m.full_name.toLowerCase().includes(contactSearch.trim().toLowerCase()))
                    .map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-accent"
                        onClick={() => handleSendContact(m)}
                      >
                        <AvatarBadge name={m.full_name} />
                        {m.full_name}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </PopoverContent>
        </Popover>
        {quickReplies.length > 0 && (
          <Popover open={quickReplyOpen} onOpenChange={setQuickReplyOpen}>
            <PopoverTrigger asChild>
              <button type="button" aria-label="Quick replies">
                <MessageSquareQuote className="size-4 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-1.5" align="start" side="top">
              <div className="flex flex-col">
                {quickReplies.map((reply) => (
                  <button
                    key={reply.id}
                    type="button"
                    className="rounded-md px-2.5 py-2 text-left text-sm hover:bg-accent"
                    onClick={() => {
                      setDraft(reply.text);
                      setQuickReplyOpen(false);
                    }}
                  >
                    {reply.text}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
        <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        <Input
          placeholder="Type a message…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={!channelId}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button size="icon" onClick={handleSend} disabled={isPending || !draft.trim() || !channelId}>
          <Send className="size-4" />
        </Button>
      </div>

      <AlertDialog open={deleteTargetId !== null} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete comment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the comment for everyone viewing this task. This cannot be undone.
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
