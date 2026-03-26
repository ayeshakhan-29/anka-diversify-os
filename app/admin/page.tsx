"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  Users,
  FolderKanban,
  CheckCircle2,
  TrendingUp,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import { users, projects, tasks, teamMembers } from "@/lib/mock-data"

const stats = [
  {
    title: "Total Users",
    value: users.length.toString(),
    change: "+12%",
    trend: "up",
    icon: Users,
    color: "text-primary",
  },
  {
    title: "Active Projects",
    value: projects.filter((p) => p.status === "active").length.toString(),
    change: "+3",
    trend: "up",
    icon: FolderKanban,
    color: "text-accent",
  },
  {
    title: "Completed Tasks",
    value: tasks.filter((t) => t.status === "done").length.toString(),
    change: "+28%",
    trend: "up",
    icon: CheckCircle2,
    color: "text-success",
  },
  {
    title: "Team Velocity",
    value: "34",
    change: "-5%",
    trend: "down",
    icon: TrendingUp,
    color: "text-warning",
  },
]

const phaseColors = {
  "product-modeling": "bg-chart-4 text-foreground",
  development: "bg-primary text-primary-foreground",
  marketing: "bg-accent text-accent-foreground",
  completed: "bg-success text-success-foreground",
}

const priorityColors = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-chart-3/20 text-chart-3",
  high: "bg-warning/20 text-warning",
  critical: "bg-destructive/20 text-destructive",
}

export default function AdminDashboard() {
  const activeUsers = users.filter((u) => u.status === "active").length
  const onlineMembers = teamMembers.filter((m) => m.status === "online").length

  return (
    <MainLayout breadcrumb={["Admin", "Dashboard"]}>
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="mt-1 text-3xl font-semibold text-foreground">
                      {stat.value}
                    </p>
                    <div className="mt-2 flex items-center gap-1 text-sm">
                      {stat.trend === "up" ? (
                        <ArrowUpRight className="h-4 w-4 text-success" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-destructive" />
                      )}
                      <span
                        className={
                          stat.trend === "up" ? "text-success" : "text-destructive"
                        }
                      >
                        {stat.change}
                      </span>
                      <span className="text-muted-foreground">vs last month</span>
                    </div>
                  </div>
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-lg bg-secondary ${stat.color}`}
                  >
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Projects */}
          <Card className="lg:col-span-2 bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold text-foreground">
                Active Projects
              </CardTitle>
              <Badge variant="secondary">{projects.filter((p) => p.status === "active").length} active</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {projects
                .filter((p) => p.status === "active")
                .map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center gap-4 rounded-lg border border-border bg-secondary/30 p-4 transition-colors hover:bg-secondary/50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-foreground truncate">
                          {project.name}
                        </h4>
                        <Badge
                          className={`text-xs ${phaseColors[project.phase]}`}
                        >
                          {project.phase.replace("-", " ")}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {project.description}
                      </p>
                      <div className="mt-3 flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground">
                              Progress
                            </span>
                            <span className="text-xs font-medium text-foreground">
                              {project.progress}%
                            </span>
                          </div>
                          <Progress value={project.progress} className="h-1.5" />
                        </div>
                        <div className="flex -space-x-2">
                          {project.team.slice(0, 3).map((member) => (
                            <Avatar
                              key={member.id}
                              className="h-6 w-6 border-2 border-card"
                            >
                              <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">
                                {member.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {project.team.length > 3 && (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-secondary text-[10px] font-medium text-muted-foreground">
                              +{project.team.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>

          {/* Team Activity */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">
                Team Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-4">
                <div>
                  <p className="text-2xl font-semibold text-foreground">
                    {onlineMembers}/{teamMembers.length}
                  </p>
                  <p className="text-sm text-muted-foreground">Members online</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/20">
                  <div className="h-3 w-3 rounded-full bg-success animate-pulse" />
                </div>
              </div>

              <div className="space-y-3">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-secondary/50"
                  >
                    <div className="relative">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-secondary text-foreground text-xs">
                          {member.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${
                          member.status === "online"
                            ? "bg-success"
                            : member.status === "away"
                            ? "bg-warning"
                            : "bg-muted-foreground"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {member.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {member.role}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {member.department}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Tasks */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold text-foreground">
              Recent Tasks
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Last 7 days</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                      Task
                    </th>
                    <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                      Assignee
                    </th>
                    <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                      Priority
                    </th>
                    <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                      Due Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tasks.slice(0, 5).map((task) => (
                    <tr key={task.id} className="group">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-2 w-2 rounded-full ${
                              task.status === "done"
                                ? "bg-success"
                                : task.status === "in-progress"
                                ? "bg-primary"
                                : "bg-muted-foreground"
                            }`}
                          />
                          <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                            {task.title}
                          </span>
                        </div>
                      </td>
                      <td className="py-4">
                        {task.assignee ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="bg-secondary text-foreground text-[10px]">
                                {task.assignee.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">
                              {task.assignee.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="py-4">
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            task.status === "done"
                              ? "border-success text-success"
                              : task.status === "in-progress"
                              ? "border-primary text-primary"
                              : task.status === "review"
                              ? "border-warning text-warning"
                              : "border-muted-foreground text-muted-foreground"
                          }`}
                        >
                          {task.status.replace("-", " ")}
                        </Badge>
                      </td>
                      <td className="py-4">
                        <Badge className={`text-xs ${priorityColors[task.priority]}`}>
                          {task.priority}
                        </Badge>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {new Date(task.dueDate) < new Date() &&
                            task.status !== "done" && (
                              <AlertTriangle className="h-4 w-4 text-destructive" />
                            )}
                          {new Date(task.dueDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
