"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, isToday, isYesterday } from "date-fns";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const fetchNotifications = useCallback(() => {
    fetch("/api/notifications", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setNotifications(Array.isArray(data) ? data : []))
      .catch(() => setNotifications([]));
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Refetch when SSE delivers a new notification (so badge updates without opening dropdown)
  useEffect(() => {
    const handler = () => fetchNotifications();
    window.addEventListener("qs-notification", handler);
    return () => window.removeEventListener("qs-notification", handler);
  }, [fetchNotifications]);

  // Fetch only when dropdown opens; mark as read when closing
  useEffect(() => {
    if (open) {
      fetchNotifications();
    } else if (notifications.some((n) => !n.read)) {
      fetch("/api/notifications", { method: "PATCH", credentials: "include" })
        .then(() => {
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const grouped = {
    new: notifications.filter((n) => !n.read),
    earlier: notifications.filter((n) => n.read),
  };

  function formatTimestamp(createdAt: string) {
    const d = new Date(createdAt);
    if (isToday(d)) return `Today, ${format(d, "HH:mm")}`;
    if (isYesterday(d)) return `Yesterday, ${format(d, "HH:mm")}`;
    return format(d, "d MMM HH:mm");
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-muted" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 max-w-[calc(100vw-1rem)] p-0">
        {notifications.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            No notifications yet.
          </div>
        ) : (
          <div className="max-h-[26rem] overflow-y-auto">
            {grouped.new.length > 0 && (
              <div className="border-b px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">New</p>
              </div>
            )}
            {grouped.new.slice(0, 20).map((n) => (
              <article key={n.id} className="border-l-2 border-primary/50 bg-primary/[0.04] px-3 py-3">
                <p className="text-sm font-semibold">{n.title}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatTimestamp(n.createdAt)}</p>
              </article>
            ))}

            {grouped.earlier.length > 0 && (
              <div className="border-y px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Earlier</p>
              </div>
            )}
            {grouped.earlier.slice(0, 8).map((n) => (
              <article key={n.id} className="px-3 py-3">
                <p className="text-sm font-medium">{n.title}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatTimestamp(n.createdAt)}</p>
              </article>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
