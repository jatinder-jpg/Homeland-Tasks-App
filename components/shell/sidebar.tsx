"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquareWarning } from "lucide-react";
import { navItems } from "@/lib/nav-config";
import { getInitials } from "@/lib/utils/avatar";

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
      className={`hidden w-60 shrink-0 flex-col bg-sidebar py-6 transition-all md:flex ${open ? "" : "md:-ml-60"}`}
    >
      <div className="mb-7 flex items-center gap-2.5 px-5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sm font-heading font-bold text-sidebar-primary-foreground">
          {getInitials(orgName)}
        </span>
        <div className="min-w-0">
          <div className="truncate font-heading text-sm font-semibold text-sidebar-foreground">
            {orgName}
          </div>
          <div className="text-[10px] font-semibold tracking-widest text-sidebar-primary uppercase">
            Workspace
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3.5">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-white"
                  : "text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              }`}
            >
              {isActive && (
                <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-sidebar-primary" />
              )}
              <Icon className={`size-[18px] shrink-0 ${isActive ? "text-sidebar-primary" : ""}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3.5">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-sidebar-foreground/65 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
        >
          <MessageSquareWarning className="size-[18px] shrink-0" />
          Feedback
        </button>
      </div>
    </aside>
  );
}
