"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquareWarning } from "lucide-react";
import { navItems } from "@/lib/nav-config";
import { getInitials, colorForString } from "@/lib/utils/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
      className={`flex w-16 shrink-0 flex-col items-center border-r bg-card py-4 transition-all ${open ? "" : "-ml-16"}`}
    >
      <span
        className={`mb-4 flex size-9 items-center justify-center rounded-full text-sm font-semibold text-white ${colorForString(orgName)}`}
        title={orgName}
      >
        {getInitials(orgName)}
      </span>

      <nav className="flex flex-1 flex-col items-center gap-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={`flex size-10 items-center justify-center rounded-lg transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <Icon className="size-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Send feedback"
          >
            <MessageSquareWarning className="size-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">Feedback</TooltipContent>
      </Tooltip>
    </aside>
  );
}
