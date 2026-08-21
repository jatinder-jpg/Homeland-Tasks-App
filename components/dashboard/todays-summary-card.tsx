import { ListChecks, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

export function TodaysSummaryCard({
  newTask,
  closedTask,
}: {
  newTask: number;
  closedTask: number;
}) {
  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold">Today&apos;s Summary</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex items-center justify-between rounded-lg border-l-4 border-emerald-500 bg-emerald-50 p-3 dark:bg-emerald-950/40">
          <div>
            <p className="text-xs text-muted-foreground">New task</p>
            <p className="text-xl font-bold">{newTask}</p>
          </div>
          <ListChecks className="size-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="flex items-center justify-between rounded-lg border-l-4 border-rose-500 bg-rose-50 p-3 dark:bg-rose-950/40">
          <div>
            <p className="text-xs text-muted-foreground">Closed task</p>
            <p className="text-xl font-bold">{closedTask}</p>
          </div>
          <XCircle className="size-5 text-rose-600 dark:text-rose-400" />
        </div>
      </div>
    </Card>
  );
}
