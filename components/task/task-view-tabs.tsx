"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { List, Kanban, CalendarDays } from "lucide-react";

const TABS = [
  { href: "/task", label: "List", icon: List },
  { href: "/task/kanban", label: "Kanban", icon: Kanban },
  { href: "/task/calendar", label: "Calendar", icon: CalendarDays },
];

export function TaskViewTabs() {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 rounded-lg bg-card p-1 shadow-sm">
      {TABS.map((tab) => {
        const isActive = pathname === tab.href;
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent"
            }`}
          >
            <Icon className="size-4" />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
