"use client";

import { useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg } from "@fullcalendar/core";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskViewTabs } from "@/components/task/task-view-tabs";
import { TaskFormDialog } from "@/components/task/task-form-dialog";
import type { TaskWithAssignee } from "@/lib/queries/tasks";

const PRIORITY_HEX: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#10b981",
};

export function TaskCalendarView({
  tasks,
  members,
  projects = [],
}: {
  tasks: TaskWithAssignee[];
  members: { id: string; full_name: string }[];
  projects?: { id: string; name: string }[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithAssignee | null>(null);

  const tasksById = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);

  const events = useMemo(
    () =>
      tasks
        .filter((t) => t.due_date)
        .map((t) => ({
          id: t.id,
          title: t.name,
          start: t.due_date!,
          allDay: true,
          backgroundColor: PRIORITY_HEX[t.priority] ?? "#6366f1",
          borderColor: PRIORITY_HEX[t.priority] ?? "#6366f1",
          textColor: "#ffffff",
        })),
    [tasks],
  );

  function handleEventClick(arg: EventClickArg) {
    const task = tasksById.get(arg.event.id);
    if (task) {
      setEditingTask(task);
      setDialogOpen(true);
    }
  }

  function openCreate() {
    setEditingTask(null);
    setDialogOpen(true);
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold">Task</h1>
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4" />
          Add Task
        </Button>
      </div>

      <TaskViewTabs />

      <div className="flex-1 overflow-x-auto rounded-lg border bg-card p-2 sm:p-4">
        <div className="h-full min-w-[640px] [&_.fc-toolbar-title]:text-lg [&_.fc-button]:px-2 [&_.fc-button]:py-1 [&_.fc-button]:text-xs sm:[&_.fc-toolbar-title]:text-2xl sm:[&_.fc-button]:text-sm">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            height="100%"
            headerToolbar={{ left: "prev,next today", center: "title", right: "" }}
            events={events}
            eventClick={handleEventClick}
          />
        </div>
      </div>

      <TaskFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editingTask}
        members={members}
        projects={projects}
      />
    </div>
  );
}
