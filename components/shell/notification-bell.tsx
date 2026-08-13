"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { createClient } from "@/lib/supabase/client";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/lib/actions/notifications";
import type { NotificationWithActor } from "@/lib/queries/notifications";

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationBell({
  userId,
  initialUnreadCount,
  initialNotifications,
}: {
  userId: string;
  initialUnreadCount: number;
  initialNotifications: NotificationWithActor[];
}) {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [urgentAlert, setUrgentAlert] = useState<NotificationWithActor | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "tp_notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as NotificationWithActor;
          setNotifications((prev) => [{ ...row, actor: null }, ...prev].slice(0, 10));
          setUnreadCount((prev) => prev + 1);
          if (row.type === "task_urgent_alert") {
            setUrgentAlert(row);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  function dismissUrgentAlert() {
    if (!urgentAlert) return;
    setNotifications((prev) =>
      prev.map((n) => (n.id === urgentAlert.id ? { ...n, is_read: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    startTransition(() => {
      markNotificationReadAction(urgentAlert.id);
    });
    setUrgentAlert(null);
  }

  function viewUrgentAlertTask() {
    if (!urgentAlert) return;
    const link = urgentAlert.link;
    dismissUrgentAlert();
    if (link) router.push(link);
  }

  function handleNotificationClick(notification: NotificationWithActor) {
    if (!notification.is_read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      startTransition(() => {
        markNotificationReadAction(notification.id);
      });
    }
    if (notification.link) router.push(notification.link);
  }

  function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    startTransition(() => {
      markAllNotificationsReadAction();
    });
  }

  return (
    <>
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <CheckCheck className="size-3.5" />
              Mark all read
            </button>
          )}
        </div>
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">No notifications yet.</p>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`block w-full border-b px-3 py-2.5 text-left text-sm last:border-b-0 hover:bg-accent/50 ${
                  n.is_read ? "" : "bg-primary/5"
                }`}
              >
                <div className="flex items-start gap-2">
                  {!n.is_read && <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{n.title}</p>
                    {n.body && <p className="truncate text-xs text-muted-foreground">{n.body}</p>}
                    <p className="mt-0.5 text-xs text-muted-foreground">{timeAgo(n.created_at)}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>

      <AlertDialog open={Boolean(urgentAlert)} onOpenChange={(open) => !open && dismissUrgentAlert()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <TriangleAlert className="size-5" />
              Urgent approval needed
            </AlertDialogTitle>
            <AlertDialogDescription>
              {urgentAlert?.title}
              {urgentAlert?.body && (
                <>
                  <br />
                  <span className="font-medium text-foreground">{urgentAlert.body}</span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={dismissUrgentAlert}>Dismiss</AlertDialogCancel>
            <AlertDialogAction onClick={viewUrgentAlertTask}>View Task</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
