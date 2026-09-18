"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, Sparkles, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { NotificationBell } from "@/components/shell/notification-bell";
import { UserMenu } from "@/components/shell/user-menu";
import { GlobalSearchDialog } from "@/components/shell/global-search-dialog";
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
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b bg-card px-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
        className="hidden md:inline-flex"
      >
        <Menu className="size-5" />
      </Button>

      <Link href="/dashboard" className="flex items-center gap-2 text-lg font-bold">
        <Image src="/logo.png" alt="" width={28} height={28} className="size-7 shrink-0" />
        <span className="hidden sm:inline">Homeland Tasks</span>
      </Link>

      <div className="flex flex-1 items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          title="Search (Ctrl+K)"
          className="hidden items-center gap-2 rounded-full border bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent sm:flex"
        >
          <Search className="size-4" />
          Search…
          <span className="ml-2 rounded border bg-card px-1 text-[10px]">Ctrl K</span>
        </button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSearchOpen(true)}
          aria-label="Search"
          className="sm:hidden"
        >
          <Search className="size-5" />
        </Button>
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

      <GlobalSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}
