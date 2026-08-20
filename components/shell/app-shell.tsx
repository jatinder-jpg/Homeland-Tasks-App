"use client";

import { useState } from "react";
import { TopBar } from "@/components/shell/top-bar";
import { Sidebar } from "@/components/shell/sidebar";
import { PresenceProvider } from "@/lib/presence/presence-context";
import type { NotificationWithActor } from "@/lib/queries/notifications";

export function AppShell({
  fullName,
  orgName,
  orgCode,
  userId,
  initialUnreadCount,
  initialNotifications,
  children,
}: {
  fullName: string;
  orgName: string;
  orgCode: string;
  userId: string;
  initialUnreadCount: number;
  initialNotifications: NotificationWithActor[];
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <PresenceProvider>
      <div className="flex h-screen flex-col overflow-hidden">
        <TopBar
          fullName={fullName}
          orgCode={orgCode}
          userId={userId}
          initialUnreadCount={initialUnreadCount}
          initialNotifications={initialNotifications}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
        />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar orgName={orgName} open={sidebarOpen} />
          <main className="flex flex-1 flex-col overflow-y-auto bg-muted/30">{children}</main>
        </div>
      </div>
    </PresenceProvider>
  );
}
