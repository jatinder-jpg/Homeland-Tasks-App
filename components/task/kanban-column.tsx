"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { KanbanCard } from "@/components/task/kanban-card";
import type { TaskWithAssignee } from "@/lib/queries/tasks";

export function KanbanColumn({
  id,
  title,
  tasks,
  onCardClick,
}: {
  id: string;
  title: string;
  tasks: TaskWithAssignee[];
  onCardClick: (task: TaskWithAssignee) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex w-[82vw] shrink-0 flex-col rounded-lg bg-muted/30 sm:w-72">
      <div className="flex items-center justify-between px-3 py-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
          {tasks.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex min-h-24 flex-1 flex-col gap-2 rounded-b-lg p-2 transition-colors ${isOver ? "bg-primary/5" : ""}`}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <KanbanCard key={task.id} task={task} onClick={() => onCardClick(task)} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
