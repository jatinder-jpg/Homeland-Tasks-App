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
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AvatarBadge } from "@/components/task/avatar-badge";
import {
  getFolderSharesAction,
  getFileSharesAction,
  shareFolderAction,
  shareFileAction,
} from "@/lib/actions/documents";

export function ShareDialog({
  open,
  onOpenChange,
  itemType,
  itemId,
  itemName,
  members,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemType: "folder" | "file";
  itemId: string;
  itemName: string;
  members: { id: string; full_name: string }[];
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setIsLoading(true);
    const fetchShares = itemType === "folder" ? getFolderSharesAction : getFileSharesAction;
    fetchShares(itemId).then((shares) => {
      setSelected(shares.map((s) => s.id));
      setIsLoading(false);
    });
  }, [open, itemType, itemId]);

  function toggleMember(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));
  }

  function handleSubmit() {
    startTransition(async () => {
      const action = itemType === "folder" ? shareFolderAction : shareFileAction;
      const result = await action(itemId, selected);
      if (result && "error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Sharing updated");
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Share &quot;{itemName}&quot;</DialogTitle>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label>Employees</Label>
          <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border p-2">
            {isLoading ? (
              <p className="p-3 text-center text-sm text-muted-foreground">Loading…</p>
            ) : members.length === 0 ? (
              <p className="p-3 text-center text-sm text-muted-foreground">No other teammates in your workspace yet.</p>
            ) : (
              members.map((member) => (
                <label
                  key={member.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent"
                >
                  <Checkbox
                    checked={selected.includes(member.id)}
                    onCheckedChange={() => toggleMember(member.id)}
                  />
                  <AvatarBadge name={member.full_name} />
                  <span className="text-sm">{member.full_name}</span>
                </label>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || isLoading}>
            {isPending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
