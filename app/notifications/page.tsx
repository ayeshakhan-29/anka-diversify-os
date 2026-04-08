"use client"

import { useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { users as mockUsers } from "@/lib/mock-data"
import { 
  Bell, Check, CheckCheck, MessageSquare, GitBranch, FileText,
  UserPlus, AlertTriangle, Clock, Trash2, Settings, Filter,
  Archive, MailOpen, Circle
} from "lucide-react"

interface Notification {
  id: string
  type: "mention" | "assignment" | "comment" | "update" | "alert" | "system"
  title: string
  description: string
  time: string
  read: boolean
  userId?: string
  projectName?: string
  link?: string
}

const initialNotifications: Notification[] = [
  {
    id: "notif-1",
    type: "mention",
    title: "You were mentioned in a comment",
    description: "Sarah mentioned you in the API Integration task discussion",
    time: "5 minutes ago",
    read: false,
    userId: "user-2",
    projectName: "E-Commerce Platform",
  },
  {
    id: "notif-2",
    type: "assignment",
    title: "New task assigned to you",
    description: "Setup CI/CD Pipeline has been assigned to you by John",
    time: "15 minutes ago",
    read: false,
    userId: "user-1",
    projectName: "Mobile App",
  },
  {
    id: "notif-3",
    type: "comment",
    title: "New comment on your task",
    description: "Mike commented on Database Schema Design: 'Looks great!'",
    time: "1 hour ago",
    read: false,
    userId: "user-3",
    projectName: "Dashboard Redesign",
  },
  {
    id: "notif-4",
    type: "update",
    title: "Project phase updated",
    description: "E-Commerce Platform moved from Development to Marketing phase",
    time: "2 hours ago",
    read: true,
    projectName: "E-Commerce Platform",
  },
  {
    id: "notif-5",
    type: "alert",
    title: "Task deadline approaching",
    description: "User Authentication Flow is due in 2 days",
    time: "3 hours ago",
    read: true,
    projectName: "Mobile App",
  },
  {
    id: "notif-6",
    type: "system",
    title: "Weekly report generated",
    description: "Your team productivity report for this week is ready",
    time: "5 hours ago",
    read: true,
  },
  {
    id: "notif-7",
    type: "mention",
    title: "Tagged in project discussion",
    description: "Emily tagged you in the Marketing Strategy thread",
    time: "Yesterday",
    read: true,
    userId: "user-4",
    projectName: "Dashboard Redesign",
  },
  {
    id: "notif-8",
    type: "assignment",
    title: "Task reassigned",
    description: "Performance Optimization was reassigned from you to Mike",
    time: "Yesterday",
    read: true,
    userId: "user-3",
    projectName: "E-Commerce Platform",
  },
  {
    id: "notif-9",
    type: "update",
    title: "Sprint completed",
    description: "Sprint 3 has been completed with 12 tasks done",
    time: "2 days ago",
    read: true,
    projectName: "Mobile App",
  },
  {
    id: "notif-10",
    type: "system",
    title: "New team member joined",
    description: "Alex Chen has joined the Development team",
    time: "3 days ago",
    read: true,
  },
]

const getNotificationIcon = (type: Notification["type"]) => {
  switch (type) {
    case "mention": return MessageSquare
    case "assignment": return UserPlus
    case "comment": return MessageSquare
    case "update": return GitBranch
    case "alert": return AlertTriangle
    case "system": return Bell
    default: return Bell
  }
}

const getNotificationColor = (type: Notification["type"]) => {
  switch (type) {
    case "mention": return "text-primary bg-primary/20"
    case "assignment": return "text-success bg-success/20"
    case "comment": return "text-chart-4 bg-chart-4/20"
    case "update": return "text-warning bg-warning/20"
    case "alert": return "text-destructive bg-destructive/20"
    case "system": return "text-muted-foreground bg-muted"
    default: return "text-muted-foreground bg-muted"
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [filter, setFilter] = useState<string>("all")

  const unreadCount = notifications.filter(n => !n.read).length

  const filteredNotifications = notifications.filter(n => {
    if (filter === "all") return true
    if (filter === "unread") return !n.read
    return n.type === filter
  })

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ))
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id))
  }

  return (
    <MainLayout>
      <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
              {unreadCount > 0 && (
                <Badge className="bg-primary">{unreadCount} new</Badge>
              )}
            </div>
            <p className="text-muted-foreground">Stay updated on your projects and team activity</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={markAllAsRead} className="gap-2">
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
            <Button variant="outline" size="icon" className="h-9 w-9">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="cursor-pointer hover:border-primary/50 transition-all" onClick={() => setFilter("all")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">All</p>
                  <p className="text-xl font-bold">{notifications.length}</p>
                </div>
                <Bell className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-primary/50 transition-all" onClick={() => setFilter("unread")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Unread</p>
                  <p className="text-xl font-bold text-primary">{unreadCount}</p>
                </div>
                <Circle className="h-5 w-5 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-primary/50 transition-all" onClick={() => setFilter("mention")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Mentions</p>
                  <p className="text-xl font-bold">{notifications.filter(n => n.type === "mention").length}</p>
                </div>
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-primary/50 transition-all" onClick={() => setFilter("assignment")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Assignments</p>
                  <p className="text-xl font-bold">{notifications.filter(n => n.type === "assignment").length}</p>
                </div>
                <UserPlus className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
            <TabsTrigger value="mention">Mentions</TabsTrigger>
            <TabsTrigger value="assignment">Assignments</TabsTrigger>
            <TabsTrigger value="comment">Comments</TabsTrigger>
            <TabsTrigger value="update">Updates</TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="mt-4">
            <Card>
              <CardContent className="p-0">
                {filteredNotifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <MailOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No notifications to show</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredNotifications.map(notification => {
                      const Icon = getNotificationIcon(notification.type)
                      const iconColor = getNotificationColor(notification.type)
                      const user = notification.userId ? mockUsers.find(u => u.id === notification.userId) : null

                      return (
                        <div 
                          key={notification.id}
                          className={`flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors ${!notification.read ? "bg-primary/5" : ""}`}
                        >
                          {/* Icon or Avatar */}
                          {user ? (
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${iconColor}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                          )}

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className={`text-sm ${!notification.read ? "font-semibold" : "font-medium"}`}>
                                  {notification.title}
                                </p>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                  {notification.description}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {notification.time}
                                  </span>
                                  {notification.projectName && (
                                    <>
                                      <span className="text-xs text-muted-foreground">in</span>
                                      <Badge variant="secondary" className="text-xs">
                                        {notification.projectName}
                                      </Badge>
                                    </>
                                  )}
                                </div>
                              </div>
                              {!notification.read && (
                                <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1">
                            {!notification.read && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => markAsRead(notification.id)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => deleteNotification(notification.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}
