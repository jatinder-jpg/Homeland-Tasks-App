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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard icon={ListChecks} label="Total Task" value={counts.total} tint="blue" />
        <StatCard icon={UserCheck} label="Assigned to me" value={counts.assignedToMe} tint="green" />
        <StatCard icon={Clock} label="Due today" value={counts.dueToday} tint="amber" />
        <StatCard icon={AlertTriangle} label="Past due tasks" value={counts.pastDue} tint="rose" />
      </div>

      <TodaysSummaryCard newTask={counts.newToday} closedTask={counts.closedToday} />

      <StatisticsChart initialData={statistics} />
    </div>
  );
}
