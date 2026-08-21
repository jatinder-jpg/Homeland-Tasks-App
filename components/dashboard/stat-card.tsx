import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

export function StatCard({
  icon: Icon,
  label,
  value,
  tint,
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  tint: "blue" | "green" | "amber" | "rose";
  href?: string;
}) {
  const tints: Record<typeof tint, string> = {
    blue: "bg-primary/10 text-primary",
    green: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
    amber: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
    rose: "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-destructive",
  };

  const card = (
    <Card className={`overflow-hidden p-3 ${href ? "transition-colors hover:border-primary/40" : ""}`}>
      <div className={`mb-2 flex size-9 items-center justify-center rounded-lg ${tints[tint]}`}>
        <Icon className="size-4" />
      </div>
      <p className="truncate text-xs whitespace-nowrap text-muted-foreground">{label}</p>
      <p className="font-heading text-xl font-semibold">{value}</p>
    </Card>
  );

  if (!href) return card;

  return (
    <Link href={href} className="block">
      {card}
    </Link>
  );
}
