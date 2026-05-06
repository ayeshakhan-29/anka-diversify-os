"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  X,
  MessageSquare,
  AtSign,
  Bell,
  AlertTriangle,
  CheckCheck,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { projectApi, type AppNotification } from "@/lib/project-api";

interface NotificationsPanelProps {
  onClose: () => void;
  onCountChange?: (count: number) => void;
}

const iconMap = {
  mention: AtSign,
  comment: MessageSquare,
  assignment: Bell,
  alert: AlertTriangle,
  system: Bell,
};

const colorMap = {
  mention: "text-blue-400",
  comment: "text-primary",
  assignment: "text-green-400",
  alert: "text-yellow-400",
  system: "text-muted-foreground",
};

function formatTimeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

export function NotificationsPanel({ onClose, onCountChange }: NotificationsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectApi
      .getNotifications()
      .then(setNotifications)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    onCountChange?.(Math.max(0, unreadCount - 1));
    await projectApi.markNotificationRead(id).catch(() => {});
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    onCountChange?.(0);
    await projectApi.markAllNotificationsRead().catch(() => {});
  };

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-12 w-96 rounded-lg border border-border bg-popover shadow-lg z-50"
    >
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-foreground" />
          <h3 className="font-semibold text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs h-7 px-2">
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              Mark all read
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="h-96">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Bell className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          notifications.map((n) => {
            const Icon = iconMap[n.type] ?? Bell;
            const color = colorMap[n.type] ?? "text-muted-foreground";
            const inner = (
              <div
                key={n.id}
                className={cn(
                  "flex gap-3 p-4 border-b border-border transition-colors hover:bg-secondary/50 cursor-pointer",
                  !n.read && "bg-primary/5",
                )}
                onClick={() => !n.read && markRead(n.id)}
              >
                <div className={cn("mt-0.5 shrink-0", color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{n.title}</p>
                    {!n.read && (
                      <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatTimeAgo(n.createdAt)}</p>
                </div>
              </div>
            );
            return n.link ? (
              <Link key={n.id} href={n.link} onClick={onClose}>
                {inner}
              </Link>
            ) : (
              <div key={n.id}>{inner}</div>
            );
          })
        )}
      </ScrollArea>

      <div className="border-t border-border p-3">
        <Button variant="ghost" className="w-full text-sm" asChild onClick={onClose}>
          <Link href="/notifications">View all notifications</Link>
        </Button>
      </div>
    </div>
  );
}
