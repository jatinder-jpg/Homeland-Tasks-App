"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AvatarBadge } from "@/components/task/avatar-badge";
import { createChannelAction } from "@/lib/actions/discussion";

export function NewChatDialog({
  open,
  onOpenChange,
  mode,
  members,
  currentUserId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "group" | "direct";
  members: { id: string; full_name: string }[];
  currentUserId: string;
  onCreated: (channelId: string) => void;
}) {
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const selectableMembers = members.filter((m) => m.id !== currentUserId);

  useEffect(() => {
    if (open) {
      setName("");
      setSelected([]);
    }
  }, [open]);

  function toggleMember(id: string) {
    if (mode === "direct") {
      setSelected([id]);
      return;
    }
    setSelected((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));
  }

  function handleSubmit() {
    if (selectableMembers.length > 0 && selected.length === 0) {
      toast.error("Select at least one member");
      return;
    }
    startTransition(async () => {
      const result = await createChannelAction({
        type: mode,
        name: mode === "group" ? name || undefined : undefined,
        memberIds: [currentUserId, ...selected],
      });
      if (result && "error" in result) {
        toast.error(result.error);
        return;
      }
      onOpenChange(false);
      if (result && "id" in result) onCreated(result.id);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "group" ? "New Group Chat" : "New Member Chat"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {mode === "group" && (
            <div className="space-y-1.5">
              <Label htmlFor="chat-name">Chat name</Label>
              <Input
                id="chat-name"
                placeholder="e.g. Marketing Team"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label>{mode === "group" ? "Members" : "Choose a teammate"}</Label>
            <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border p-2">
              {selectableMembers.length === 0 && (
                <p className="p-3 text-center text-sm text-muted-foreground">
                  No other teammates in your workspace yet.
                </p>
              )}
              {selectableMembers.map((member) => (
                <label
                  key={member.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent"
                >
                  {mode === "group" ? (
                    <Checkbox
                      checked={selected.includes(member.id)}
                      onCheckedChange={() => toggleMember(member.id)}
                    />
                  ) : (
                    <input
                      type="radio"
                      name="direct-member"
                      checked={selected.includes(member.id)}
                      onChange={() => toggleMember(member.id)}
                      className="size-4"
                    />
                  )}
                  <AvatarBadge name={member.full_name} />
                  <span className="text-sm">{member.full_name}</span>
                </label>
              ))}
              {mode === "group" && (
                <div className="flex items-center gap-2 rounded-md px-2 py-1.5 opacity-60">
                  <Checkbox checked disabled />
                  <AvatarBadge name="You" />
                  <span className="text-sm">You (always included)</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
