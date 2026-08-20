"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Filter, Plus, Search, SlidersHorizontal, MoreHorizontal, ListChecks, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { groupTasksForList, GROUP_ORDER, GROUP_LABELS, type TaskDateType } from "@/lib/utils/task-grouping";
import {
  bulkUpdateStatusAction,
  bulkAssignAction,
  bulkArchiveAction,
  bulkDeleteAction,
} from "@/lib/actions/tasks";
import type { TaskWithAssignee } from "@/lib/queries/tasks";

const WORKFLOW_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approval_awaiting", label: "Approval Awaiting" },
  { value: "in_progress", label: "In Progress" },
  { value: "on_hold", label: "On Hold" },
  { value: "third_party_pending", label: "Third Party Pending" },
  { value: "under_review", label: "Under Review" },
];

const PRIORITY_OPTIONS: { value: string; label: string }[] = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

type SortBy = "default" | "priority" | "dueDate" | "name";
const PRIORITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };

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
  const [currentUserId, setCurrentUserId] = useState("");
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
  const [priorityFilter, setPriorityFilter] = useState<Set<string>>(new Set());
  const [assigneeFilter, setAssigneeFilter] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortBy>("default");
  const [dateType, setDateType] = useState<TaskDateType>("due");

  const router = useRouter();
  const searchParams = useSearchParams();
  const quickFilter = searchParams.get("filter");

  useEffect(() => {
    if (quickFilter !== "assigned") return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? ""));
  }, [quickFilter]);

  const source =
    view === "drafts"
      ? draftTasks
      : view === "archived"
        ? archivedTasks
        : view === "recurring"
          ? recurringTasks
          : tasks;

  const quickFilterLabel: Record<string, string> = {
    assigned: "Assigned to me",
    "due-today": "Due today",
    overdue: "Past due",
  };

  const quickFiltered = useMemo(() => {
    if (!quickFilter) return source;
    const today = new Date().toISOString().slice(0, 10);
    if (quickFilter === "assigned")
      return source.filter((t) => t.assignees.some((a) => a.id === currentUserId));
    if (quickFilter === "due-today") return source.filter((t) => t.due_date === today);
    if (quickFilter === "overdue")
      return source.filter((t) => t.due_date && t.due_date < today && t.status !== "done");
    return source;
  }, [source, quickFilter, currentUserId]);

  const searched = useMemo(() => {
    if (!search.trim()) return quickFiltered;
    const q = search.toLowerCase();
    return quickFiltered.filter((t) => t.name.toLowerCase().includes(q));
  }, [quickFiltered, search]);

  const filtered = useMemo(() => {
    let result = searched;
    if (statusFilter.size > 0) {
      result = result.filter((t) => t.workflow_status && statusFilter.has(t.workflow_status));
    }
    if (priorityFilter.size > 0) {
      result = result.filter((t) => priorityFilter.has(t.priority));
    }
    if (assigneeFilter.size > 0) {
      result = result.filter((t) => t.assignees.some((a) => assigneeFilter.has(a.id)));
    }
    if (sortBy !== "default") {
      result = [...result].sort((a, b) => {
        if (sortBy === "priority") return (PRIORITY_RANK[a.priority] ?? 99) - (PRIORITY_RANK[b.priority] ?? 99);
        if (sortBy === "dueDate") return (a.due_date ?? "9999-99-99").localeCompare(b.due_date ?? "9999-99-99");
        if (sortBy === "name") return a.name.localeCompare(b.name);
        return 0;
      });
    }
    return result;
  }, [searched, statusFilter, priorityFilter, assigneeFilter, sortBy]);

  const filterCount = priorityFilter.size + assigneeFilter.size;

  const groups = useMemo(() => groupTasksForList(filtered, dateType), [filtered, dateType]);

  function toggleInSet(setState: (fn: (prev: Set<string>) => Set<string>) => void, value: string) {
    setState((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

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
    <div className="w-full space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold">Task</h1>
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
          <Popover>
            <PopoverTrigger asChild>
              <Button variant={filterCount > 0 ? "default" : "outline"} size="sm">
                <Filter className="size-4" />
                Filter{filterCount > 0 && ` (${filterCount})`}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="start">
              <div className="space-y-3">
                <div>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">Priority</p>
                  <div className="space-y-1">
                    {PRIORITY_OPTIONS.map((o) => (
                      <label key={o.value} className="flex cursor-pointer items-center gap-2 text-sm">
                        <Checkbox
                          checked={priorityFilter.has(o.value)}
                          onCheckedChange={() => toggleInSet(setPriorityFilter, o.value)}
                        />
                        {o.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">Assignee</p>
                  <div
                    className="max-h-40 space-y-1 overflow-y-auto"
                    onWheel={(e) => (e.currentTarget.scrollTop += e.deltaY)}
                  >
                    {members.map((m) => (
                      <label key={m.id} className="flex cursor-pointer items-center gap-2 text-sm">
                        <Checkbox
                          checked={assigneeFilter.has(m.id)}
                          onCheckedChange={() => toggleInSet(setAssigneeFilter, m.id)}
                        />
                        {m.full_name}
                      </label>
                    ))}
                  </div>
                </div>
                {filterCount > 0 && (
                  <button
                    type="button"
                    className="text-xs text-muted-foreground underline hover:text-foreground"
                    onClick={() => {
                      setPriorityFilter(new Set());
                      setAssigneeFilter(new Set());
                    }}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant={statusFilter.size > 0 ? "default" : "outline"} size="sm">
                Status{statusFilter.size > 0 && ` (${statusFilter.size})`}
                <ChevronDown className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3" align="start">
              <div className="space-y-1">
                {WORKFLOW_STATUS_OPTIONS.map((o) => (
                  <label key={o.value} className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox
                      checked={statusFilter.has(o.value)}
                      onCheckedChange={() => toggleInSet(setStatusFilter, o.value)}
                    />
                    {o.label}
                  </label>
                ))}
                {statusFilter.size > 0 && (
                  <button
                    type="button"
                    className="mt-1 text-xs text-muted-foreground underline hover:text-foreground"
                    onClick={() => setStatusFilter(new Set())}
                  >
                    Clear
                  </button>
                )}
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant={sortBy !== "default" ? "default" : "outline"} size="sm">
                {sortBy === "default"
                  ? "Default"
                  : sortBy === "priority"
                    ? "Priority"
                    : sortBy === "dueDate"
                      ? "Due Date"
                      : "Name"}
                <ChevronDown className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-1.5" align="start">
              {(["default", "priority", "dueDate", "name"] as SortBy[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`flex w-full items-center rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-accent ${
                    sortBy === option ? "font-medium text-primary" : ""
                  }`}
                  onClick={() => setSortBy(option)}
                >
                  {option === "default"
                    ? "Default"
                    : option === "priority"
                      ? "Priority"
                      : option === "dueDate"
                        ? "Due Date"
                        : "Name"}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant={dateType !== "due" ? "default" : "outline"} size="sm">
                {dateType === "due" ? "Due Date" : "Created Date"}
                <ChevronDown className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-44 p-1.5" align="start">
              {(["due", "created"] as TaskDateType[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`flex w-full items-center rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-accent ${
                    dateType === option ? "font-medium text-primary" : ""
                  }`}
                  onClick={() => setDateType(option)}
                >
                  {option === "due" ? "Due Date" : "Created Date"}
                </button>
              ))}
            </PopoverContent>
          </Popover>
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

      {quickFilter && quickFilterLabel[quickFilter] && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Filter className="size-3" />
            {quickFilterLabel[quickFilter]}
            <button
              type="button"
              onClick={() => router.push("/task")}
              aria-label="Clear filter"
              className="ml-0.5 rounded-full hover:bg-primary/20"
            >
              <X className="size-3" />
            </button>
          </span>
        </div>
      )}

      <TaskViewTabs />

      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="grid grid-cols-[minmax(0,1fr)_110px_130px_130px] items-center gap-3 border-b bg-muted/40 px-4 py-2 text-sm font-medium text-muted-foreground">
          <span>Task Name</span>
          <span>Due Date</span>
          <span>Assignee(s)</span>
          <span>Status</span>
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
                    dateType={dateType}
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
