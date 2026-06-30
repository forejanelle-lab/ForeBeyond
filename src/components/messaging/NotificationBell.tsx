"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  getUnreadNotificationCount,
  markAllNotificationsRead,
} from "@/lib/notifications";
import { Badge } from "@/components/ui/Badge";
import type { AppNotification } from "@/types/database";

interface NotificationBellProps {
  userId: string;
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      try {
        const [{ data }, count] = await Promise.all([
          supabase
            .from("notifications")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(8),
          getUnreadNotificationCount(supabase, userId),
        ]);
        setNotifications((data as AppNotification[]) ?? []);
        setUnreadCount(count);
      } catch (error) {
        console.error("NotificationBell load failed:", error);
      }
    }

    load();

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
    if (pathname !== "/notifications") return;

    const supabase = createClient();
    markAllNotificationsRead(supabase, userId).then(() => {
      setUnreadCount(0);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
      );
    });
  }, [pathname, userId]);

  async function handleOpen() {
    const nextOpen = !open;
    setOpen(nextOpen);

    if (nextOpen && unreadCount > 0) {
      const supabase = createClient();
      const readAt = new Date().toISOString();
      await markAllNotificationsRead(supabase, userId);
      setUnreadCount(0);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at ?? readAt }))
      );
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-sage/50 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-forest" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-sage-dark/30 bg-white shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-sage-dark/20">
              <p className="font-semibold text-forest text-sm">Notifications</p>
              <Link
                href="/notifications"
                className="text-xs text-forest hover:underline"
                onClick={() => setOpen(false)}
              >
                View all
              </Link>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-sm text-charcoal-light text-center py-8">No notifications</p>
              ) : (
                notifications.map((n) => (
                  <Link
                    key={n.id}
                    href={n.link ?? "/notifications"}
                    onClick={() => setOpen(false)}
                    className={`block px-4 py-3 border-b border-sage-dark/10 hover:bg-sage/20 ${
                      !n.read_at ? "bg-sage/10" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-forest truncate">{n.title}</p>
                        {n.body && (
                          <p className="text-xs text-charcoal-light mt-0.5 line-clamp-2">{n.body}</p>
                        )}
                      </div>
                      {!n.read_at && <Badge variant="gold" className="shrink-0">New</Badge>}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
