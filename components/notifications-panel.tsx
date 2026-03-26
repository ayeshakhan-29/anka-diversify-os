"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { X, MessageSquare, CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { notifications } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import type { Notification } from "@/lib/types"

interface NotificationsPanelProps {
  onClose: () => void
}

const iconMap = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
}

const colorMap = {
  info: "text-primary",
  success: "text-success",
  warning: "text-warning",
  error: "text-destructive",
}

function formatTimeAgo(timestamp: string) {
  const now = new Date()
  const date = new Date(timestamp)
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)

  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return date.toLocaleDateString()
}

function NotificationItem({ notification }: { notification: Notification }) {
  const Icon = iconMap[notification.type]

  return (
    <div
      className={cn(
        "flex gap-3 p-4 border-b border-border transition-colors hover:bg-secondary/50 cursor-pointer",
        !notification.read && "bg-primary/5"
      )}
    >
      <div className={cn("mt-0.5", colorMap[notification.type])}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-foreground">{notification.title}</p>
          {!notification.read && (
            <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatTimeAgo(notification.timestamp)}
        </p>
      </div>
    </div>
  )
}

export function NotificationsPanel({ onClose }: NotificationsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [onClose])

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-12 w-96 rounded-lg border border-border bg-popover shadow-lg"
    >
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-foreground" />
          <h3 className="font-semibold text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
              {unreadCount}
            </span>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="h-[400px]">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-sm">No notifications</p>
          </div>
        )}
      </ScrollArea>

      <div className="border-t border-border p-3">
        <Button variant="ghost" className="w-full text-sm" asChild>
          <Link href="/notifications">View all notifications</Link>
        </Button>
      </div>
    </div>
  )
}
