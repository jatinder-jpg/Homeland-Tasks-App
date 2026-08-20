import { ListChecks, UserCheck, Clock, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getDashboardCounts, getStatistics } from "@/lib/queries/dashboard";
import { StatCard } from "@/components/dashboard/stat-card";
import { TodaysSummaryCard } from "@/components/dashboard/todays-summary-card";
import { StatisticsChart } from "@/components/dashboard/statistics-chart";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [counts, statistics] = await Promise.all([
    getDashboardCounts(supabase, user.id),
    getStatistics(supabase, { scope: "mine", range: "monthly", userId: user.id }),
  ]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        <StatCard icon={ListChecks} label="Total Task" value={counts.total} tint="blue" href="/task" />
        <StatCard icon={UserCheck} label="Assigned to me" value={counts.assignedToMe} tint="green" href="/task?filter=assigned" />
        <StatCard icon={Clock} label="Due today" value={counts.dueToday} tint="amber" href="/task?filter=due-today" />
        <StatCard icon={AlertTriangle} label="Past due tasks" value={counts.pastDue} tint="rose" href="/task?filter=overdue" />
      </div>

      <TodaysSummaryCard newTask={counts.newToday} closedTask={counts.closedToday} />

      <StatisticsChart initialData={statistics} />
    </div>
  );
}
