"use client";

import { useTransition } from "react";
import { CheckCircle2, Circle, Pin, Flag, MapPin, Repeat } from "lucide-react";
import { toast } from "sonner";
import { toggleTaskCompleteAction, togglePinAction } from "@/lib/actions/tasks";
import { AvatarBadge } from "@/components/task/avatar-badge";
import { Checkbox } from "@/components/ui/checkbox";
import { formatShortDate } from "@/lib/utils/format-date";
import type { TaskWithAssignee } from "@/lib/queries/tasks";

const PRIORITY_COLOR: Record<string, string> = {
  high: "text-red-500 fill-red-500",
  medium: "text-amber-500 fill-amber-500",
  low: "text-emerald-500 fill-emerald-500",
};

export function TaskRow({
  task,
  onClick,
  selectable,
  selected,
  onToggleSelect,
}: {
  task: TaskWithAssignee;
  onClick: () => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const done = task.status === "done";

  function toggleComplete(e: React.MouseEvent) {
    e.stopPropagation();
    startTransition(async () => {
      const result = await toggleTaskCompleteAction(task.id, !done);
      if (result && "error" in result) toast.error(result.error);
    });
  }

  function togglePin(e: React.MouseEvent) {
    e.stopPropagation();
    startTransition(async () => {
      const result = await togglePinAction(task.id, !task.is_pinned);
      if (result && "error" in result) toast.error(result.error);
    });
  }

  return (
    <div
      onClick={selectable ? onToggleSelect : onClick}
      className={`flex cursor-pointer items-center gap-3 border-b px-4 py-3 last:border-b-0 hover:bg-accent/50 ${isPending ? "opacity-60" : ""}`}
    >
      {selectable && (
        <Checkbox
          checked={Boolean(selected)}
          onCheckedChange={() => onToggleSelect?.()}
          onClick={(e) => e.stopPropagation()}
        />
      )}

      <button onClick={toggleComplete} aria-label={done ? "Mark incomplete" : "Mark complete"}>
        {done ? (
          <CheckCircle2 className="size-5 text-emerald-500" />
        ) : (
          <Circle className="size-5 text-muted-foreground" />
        )}
      </button>

      <button onClick={togglePin} aria-label={task.is_pinned ? "Unpin" : "Pin"}>
        <Pin
          className={`size-4 ${task.is_pinned ? "fill-primary text-primary" : "text-muted-foreground/40"}`}
        />
      </button>

      <Flag className={`size-4 shrink-0 ${PRIORITY_COLOR[task.priority] ?? ""}`} />

      {task.site_visit && (
        <MapPin className="size-4 shrink-0 text-sky-500" aria-label="Site visit required" />
      )}

      {task.is_recurring && (
        <Repeat className="size-4 shrink-0 text-violet-500" aria-label="Recurring task" />
      )}

      <span className={`flex-1 truncate text-sm ${done ? "text-muted-foreground line-through" : ""}`}>
        {task.name}
      </span>

      {task.team && (
        <span className="hidden shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground sm:inline">
          {task.team.name}
        </span>
      )}

      {task.due_date && (
        <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
          {formatShortDate(new Date(task.due_date + "T00:00:00"))}
        </span>
      )}

      <AvatarBadge name={task.assignee?.full_name ?? null} />
    </div>
  );
}
