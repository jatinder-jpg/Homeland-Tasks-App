"use client";

import Link from "next/link";
import { CheckCircle2, Menu, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { NotificationBell } from "@/components/shell/notification-bell";
import { UserMenu } from "@/components/shell/user-menu";
import type { NotificationWithActor } from "@/lib/queries/notifications";

export function TopBar({
  fullName,
  orgCode,
  userId,
  initialUnreadCount,
  initialNotifications,
  onToggleSidebar,
}: {
  fullName: string;
  orgCode: string;
  userId: string;
  initialUnreadCount: number;
  initialNotifications: NotificationWithActor[];
  onToggleSidebar: () => void;
}) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b bg-card px-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
      >
        <Menu className="size-5" />
      </Button>

      <Link href="/dashboard" className="flex items-center gap-1 text-lg font-bold">
        <span>Task</span>
        <CheckCircle2 className="size-5 text-primary" strokeWidth={2.5} />
        <span>Pad</span>
      </Link>

      <div className="flex flex-1 items-center justify-end gap-2">
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full bg-primary/10 text-primary hover:bg-primary/20"
          aria-label="What's new"
        >
          <Sparkles className="size-5" />
        </Button>
        <NotificationBell
          userId={userId}
          initialUnreadCount={initialUnreadCount}
          initialNotifications={initialNotifications}
        />
        <UserMenu fullName={fullName} orgCode={orgCode} />
      </div>
    </header>
  );
}
