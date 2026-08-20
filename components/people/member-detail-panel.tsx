"use client";

import { useEffect, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Plus, ListChecks, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { AvatarBadge } from "@/components/task/avatar-badge";
import { TaskFormDialog } from "@/components/task/task-form-dialog";
import { PriorityAnalysisChart } from "@/components/people/priority-analysis-chart";
import { PerformanceAnalysisChart } from "@/components/people/performance-analysis-chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getPriorityBreakdownAction, updateMemberRoleAction } from "@/lib/actions/people";
import { ROLE_LABEL } from "@/lib/utils/roles";
import type { MemberWithCounts } from "@/lib/queries/people";
import type { PriorityBreakdown } from "@/lib/queries/people";

const ROLE_TINT: Record<string, string> = {
  super_admin: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400",
  admin: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  member: "bg-muted text-muted-foreground",
};

export function MemberDetailPanel({
  member,
  members,
  projects,
  isSuperAdmin,
  isSelf,
}: {
  member: MemberWithCounts;
  members: { id: string; full_name: string }[];
  projects: { id: string; name: string }[];
  isSuperAdmin: boolean;
  isSelf: boolean;
}) {
  const [priorityData, setPriorityData] = useState<PriorityBreakdown[]>([]);
  const [, startTransition] = useTransition();
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);

  function handleRoleChange(role: "admin" | "member") {
    startTransition(async () => {
      const result = await updateMemberRoleAction(member.id, role);
      if (result && "error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Role updated");
    });
  }

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
          <AvatarBadge name={member.full_name} size="md" profileId={member.id} />
          <div>
            <h2 className="font-semibold">{member.full_name}</h2>
            {isSuperAdmin && !isSelf && member.role !== "super_admin" ? (
              <Select value={member.role} onValueChange={(v) => handleRoleChange(v as "admin" | "member")}>
                <SelectTrigger className="mt-1 h-6 w-32 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <span className={`mt-1 inline-block rounded px-1.5 py-0.5 text-xs font-medium ${ROLE_TINT[member.role] ?? ROLE_TINT.member}`}>
                {ROLE_LABEL[member.role] ?? member.role}
              </span>
            )}
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
