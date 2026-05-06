"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import {
  Bell,
  Check,
  CheckCheck,
  MessageSquare,
  AtSign,
  AlertTriangle,
  Trash2,
  Clock,
  Circle,
  UserPlus,
  Loader2,
  MailOpen,
} from "lucide-react";
import { projectApi, type AppNotification } from "@/lib/project-api";
import { cn } from "@/lib/utils";

const iconMap = {
  mention: AtSign,
  comment: MessageSquare,
  assignment: UserPlus,
  alert: AlertTriangle,
  system: Bell,
};

const colorMap = {
  mention: "text-primary bg-primary/20",
  comment: "text-blue-400 bg-blue-400/20",
  assignment: "text-green-400 bg-green-400/20",
  alert: "text-yellow-400 bg-yellow-400/20",
  system: "text-muted-foreground bg-muted",
};

function formatTimeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    projectApi
      .getNotifications()
      .then(setNotifications)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const mentionCount = notifications.filter((n) => n.type === "mention").length;
  const assignmentCount = notifications.filter((n) => n.type === "assignment").length;

  const filtered = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.read;
    return n.type === filter;
  });

  const markRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await projectApi.markNotificationRead(id).catch(() => {});
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await projectApi.markAllNotificationsRead().catch(() => {});
  };

  const remove = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await projectApi.deleteNotification(id).catch(() => {});
  };

  return (
    <MainLayout>
      <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
              {unreadCount > 0 && <Badge className="bg-primary">{unreadCount} new</Badge>}
            </div>
            <p className="text-muted-foreground">Stay updated on your projects and team activity</p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead} className="gap-2">
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "All", value: notifications.length, icon: Bell, filterKey: "all" },
            { label: "Unread", value: unreadCount, icon: Circle, filterKey: "unread", accent: true },
            { label: "Mentions", value: mentionCount, icon: AtSign, filterKey: "mention" },
            { label: "Assignments", value: assignmentCount, icon: UserPlus, filterKey: "assignment" },
          ].map(({ label, value, icon: Icon, filterKey, accent }) => (
            <Card
              key={filterKey}
              className="cursor-pointer hover:border-primary/50 transition-all"
              onClick={() => setFilter(filterKey)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className={cn("text-xl font-bold", accent && "text-primary")}>{value}</p>
                  </div>
                  <Icon className={cn("h-5 w-5", accent ? "text-primary" : "text-muted-foreground")} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
            <TabsTrigger value="mention">Mentions</TabsTrigger>
            <TabsTrigger value="assignment">Assignments</TabsTrigger>
            <TabsTrigger value="comment">Comments</TabsTrigger>
            <TabsTrigger value="alert">Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="mt-4">
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="p-10 text-center">
                    <MailOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                    <p className="text-muted-foreground text-sm">No notifications to show</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filtered.map((n) => {
                      const Icon = iconMap[n.type] ?? Bell;
                      const iconColor = colorMap[n.type] ?? "text-muted-foreground bg-muted";
                      const row = (
                        <div
                          key={n.id}
                          className={cn(
                            "flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors",
                            !n.read && "bg-primary/5",
                          )}
                        >
                          <div
                            className={cn(
                              "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                              iconColor,
                            )}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p
                                  className={cn(
                                    "text-sm",
                                    !n.read ? "font-semibold" : "font-medium",
                                  )}
                                >
                                  {n.title}
                                </p>
                                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                                  {n.message}
                                </p>
                                <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1.5">
                                  <Clock className="h-3 w-3" />
                                  {formatTimeAgo(n.createdAt)}
                                </span>
                              </div>
                              {!n.read && (
                                <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {!n.read && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => markRead(n.id)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => remove(n.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                      return n.link ? (
                        <Link key={n.id} href={n.link}>
                          {row}
                        </Link>
                      ) : (
                        <div key={n.id}>{row}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
