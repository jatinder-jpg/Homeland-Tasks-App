"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Star, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { AvatarBadge } from "@/components/task/avatar-badge";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS, type ProjectStatus } from "@/lib/utils/project-status";
import { toggleProjectStarAction } from "@/lib/actions/projects";
import type { ProjectWithRelations } from "@/lib/queries/projects";

export function ProjectCard({
  project,
  starred,
}: {
  project: ProjectWithRelations;
  starred: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const status = project.status as ProjectStatus;
  const taskCount = project.tasks?.[0]?.count ?? 0;

  function toggleStar(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      const result = await toggleProjectStarAction(project.id, !starred);
      if (result && "error" in result) toast.error(result.error);
    });
  }

  return (
    <Link href={`/project/${project.id}`}>
      <Card className="flex h-full flex-col gap-3 p-4 transition-colors hover:border-primary/40">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium leading-snug">{project.name}</h3>
          <button onClick={toggleStar} disabled={isPending} aria-label={starred ? "Unstar" : "Star"}>
            <Star className={`size-4 ${starred ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`} />
          </button>
        </div>

        {project.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{project.description}</p>
        )}

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PROJECT_STATUS_COLORS[status]}`}>
            {PROJECT_STATUS_LABELS[status]}
          </span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <ListChecks className="size-3.5" />
              {taskCount}
            </span>
            <AvatarBadge name={project.assignee?.full_name ?? null} />
          </div>
        </div>
      </Card>
    </Link>
  );
}
