import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

export function StatCard({
  icon: Icon,
  label,
  value,
  tint,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  tint: "blue" | "green" | "amber" | "rose";
}) {
  const tints: Record<typeof tint, string> = {
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
    green: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
    amber: "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
    rose: "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400",
  };

  return (
    <Card className="flex flex-row items-center gap-4 p-5">
      <div className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${tints[tint]}`}>
        <Icon className="size-6" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </Card>
  );
}
