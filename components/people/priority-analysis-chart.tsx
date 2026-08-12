import { Card } from "@/components/ui/card";
import type { PriorityBreakdown } from "@/lib/queries/people";

const PRIORITY_STYLES: Record<string, { label: string; bar: string }> = {
  high: { label: "High", bar: "bg-red-500" },
  medium: { label: "Medium", bar: "bg-amber-500" },
  low: { label: "Low", bar: "bg-emerald-500" },
};

export function PriorityAnalysisChart({ data }: { data: PriorityBreakdown[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <Card className="p-5">
      <h3 className="mb-4 font-semibold">Priority Analysis</h3>
      <div className="space-y-3">
        {data.map((row) => {
          const style = PRIORITY_STYLES[row.priority];
          return (
            <div key={row.priority} className="flex items-center gap-3">
              <span className="w-16 shrink-0 text-sm text-muted-foreground">{style.label}</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${style.bar}`}
                  style={{ width: `${(row.count / max) * 100}%` }}
                />
              </div>
              <span className="w-6 shrink-0 text-right text-sm font-medium">{row.count}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
