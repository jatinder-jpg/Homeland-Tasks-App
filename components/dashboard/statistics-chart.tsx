"use client";

import { useMemo, useState, useTransition } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getStatisticsAction } from "@/lib/actions/dashboard";
import { formatShortDate } from "@/lib/utils/format-date";
import type { MonthlyStatRow } from "@/lib/queries/dashboard";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function toChartData(rows: MonthlyStatRow[], range: "monthly" | "weekly") {
  if (range === "monthly") {
    const year = new Date().getFullYear();
    const byMonth = new Map(rows.map((r) => [r.period.slice(0, 7), r]));
    return MONTH_LABELS.map((label, i) => {
      const key = `${year}-${String(i + 1).padStart(2, "0")}`;
      const row = byMonth.get(key);
      return { label, Completed: row?.completed ?? 0, Incomplete: row?.incomplete ?? 0 };
    });
  }

  return rows.map((r) => ({
    label: formatShortDate(new Date(r.period)),
    Completed: r.completed,
    Incomplete: r.incomplete,
  }));
}

export function StatisticsChart({ initialData }: { initialData: MonthlyStatRow[] }) {
  const [scope, setScope] = useState<"all" | "mine">("mine");
  const [range, setRange] = useState<"monthly" | "weekly">("monthly");
  const [data, setData] = useState(initialData);
  const [isPending, startTransition] = useTransition();

  const chartData = useMemo(() => toChartData(data, range), [data, range]);

  function refresh(nextScope: "all" | "mine", nextRange: "monthly" | "weekly") {
    setScope(nextScope);
    setRange(nextRange);
    startTransition(async () => {
      const rows = await getStatisticsAction(nextScope, nextRange);
      setData(rows);
    });
  }

  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">Statistics</h2>
        <div className="flex items-center gap-2">
          <Select value={scope} onValueChange={(v) => refresh(v as "all" | "mine", range)}>
            <SelectTrigger className="w-32" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mine">My Task</SelectItem>
              <SelectItem value="all">All Tasks</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex rounded-md bg-muted p-0.5">
            <Button
              size="sm"
              variant={range === "monthly" ? "default" : "ghost"}
              className="h-7 px-3"
              onClick={() => refresh(scope, "monthly")}
            >
              Monthly
            </Button>
            <Button
              size="sm"
              variant={range === "weekly" ? "default" : "ghost"}
              className="h-7 px-3"
              onClick={() => refresh(scope, "weekly")}
            >
              Weekly
            </Button>
          </div>
        </div>
      </div>

      <div className={`h-72 w-full transition-opacity ${isPending ? "opacity-50" : ""}`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 12, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="Completed" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="Incomplete" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
