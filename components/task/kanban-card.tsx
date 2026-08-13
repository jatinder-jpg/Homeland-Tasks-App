"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Flag } from "lucide-react";
import { AvatarBadge } from "@/components/task/avatar-badge";
import { formatShortDate } from "@/lib/utils/format-date";
import type { TaskWithAssignee } from "@/lib/queries/tasks";

const PRIORITY_COLOR: Record<string, string> = {
  high: "text-red-500 fill-red-500",
  medium: "text-amber-500 fill-amber-500",
  low: "text-emerald-500 fill-emerald-500",
};

export function KanbanCard({
  task,
  onClick,
}: {
  task: TaskWithAssignee;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="cursor-grab space-y-2 rounded-lg border bg-card p-3 shadow-sm active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug">{task.name}</p>
        <Flag className={`size-3.5 shrink-0 ${PRIORITY_COLOR[task.priority] ?? ""}`} />
      </div>
      <div className="flex items-center justify-between">
        {task.due_date ? (
          <span className="text-xs text-muted-foreground">
            {formatShortDate(new Date(task.due_date + "T00:00:00"))}
          </span>
        ) : (
          <span />
        )}
        {task.assignees.length === 0 ? (
          <AvatarBadge name={null} />
        ) : (
          <div className="flex shrink-0 -space-x-2">
            {task.assignees.slice(0, 3).map((a) => (
              <div key={a.id} className="ring-2 ring-card rounded-full">
                <AvatarBadge name={a.full_name} />
              </div>
            ))}
            {task.assignees.length > 3 && (
              <span className="relative flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground ring-2 ring-card">
                +{task.assignees.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
