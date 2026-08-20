"use client";

import { useTransition } from "react";
import { CheckCircle2, Circle, Pin, Flag, MapPin, Repeat, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { toggleTaskCompleteAction, togglePinAction } from "@/lib/actions/tasks";
import { AvatarBadge } from "@/components/task/avatar-badge";
import { Checkbox } from "@/components/ui/checkbox";
import { formatShortDate } from "@/lib/utils/format-date";
import type { TaskWithAssignee } from "@/lib/queries/tasks";
import { DEFAULT_COLUMNS, buildGridTemplate, type ColumnKey } from "@/lib/utils/task-columns";

const PRIORITY_COLOR: Record<string, string> = {
  high: "text-red-500 fill-red-500",
  medium: "text-amber-500 fill-amber-500",
  low: "text-emerald-500 fill-emerald-500",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  approval_awaiting: "Approval Awaiting",
  in_progress: "In Progress",
  on_hold: "On Hold",
  third_party_pending: "Third Party Pending",
  under_review: "Under Review",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-500",
  approval_awaiting: "bg-rose-700",
  in_progress: "bg-fuchsia-700",
  on_hold: "bg-violet-600",
  third_party_pending: "bg-pink-500",
  under_review: "bg-blue-500",
};

function AvatarStack({ people }: { people: { id: string; full_name: string }[] }) {
  if (people.length === 0) return <AvatarBadge name={null} />;
  return (
    <div className="flex shrink-0 -space-x-2">
      {people.slice(0, 3).map((p) => (
        <div key={p.id} className="ring-2 ring-card rounded-full">
          <AvatarBadge name={p.full_name} profileId={p.id} />
        </div>
      ))}
      {people.length > 3 && (
        <span className="relative flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground ring-2 ring-card">
          +{people.length - 3}
        </span>
      )}
    </div>
  );
}

export function TaskRow({
  task,
  onClick,
  selectable,
  selected,
  onToggleSelect,
  dateType = "due",
  columns = DEFAULT_COLUMNS,
  gridTemplate,
}: {
  task: TaskWithAssignee;
  onClick: () => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  dateType?: "due" | "created";
  columns?: ColumnKey[];
  gridTemplate?: string;
}) {
  const resolvedGridTemplate = gridTemplate ?? buildGridTemplate(columns);
  const [isPending, startTransition] = useTransition();
  const done = task.status === "done";
  const today = new Date().toISOString().slice(0, 10);
  const isOverdue = Boolean(task.due_date && task.due_date < today && !done);

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

  const dueDateLabel =
    dateType === "created"
      ? formatShortDate(new Date(task.created_at))
      : task.due_date
        ? formatShortDate(new Date(task.due_date + "T00:00:00"))
        : null;

  function renderColumn(key: ColumnKey) {
    switch (key) {
      case "dueDate":
        return (
          <span
            key={key}
            className={`text-xs ${isOverdue ? "font-medium text-destructive" : "text-muted-foreground"}`}
          >
            {dueDateLabel ?? "—"}
          </span>
        );
      case "assignees":
        return <AvatarStack key={key} people={task.assignees} />;
      case "follower":
        return <AvatarStack key={key} people={task.followers} />;
      case "status":
        return task.workflow_status ? (
          <span
            key={key}
            className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
          >
            <span
              className={`size-1.5 shrink-0 rounded-full ${STATUS_COLOR[task.workflow_status] ?? "bg-muted-foreground"}`}
            />
            {STATUS_LABEL[task.workflow_status] ?? task.workflow_status}
          </span>
        ) : (
          <span key={key} />
        );
      case "project":
        return (
          <span key={key} className="truncate text-xs text-muted-foreground">
            {task.project?.name ?? "—"}
          </span>
        );
      case "service":
        return (
          <span key={key} className="truncate text-xs text-muted-foreground">
            {task.service?.name ?? "—"}
          </span>
        );
      case "client":
        return (
          <span key={key} className="truncate text-xs text-muted-foreground">
            {task.client?.name ?? "—"}
          </span>
        );
      case "createdDate":
        return (
          <span key={key} className="text-xs text-muted-foreground">
            {formatShortDate(new Date(task.created_at))}
          </span>
        );
      default:
        return <span key={key} />;
    }
  }

  const unread = task.hasUnreadComment;

  return (
    <div
      onClick={selectable ? onToggleSelect : onClick}
      className={`flex cursor-pointer items-center gap-3 border-b px-4 py-3 last:border-b-0 hover:bg-accent/50 ${isPending ? "opacity-60" : ""} ${unread ? "bg-primary/5" : ""}`}
    >
      {selectable && (
        <Checkbox
          checked={Boolean(selected)}
          onCheckedChange={() => onToggleSelect?.()}
          onClick={(e) => e.stopPropagation()}
        />
      )}

      <div className="grid flex-1 items-center gap-3" style={{ gridTemplateColumns: resolvedGridTemplate }}>
        <div className="flex min-w-0 items-center gap-3">
          <button onClick={toggleComplete} aria-label={done ? "Mark incomplete" : "Mark complete"}>
            {done ? (
              <CheckCircle2 className="size-5 shrink-0 text-emerald-500" />
            ) : (
              <Circle className="size-5 shrink-0 text-muted-foreground" />
            )}
          </button>

          <button onClick={togglePin} aria-label={task.is_pinned ? "Unpin" : "Pin"}>
            <Pin
              className={`size-4 shrink-0 ${task.is_pinned ? "fill-primary text-primary" : "text-muted-foreground/40"}`}
            />
          </button>

          <Flag className={`size-4 shrink-0 ${PRIORITY_COLOR[task.priority] ?? ""}`} />

          {task.site_visit && (
            <MapPin className="size-4 shrink-0 text-sky-500" aria-label="Site visit required" />
          )}

          {task.is_recurring && (
            <Repeat className="size-4 shrink-0 text-violet-500" aria-label="Recurring task" />
          )}

          <span
            className={`min-w-0 flex-1 truncate text-sm ${done ? "text-muted-foreground line-through" : unread ? "font-semibold" : ""}`}
          >
            {task.name}
          </span>

          {task.departments.length > 0 && (
            <span className="hidden shrink-0 gap-1 lg:flex">
              {task.departments.slice(0, 2).map((d) => (
                <span key={d.id} className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                  {d.name}
                </span>
              ))}
              {task.departments.length > 2 && (
                <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                  +{task.departments.length - 2}
                </span>
              )}
            </span>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            aria-label={unread ? "Comments (unread)" : "Comments"}
            title={unread ? "New comment — click to open" : "Comments"}
            className="relative shrink-0 text-muted-foreground/60 hover:text-foreground"
          >
            <MessageSquare className="size-4" />
            {unread && (
              <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-red-500 ring-2 ring-card" />
            )}
          </button>
        </div>

        {columns.map(renderColumn)}
      </div>
    </div>
  );
}
