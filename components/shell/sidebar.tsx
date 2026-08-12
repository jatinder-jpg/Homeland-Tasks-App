"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquareWarning } from "lucide-react";
import { navItems } from "@/lib/nav-config";
import { getInitials, colorForString } from "@/lib/utils/avatar";

export function Sidebar({
  orgName,
  open,
}: {
  orgName: string;
  open: boolean;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={`flex w-56 shrink-0 flex-col border-r bg-card py-4 transition-all ${open ? "" : "-ml-56"}`}
    >
      <div className="mb-4 flex items-center gap-2 px-3">
        <span
          className={`flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${colorForString(orgName)}`}
        >
          {getInitials(orgName)}
        </span>
        <span className="truncate text-sm font-medium">{orgName}</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <Icon className="size-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <MessageSquareWarning className="size-5 shrink-0" />
          Feedback
        </button>
      </div>
    </aside>
  );
}
