"use client";

import { useEffect, useState } from "react";
import { AvatarBadge } from "@/components/task/avatar-badge";
import { getTaskActivityAction, type TaskActivityEntry, type TaskReadReceipt } from "@/lib/actions/task-activity";
import { formatDateTime } from "@/lib/utils/format-date";

const ACTION_LABEL: Record<string, string> = {
  updated: "updated this task",
  status_changed: "changed the status",
  archived: "archived this task",
  unarchived: "unarchived this task",
  completed: "marked this task complete",
  reopened: "reopened this task",
  opened: "opened this task",
  commented: "commented on this task",
};

export function TaskActivityLog({ taskId, relevantProfileIds }: { taskId: string; relevantProfileIds: string[] }) {
  const [entries, setEntries] = useState<TaskActivityEntry[]>([]);
  const [reads, setReads] = useState<TaskReadReceipt[]>([]);

  useEffect(() => {
    getTaskActivityAction(taskId).then(({ entries, reads }) => {
      setEntries(entries);
      setReads(reads);
    });
  }, [taskId]);

  const totalRelevant = new Set(relevantProfileIds).size;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3">
      <div className="mb-1 px-1 text-xs font-medium text-muted-foreground">
        Read By ({reads.length}/{totalRelevant || reads.length})
      </div>
      <div className="mb-4 space-y-1 rounded-md border p-2">
        {reads.length === 0 && <p className="p-2 text-center text-sm text-muted-foreground">No one yet.</p>}
        {reads.map((r) => (
          <div key={r.profile_id} className="flex items-center gap-2 py-1">
            <AvatarBadge name={r.profile?.full_name ?? null} />
            <span className="flex-1 text-sm">{r.profile?.full_name}</span>
            <span className="text-xs text-muted-foreground">
              {formatDateTime(new Date(r.read_at))}
            </span>
          </div>
        ))}
      </div>

      <div className="mb-1 px-1 text-xs font-medium text-muted-foreground">Activity</div>
      <div className="space-y-2">
        {entries.length === 0 && <p className="p-2 text-center text-sm text-muted-foreground">No activity yet.</p>}
        {entries.map((entry) => (
          <div key={entry.id} className="rounded-md border p-2 text-sm">
            <span className="font-medium">{entry.actor?.full_name ?? "Someone"}</span>{" "}
            <span className="text-muted-foreground">{entry.detail || ACTION_LABEL[entry.action] || entry.action}</span>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {formatDateTime(new Date(entry.created_at))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
