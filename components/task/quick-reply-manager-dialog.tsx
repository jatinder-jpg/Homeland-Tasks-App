"use client";

import { useEffect, useState, useTransition } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getQuickRepliesAction,
  createQuickReplyAction,
  deleteQuickReplyAction,
  type QuickReply,
} from "@/lib/actions/quick-replies";
import { createClient } from "@/lib/supabase/client";

export function QuickReplyManagerDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [replies, setReplies] = useState<QuickReply[]>([]);
  const [newText, setNewText] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    getQuickRepliesAction().then(setReplies);
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? ""));
  }, [open]);

  function refresh() {
    getQuickRepliesAction().then(setReplies);
  }

  function handleCreate() {
    const text = newText.trim();
    if (!text) return;
    setNewText("");
    startTransition(async () => {
      const result = await createQuickReplyAction(text);
      if (result && "error" in result) {
        toast.error(result.error);
        return;
      }
      refresh();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteQuickReplyAction(id);
      if (result && "error" in result) {
        toast.error(result.error);
        return;
      }
      refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Replies</DialogTitle>
          <DialogDescription>
            Saved snippets anyone can drop into a task comment with one click. Everyone in the org can use
            these; you can only delete the ones you added.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-64 space-y-1.5 overflow-y-auto">
          {replies.length === 0 && <p className="text-sm text-muted-foreground">No quick replies yet.</p>}
          {replies.map((reply) => (
            <div key={reply.id} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
              <span className="text-sm">{reply.text}</span>
              {reply.created_by === currentUserId && (
                <button
                  onClick={() => handleDelete(reply.id)}
                  aria-label="Delete quick reply"
                  disabled={isPending}
                  className="shrink-0"
                >
                  <X className="size-4 text-muted-foreground hover:text-destructive" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="e.g. Noted, will update shortly"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCreate();
              }
            }}
          />
          <Button type="button" onClick={handleCreate} disabled={isPending || !newText.trim()}>
            Add
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
