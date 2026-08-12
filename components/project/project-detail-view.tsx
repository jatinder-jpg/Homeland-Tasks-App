"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star, Pencil, Trash2, Plus, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AvatarBadge } from "@/components/task/avatar-badge";
import { TaskRow } from "@/components/task/task-row";
import { TaskFormDialog } from "@/components/task/task-form-dialog";
import { ProjectFormDialog } from "@/components/project/project-form-dialog";
import { groupTasksForList, GROUP_ORDER, GROUP_LABELS } from "@/lib/utils/task-grouping";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS, type ProjectStatus } from "@/lib/utils/project-status";
import { toggleProjectStarAction, deleteProjectAction } from "@/lib/actions/projects";
import { formatNumericDate } from "@/lib/utils/format-date";
import type { ProjectWithRelations } from "@/lib/queries/projects";
import type { TaskWithAssignee } from "@/lib/queries/tasks";

export function ProjectDetailView({
  project,
  tasks,
  starred,
  members,
  projects,
}: {
  project: ProjectWithRelations;
  tasks: TaskWithAssignee[];
  starred: boolean;
  members: { id: string; full_name: string }[];
  projects: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithAssignee | null>(null);

  const status = project.status as ProjectStatus;
  const groups = groupTasksForList(tasks);

  function toggleStar() {
    startTransition(async () => {
      const result = await toggleProjectStarAction(project.id, !starred);
      if (result && "error" in result) toast.error(result.error);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteProjectAction(project.id);
      if (result && "error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Project deleted");
      router.push("/project");
    });
  }

  function openCreateTask() {
    setEditingTask(null);
    setTaskDialogOpen(true);
  }

  function openEditTask(task: TaskWithAssignee) {
    setEditingTask(task);
    setTaskDialogOpen(true);
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-6">
      <Button variant="ghost" size="sm" className="-ml-2 w-fit" onClick={() => router.push("/project")}>
        <ArrowLeft className="size-4" />
        Back to Projects
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <button onClick={toggleStar} disabled={isPending} aria-label={starred ? "Unstar" : "Star"}>
              <Star className={`size-5 ${starred ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`} />
            </button>
          </div>
          {project.description && <p className="max-w-xl text-sm text-muted-foreground">{project.description}</p>}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${PROJECT_STATUS_COLORS[status]}`}>
              {PROJECT_STATUS_LABELS[status]}
            </span>
            {project.due_date && (
              <span className="text-xs text-muted-foreground">
                Due {formatNumericDate(new Date(project.due_date + "T00:00:00"))}
              </span>
            )}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              Assignee
              <AvatarBadge name={project.assignee?.full_name ?? null} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" />
            Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 className="size-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this project?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes the project. Linked tasks will remain but become unassigned from it. This can&apos;t be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Tasks</h2>
        <Button size="sm" onClick={openCreateTask}>
          <Plus className="size-4" />
          Add Task
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        {tasks.length === 0 && (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No tasks linked to this project yet.
          </div>
        )}
        {GROUP_ORDER.map((key) => {
          const items = groups[key];
          if (items.length === 0) return null;
          return (
            <div key={key}>
              <div className="flex items-center gap-2 border-b bg-muted/20 px-4 py-2 text-sm font-medium">
                {GROUP_LABELS[key]}
                <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                  {items.length}
                </span>
              </div>
              {items.map((task) => (
                <TaskRow key={task.id} task={task} onClick={() => openEditTask(task)} />
              ))}
            </div>
          );
        })}
      </div>

      <ProjectFormDialog open={editOpen} onOpenChange={setEditOpen} project={project} members={members} />
      <TaskFormDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        task={editingTask}
        members={members}
        projects={projects}
        defaultProjectId={project.id}
      />
    </div>
  );
}
