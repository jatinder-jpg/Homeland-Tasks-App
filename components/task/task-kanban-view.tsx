"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Plus, Settings } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskViewTabs } from "@/components/task/task-view-tabs";
import { KanbanColumn } from "@/components/task/kanban-column";
import { TaskFormDialog } from "@/components/task/task-form-dialog";
import { PipelineSettingsDialog } from "@/components/task/pipeline-settings-dialog";
import {
  updateTaskStatusAction,
  updateTaskPositionAction,
  updateTaskPipelineStageAction,
} from "@/lib/actions/tasks";
import { getVisiblePipelinesAction } from "@/lib/actions/pipelines";
import { createClient } from "@/lib/supabase/client";
import type { TaskWithAssignee } from "@/lib/queries/tasks";
import type { PipelineWithStages } from "@/lib/queries/pipelines";

type Status = "open" | "in_progress" | "done";

const COLUMNS: { id: string; title: string }[] = [
  { id: "open", title: "To Do" },
  { id: "in_progress", title: "In Progress" },
  { id: "done", title: "Done" },
];

const NONE_STAGE = "__none__";

export function TaskKanbanView({
  tasks,
  members,
  projects = [],
}: {
  tasks: TaskWithAssignee[];
  members: { id: string; full_name: string }[];
  projects?: { id: string; name: string }[];
}) {
  const [items, setItems] = useState(tasks);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithAssignee | null>(null);
  const [pipelines, setPipelines] = useState<PipelineWithStages[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? ""));
  }, []);

  function refreshPipelines() {
    getVisiblePipelinesAction().then(setPipelines);
  }

  useEffect(() => {
    refreshPipelines();
  }, []);

  const selectedPipeline = pipelines.find((p) => p.id === selectedPipelineId) ?? null;

  const boardColumns = useMemo(
    () =>
      selectedPipeline
        ? [{ id: NONE_STAGE, title: "Unassigned" }, ...selectedPipeline.stages.map((s) => ({ id: s.id, title: s.name }))]
        : COLUMNS,
    [selectedPipeline],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const columns = useMemo(() => {
    const grouped: Record<string, TaskWithAssignee[]> = {};
    for (const col of boardColumns) grouped[col.id] = [];

    for (const task of items) {
      if (selectedPipeline) {
        const key = task.pipeline_stage_id && grouped[task.pipeline_stage_id] ? task.pipeline_stage_id : NONE_STAGE;
        grouped[key].push(task);
      } else {
        const status = (task.status as Status) ?? "open";
        (grouped[status] ?? grouped.open).push(task);
      }
    }
    return grouped;
  }, [items, boardColumns, selectedPipeline]);

  function findColumnOf(id: string): string | undefined {
    return Object.keys(columns).find((key) => columns[key].some((t) => t.id === id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const sourceColumn = findColumnOf(activeId);
    const destColumn = boardColumns.some((c) => c.id === overId) ? overId : findColumnOf(overId);

    if (!sourceColumn || !destColumn) return;

    setItems((prev) => {
      const task = prev.find((t) => t.id === activeId);
      if (!task) return prev;

      if (sourceColumn === destColumn) {
        const colTasks = columns[sourceColumn];
        const oldIndex = colTasks.findIndex((t) => t.id === activeId);
        const newIndex = colTasks.findIndex((t) => t.id === overId);
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return prev;
        const reordered = arrayMove(colTasks, oldIndex, newIndex);
        reordered.forEach((t, i) => updateTaskPositionAction(t.id, i));
        const colIds = new Set(colTasks.map((t) => t.id));
        const others = prev.filter((t) => !colIds.has(t.id));
        return [...others, ...reordered];
      }

      if (selectedPipeline) {
        const stageId = destColumn === NONE_STAGE ? null : destColumn;
        updateTaskPipelineStageAction(activeId, stageId).then((result) => {
          if (result && "error" in result) toast.error(result.error);
        });
        return prev.map((t) => (t.id === activeId ? { ...t, pipeline_stage_id: stageId } : t));
      }

      updateTaskStatusAction(activeId, destColumn as Status).then((result) => {
        if (result && "error" in result) toast.error(result.error);
      });

      return prev.map((t) => (t.id === activeId ? { ...t, status: destColumn } : t));
    });
  }

  function openEdit(task: TaskWithAssignee) {
    setEditingTask(task);
    setDialogOpen(true);
  }

  function openCreate() {
    setEditingTask(null);
    setDialogOpen(true);
  }

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold">Task</h1>
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4" />
          Add Task
        </Button>
      </div>

      <TaskViewTabs />

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Select Pipeline:</span>
        <Select
          value={selectedPipelineId ?? "none"}
          onValueChange={(v) => setSelectedPipelineId(v === "none" ? null : v)}
        >
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Default board</SelectItem>
            {pipelines.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(true)}>
          <Settings className="size-4" />
          Setting
        </Button>
      </div>

      <DndContext
        id="task-kanban"
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-1 gap-4 overflow-x-auto pb-4">
          {boardColumns.map((col) => (
            <KanbanColumn
              key={col.id}
              id={col.id}
              title={col.title}
              tasks={columns[col.id] ?? []}
              onCardClick={openEdit}
            />
          ))}
        </div>
      </DndContext>

      <TaskFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editingTask}
        members={members}
        projects={projects}
      />

      <PipelineSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        pipelines={pipelines}
        currentUserId={currentUserId}
        onChanged={refreshPipelines}
      />
    </div>
  );
}
