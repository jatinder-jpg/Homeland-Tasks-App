"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
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
import { createPipelineAction, deletePipelineAction } from "@/lib/actions/pipelines";
import type { PipelineWithStages } from "@/lib/queries/pipelines";

export function PipelineSettingsDialog({
  open,
  onOpenChange,
  pipelines,
  currentUserId,
  onChanged,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pipelines: PipelineWithStages[];
  currentUserId: string;
  onChanged: () => void;
}) {
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [stages, setStages] = useState<string[]>([]);
  const [newStage, setNewStage] = useState("");
  const [isPending, startTransition] = useTransition();

  function addStage() {
    const trimmed = newStage.trim();
    if (!trimmed) return;
    setStages((prev) => [...prev, trimmed]);
    setNewStage("");
  }

  function removeStage(index: number) {
    setStages((prev) => prev.filter((_, i) => i !== index));
  }

  function handleCreate() {
    if (!name.trim()) {
      toast.error("Pipeline name is required");
      return;
    }
    if (stages.length === 0) {
      toast.error("Add at least one stage");
      return;
    }
    startTransition(async () => {
      const result = await createPipelineAction({ name: name.trim(), visibility, stageNames: stages });
      if (result && "error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Pipeline created");
      setName("");
      setStages([]);
      setVisibility("public");
      onChanged();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deletePipelineAction(id);
      if (result && "error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Pipeline deleted");
      onChanged();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Custom Pipeline</DialogTitle>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
          <div className="space-y-1.5">
            {pipelines.length === 0 && (
              <p className="text-sm text-muted-foreground">No pipelines yet.</p>
            )}
            {pipelines.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                <div>
                  <span className="text-sm font-medium">{p.name}</span>
                  <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                    {p.visibility}
                  </span>
                  <p className="text-xs text-muted-foreground">{p.stages.map((s) => s.name).join(" → ")}</p>
                </div>
                {p.created_by === currentUserId && (
                  <button onClick={() => handleDelete(p.id)} aria-label="Delete pipeline" disabled={isPending}>
                    <X className="size-4 text-muted-foreground hover:text-destructive" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-3 border-t pt-4">
            <div className="space-y-1.5">
              <Label>Pipeline name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sales Pipeline" />
            </div>

            <div className="space-y-1.5">
              <Label>Stages</Label>
              <div className="space-y-1 rounded-md border p-2">
                {stages.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 py-0.5">
                    <span className="flex-1 text-sm">{s}</span>
                    <button type="button" onClick={() => removeStage(i)} aria-label="Remove stage">
                      <X className="size-3.5 text-muted-foreground" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2 pt-1">
                  <Input
                    value={newStage}
                    onChange={(e) => setNewStage(e.target.value)}
                    placeholder="Add a status"
                    className="h-8 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addStage();
                      }
                    }}
                  />
                  <Button type="button" size="sm" variant="outline" onClick={addStage}>
                    Add
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="radio"
                  checked={visibility === "public"}
                  onChange={() => setVisibility("public")}
                />
                Public
              </label>
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="radio"
                  checked={visibility === "private"}
                  onChange={() => setVisibility("private")}
                />
                Private
              </label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button type="button" onClick={handleCreate} disabled={isPending}>
            {isPending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
