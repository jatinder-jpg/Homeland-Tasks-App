"use client";

import { useEffect, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Plus, ListChecks, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { AvatarBadge } from "@/components/task/avatar-badge";
import { TaskFormDialog } from "@/components/task/task-form-dialog";
import { PriorityAnalysisChart } from "@/components/people/priority-analysis-chart";
import { PerformanceAnalysisChart } from "@/components/people/performance-analysis-chart";
import { getPriorityBreakdownAction } from "@/lib/actions/people";
import type { MemberWithCounts } from "@/lib/queries/people";
import type { PriorityBreakdown } from "@/lib/queries/people";

export function MemberDetailPanel({
  member,
  members,
  projects,
}: {
  member: MemberWithCounts;
  members: { id: string; full_name: string }[];
  projects: { id: string; name: string }[];
}) {
  const [priorityData, setPriorityData] = useState<PriorityBreakdown[]>([]);
  const [, startTransition] = useTransition();
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);

  useEffect(() => {
    startTransition(async () => {
      const rows = await getPriorityBreakdownAction(member.id);
      setPriorityData(rows);
    });
  }, [member.id]);

  return (
    <div className="min-w-0 flex-1 space-y-5 overflow-y-auto p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <AvatarBadge name={member.full_name} size="md" />
          <div>
            <h2 className="font-semibold">{member.full_name}</h2>
            <p className="text-xs capitalize text-muted-foreground">{member.role}</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setTaskDialogOpen(true)}>
          <Plus className="size-4" />
          Add Task
        </Button>
      </div>

      <div className="flex items-center gap-1 rounded-lg bg-card p-1 shadow-sm">
        <Button variant="ghost" size="icon" className="size-8" disabled>
          <ChevronLeft className="size-4" />
        </Button>
        <span className="flex-1 rounded-md bg-primary/10 px-4 py-1.5 text-center text-sm font-medium text-primary">
          Overviews
        </span>
        <Button variant="ghost" size="icon" className="size-8" disabled>
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={CheckCircle2} label="Completed Tasks" value={member.completedTasks} tint="green" />
        <StatCard icon={Clock} label="Incomplete Tasks" value={member.incompleteTasks} tint="amber" />
        <StatCard icon={ListChecks} label="Total Tasks" value={member.totalTasks} tint="blue" />
      </div>

      <PriorityAnalysisChart data={priorityData} />
      <PerformanceAnalysisChart memberId={member.id} />

      <TaskFormDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        members={members}
        projects={projects}
        defaultAssigneeId={member.id}
      />
    </div>
  );
}
