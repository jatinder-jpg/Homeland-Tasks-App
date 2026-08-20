import { ListChecks, UserCheck, Clock, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getDashboardCounts, getStatistics, getOrgPriorityBreakdown } from "@/lib/queries/dashboard";
import { getOrgMembers } from "@/lib/queries/people";
import { StatCard } from "@/components/dashboard/stat-card";
import { TodaysSummaryCard } from "@/components/dashboard/todays-summary-card";
import { StatisticsChart } from "@/components/dashboard/statistics-chart";
import { PriorityTaskSummary } from "@/components/dashboard/priority-task-summary";
import { TeamIncompleteTask } from "@/components/dashboard/team-incomplete-task";
import { AddTaskPrompt } from "@/components/dashboard/add-task-prompt";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [counts, statistics, priorityCounts, members] = await Promise.all([
    getDashboardCounts(supabase, user.id),
    getStatistics(supabase, { scope: "mine", range: "monthly", userId: user.id }),
    getOrgPriorityBreakdown(supabase),
    getOrgMembers(supabase),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
            <StatCard icon={ListChecks} label="Total Task" value={counts.total} tint="blue" href="/task" />
            <StatCard icon={UserCheck} label="Assigned to me" value={counts.assignedToMe} tint="green" href="/task?filter=assigned" />
            <StatCard icon={Clock} label="Due today" value={counts.dueToday} tint="amber" href="/task?filter=due-today" />
            <StatCard icon={AlertTriangle} label="Past due tasks" value={counts.pastDue} tint="rose" href="/task?filter=overdue" />
          </div>

          <AddTaskPrompt hasTasks={counts.total > 0} />

          <TodaysSummaryCard newTask={counts.newToday} closedTask={counts.closedToday} />

          <StatisticsChart initialData={statistics} />
        </div>

        <div className="space-y-6">
          <PriorityTaskSummary counts={priorityCounts} />
          <TeamIncompleteTask members={members} />
        </div>
      </div>
    </div>
  );
}
