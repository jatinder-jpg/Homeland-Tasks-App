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
    blue: "text-primary",
    green: "text-emerald-600 dark:text-emerald-400",
    amber: "text-amber-600 dark:text-amber-400",
    rose: "text-destructive",
  };

  const card = (
    <Card
      className={`p-4 ${href ? "transition-colors hover:border-primary/40" : ""}`}
    >
      <div className="mb-2 flex items-center gap-2 overflow-hidden">
        <Icon className={`size-4 shrink-0 ${tints[tint]}`} />
        <p className="truncate text-sm text-muted-foreground">{label}</p>
      </div>
      <p className="font-heading text-2xl font-semibold">{value}</p>
    </Card>
  );

  if (!href) return card;

  return (
    <Link href={href} className="block">
      {card}
    </Link>
  );
}
