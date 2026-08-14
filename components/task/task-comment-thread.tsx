"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Paperclip, Send, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AvatarBadge } from "@/components/task/avatar-badge";
import { createClient } from "@/lib/supabase/client";
import { getOrCreateTaskChannelAction, sendTaskCommentAction } from "@/lib/actions/task-comments";
import { recordFileAction } from "@/lib/actions/documents";
import { uploadFileToStorage } from "@/lib/utils/upload-to-storage";
import type { TaskMessage } from "@/lib/queries/task-comments";

export function TaskCommentThread({ taskId }: { taskId: string }) {
  const [channelId, setChannelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<TaskMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? ""));
  }, []);

  useEffect(() => {
    let cancelled = false;
    getOrCreateTaskChannelAction(taskId).then((result) => {
      if (cancelled) return;
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
    if (!body || !channelId) return;
    setDraft("");
    startTransition(async () => {
      const result = await sendTaskCommentAction(channelId, taskId, body);
      if (result && "error" in result) toast.error(result.error);
    });
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !channelId) return;

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
        {messages.length === 0 && (
          <p className="pt-10 text-center text-sm text-muted-foreground">No comments yet. Say hello!</p>
        )}
        {messages.map((message) => {
          const isMine = message.sender_id === currentUserId;
          const senderName = message.sender?.full_name ?? "…";
          const isImage = message.attachment?.mime_type?.startsWith("image/");
          return (
            <div key={message.id} className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : ""}`}>
              <AvatarBadge name={senderName} />
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                  isMine ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
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
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 border-t p-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || !channelId}
          aria-label="Attach file"
        >
          <Paperclip className="size-4 text-muted-foreground" />
        </button>
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
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
    </div>
  );
}
