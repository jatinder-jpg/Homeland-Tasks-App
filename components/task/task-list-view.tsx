"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Filter, Plus, Search, SlidersHorizontal, MoreHorizontal, ListChecks, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TaskViewTabs } from "@/components/task/task-view-tabs";
import { TaskRow } from "@/components/task/task-row";
import { TaskFormDialog } from "@/components/task/task-form-dialog";
import { groupTasksForList, GROUP_ORDER, GROUP_LABELS } from "@/lib/utils/task-grouping";
import {
  bulkUpdateStatusAction,
  bulkAssignAction,
  bulkArchiveAction,
  bulkDeleteAction,
} from "@/lib/actions/tasks";
import type { TaskWithAssignee } from "@/lib/queries/tasks";

export function TaskListView({
  tasks,
  draftTasks,
  archivedTasks,
  recurringTasks,
  members,
  projects = [],
}: {
  tasks: TaskWithAssignee[];
  draftTasks: TaskWithAssignee[];
  archivedTasks: TaskWithAssignee[];
  recurringTasks: TaskWithAssignee[];
  members: { id: string; full_name: string }[];
  projects?: { id: string; name: string }[];
}) {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"active" | "drafts" | "archived" | "recurring">("active");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithAssignee | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isBulkPending, setIsBulkPending] = useState(false);

  const source =
    view === "drafts"
      ? draftTasks
      : view === "archived"
        ? archivedTasks
        : view === "recurring"
          ? recurringTasks
          : tasks;
  const filtered = useMemo(() => {
    if (!search.trim()) return source;
    const q = search.toLowerCase();
    return source.filter((t) => t.name.toLowerCase().includes(q));
  }, [source, search]);

  const groups = useMemo(() => groupTasksForList(filtered), [filtered]);

  function openCreate() {
    setEditingTask(null);
    setDialogOpen(true);
  }

  function openEdit(task: TaskWithAssignee) {
    setEditingTask(task);
    setDialogOpen(true);
  }

  function toggleSelectionMode() {
    setSelectionMode((v) => !v);
    setSelectedIds(new Set());
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exitSelection() {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }

  async function runBulk(action: () => Promise<{ error?: string } | undefined>, successMessage: string) {
    setIsBulkPending(true);
    const result = await action();
    setIsBulkPending(false);
    if (result && "error" in result && result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(successMessage);
    exitSelection();
  }

  const ids = [...selectedIds];

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Task</h1>
        <div className="flex items-center gap-2">
          <Button
            variant={view === "drafts" ? "default" : "outline"}
            size="sm"
            onClick={() => setView((v) => (v === "drafts" ? "active" : "drafts"))}
          >
            Draft Tasks {draftTasks.length > 0 && `(${draftTasks.length})`}
          </Button>
          <Button
            variant={view === "archived" ? "default" : "outline"}
            size="sm"
            onClick={() => setView((v) => (v === "archived" ? "active" : "archived"))}
          >
            Archived {archivedTasks.length > 0 && `(${archivedTasks.length})`}
          </Button>
          <Button
            variant={view === "recurring" ? "default" : "outline"}
            size="sm"
            onClick={() => setView((v) => (v === "recurring" ? "active" : "recurring"))}
          >
            Recurring {recurringTasks.length > 0 && `(${recurringTasks.length})`}
          </Button>
          <Button variant="outline" size="sm">
            <SlidersHorizontal className="size-4" />
            Customize
          </Button>
          <Button variant="ghost" size="icon" aria-label="More">
            <MoreHorizontal className="size-4" />
          </Button>
        </div>
      </div>

      {selectionMode ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>

          <Select
            onValueChange={(status) =>
              runBulk(
                () => bulkUpdateStatusAction(ids, status as "open" | "in_progress" | "done"),
                "Status updated",
              )
            }
            disabled={selectedIds.size === 0 || isBulkPending}
          >
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue placeholder="Change status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">To Do</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>

          <Select
            onValueChange={(assigneeId) =>
              runBulk(
                () => bulkAssignAction(ids, assigneeId === "unassigned" ? null : assigneeId),
                "Assignee updated",
              )
            }
            disabled={selectedIds.size === 0 || isBulkPending}
          >
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue placeholder="Assign to" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            size="sm"
            variant="outline"
            disabled={selectedIds.size === 0 || isBulkPending}
            onClick={() => runBulk(() => bulkArchiveAction(ids, true), "Tasks archived")}
          >
            Archive
          </Button>

          <Button
            size="sm"
            variant="destructive"
            disabled={selectedIds.size === 0 || isBulkPending}
            onClick={() => setConfirmDeleteOpen(true)}
          >
            Delete
          </Button>

          <Button size="sm" variant="ghost" className="ml-auto" onClick={exitSelection}>
            <X className="size-4" />
            Cancel
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-48">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="size-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            Status
            <ChevronDown className="size-4" />
          </Button>
          <Button variant="outline" size="sm">
            Default
          </Button>
          <Button variant="outline" size="sm">
            Date Type
          </Button>
          <Button variant="outline" size="sm" onClick={toggleSelectionMode}>
            <ListChecks className="size-4" />
            Select
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4" />
            Add Task
          </Button>
        </div>
      )}

      <TaskViewTabs />

      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="border-b bg-muted/40 px-4 py-2 text-sm font-medium text-muted-foreground">
          Task Name
        </div>

        {filtered.length === 0 && (
          <div className="p-10 text-center text-sm text-muted-foreground">
            {view === "drafts"
              ? "No draft tasks."
              : view === "archived"
                ? "No archived tasks."
                : view === "recurring"
                  ? "No recurring tasks."
                  : "No tasks yet. Click “Add Task” to create one."}
          </div>
        )}

        {GROUP_ORDER.map((key) => {
          const items = groups[key];
          if (items.length === 0) return null;
          const isCollapsed = collapsed[key];

          return (
            <div key={key}>
              <button
                onClick={() => setCollapsed((c) => ({ ...c, [key]: !c[key] }))}
                className="flex w-full items-center gap-2 border-b bg-muted/20 px-4 py-2 text-left text-sm font-medium"
              >
                <ChevronDown
                  className={`size-4 text-muted-foreground transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
                />
                {GROUP_LABELS[key]}
                <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                  {items.length}
                </span>
              </button>
              {!isCollapsed &&
                items.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onClick={() => openEdit(task)}
                    selectable={selectionMode}
                    selected={selectedIds.has(task.id)}
                    onToggleSelect={() => toggleSelect(task.id)}
                  />
                ))}
            </div>
          );
        })}
      </div>

      <TaskFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editingTask}
        members={members}
        projects={projects}
      />

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} task(s)?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmDeleteOpen(false);
                runBulk(() => bulkDeleteAction(ids), "Tasks deleted");
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
