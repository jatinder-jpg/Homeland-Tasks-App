"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getBackupDataAction, wipeOrgDataAction, restoreBackupAction, type BackupPayload } from "@/lib/actions/data-management";

function downloadBackup(backup: BackupPayload) {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function DangerZoneSection() {
  const [isPending, startTransition] = useTransition();
  const [wipeDialogOpen, setWipeDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const restoreInputRef = useRef<HTMLInputElement>(null);

  function handleDownloadBackup() {
    startTransition(async () => {
      const result = await getBackupDataAction();
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      downloadBackup(result);
      toast.success("Backup downloaded");
    });
  }

  function handleRestoreFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      let backup: BackupPayload;
      try {
        backup = JSON.parse(reader.result as string);
      } catch {
        toast.error("That file isn't valid JSON");
        return;
      }
      startTransition(async () => {
        const result = await restoreBackupAction(backup);
        if (result && "error" in result) {
          toast.error(result.error);
          return;
        }
        toast.success(`Restored ${result.restoredTasks} task(s) and ${result.restoredChannels} chat(s)`);
      });
    };
    reader.readAsText(file);
  }

  function handleWipeConfirm() {
    startTransition(async () => {
      const backup = await getBackupDataAction();
      if ("error" in backup) {
        toast.error(backup.error);
        return;
      }
      downloadBackup(backup);

      const result = await wipeOrgDataAction("DELETE");
      if (result && "error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("All tasks and conversations have been wiped");
      setWipeDialogOpen(false);
      setConfirmText("");
      window.location.href = "/dashboard";
    });
  }

  return (
    <Card className="max-w-lg space-y-5 border-destructive/30 p-6">
      <div>
        <h2 className="font-heading text-base font-semibold">Danger Zone</h2>
        <p className="text-sm text-muted-foreground">Super admin only. These actions affect the whole organization.</p>
      </div>

      <div className="space-y-2">
        <Label>Backup</Label>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleDownloadBackup} disabled={isPending}>
            Download Backup
          </Button>
          <Button variant="outline" onClick={() => restoreInputRef.current?.click()} disabled={isPending}>
            Restore from Backup
          </Button>
          <input ref={restoreInputRef} type="file" accept=".json" className="hidden" onChange={handleRestoreFile} />
        </div>
        <p className="text-xs text-muted-foreground">
          Downloads a JSON file of all tasks and conversations. Restoring re-imports that data as new records — it
          is not an exact undo, and original relationships (like project or client links, or exact chat membership)
          are not guaranteed to be preserved.
        </p>
      </div>

      <div className="space-y-2 border-t pt-5">
        <Label className="text-destructive">Wipe App Data</Label>
        <p className="text-xs text-muted-foreground">
          Permanently deletes every task and every conversation in this organization. Projects, People, Documents,
          Notes, and Settings are not affected. A backup downloads automatically first.
        </p>
        <Button variant="destructive" onClick={() => setWipeDialogOpen(true)} disabled={isPending}>
          Wipe App Data
        </Button>
      </div>

      <AlertDialog
        open={wipeDialogOpen}
        onOpenChange={(open) => {
          setWipeDialogOpen(open);
          if (!open) setConfirmText("");
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Wipe all tasks and conversations?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes every task and every Discussion chat in Homeland Tasks for this
              organization. This cannot be undone from within the app — a backup file will download automatically
              before anything is deleted, and you can restore from it afterward. Projects, People, Documents, Notes,
              and Settings are not touched.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="wipe-confirm">
              Type <span className="font-mono font-semibold">DELETE</span> to confirm
            </Label>
            <Input
              id="wipe-confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoComplete="off"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="destructive" disabled={confirmText !== "DELETE" || isPending} onClick={handleWipeConfirm}>
              {isPending ? "Wiping…" : "Wipe App Data"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
