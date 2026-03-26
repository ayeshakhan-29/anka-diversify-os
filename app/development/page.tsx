"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  FolderKanban,
  GitBranch,
  Clock,
  CheckCircle2,
  ArrowRight,
  Calendar,
  AlertCircle,
  TrendingUp,
  Play,
} from "lucide-react"
import { projects, sprints, tasks, gitCommits, teamMembers } from "@/lib/mock-data"
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts"

const velocityData = [
  { sprint: "S8", velocity: 24 },
  { sprint: "S9", velocity: 28 },
  { sprint: "S10", velocity: 32 },
  { sprint: "S11", velocity: 28 },
  { sprint: "S12", velocity: 34 },
]

const statusColors = {
  backlog: "bg-muted text-muted-foreground",
  todo: "bg-chart-3/20 text-chart-3",
  "in-progress": "bg-primary/20 text-primary",
  review: "bg-warning/20 text-warning",
  done: "bg-success/20 text-success",
}

export default function DevelopmentOverview() {
  const devProjects = projects.filter((p) => p.phase === "development" || p.phase === "product-modeling")
  const activeSprint = sprints.find((s) => s.status === "active")
  const inProgressTasks = tasks.filter((t) => t.status === "in-progress")
  const todoTasks = tasks.filter((t) => t.status === "todo")
  const reviewTasks = tasks.filter((t) => t.status === "review")
  const doneTasks = tasks.filter((t) => t.status === "done")

  return (
    <MainLayout breadcrumb={["Development", "Overview"]}>
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Projects</p>
                  <p className="text-2xl font-semibold text-foreground">{devProjects.length}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <FolderKanban className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-semibold text-foreground">{inProgressTasks.length}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-semibold text-foreground">{doneTasks.length}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Sprint Velocity</p>
                  <p className="text-2xl font-semibold text-foreground">34</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                  <TrendingUp className="h-5 w-5 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Active Sprint */}
          <Card className="lg:col-span-2 bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-foreground">
                  Current Sprint
                </CardTitle>
                {activeSprint && (
                  <p className="text-sm text-muted-foreground mt-1">{activeSprint.name}</p>
                )}
              </div>
              <Link href="/development/sprints">
                <Button variant="outline" size="sm">
                  View All <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {activeSprint ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {new Date(activeSprint.startDate).toLocaleDateString()} -{" "}
                        {new Date(activeSprint.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    <Badge className="bg-success/20 text-success">Active</Badge>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    {(["backlog", "todo", "in-progress", "done"] as const).map((status) => {
                      const count = activeSprint.tasks.filter((t) => t.status === status).length
                      return (
                        <div key={status} className="text-center p-3 rounded-lg bg-secondary/50">
                          <p className="text-2xl font-semibold text-foreground">{count}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {status.replace("-", " ")}
                          </p>
                        </div>
                      )
                    })}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Sprint Progress</span>
                      <span className="text-sm font-medium text-foreground">
                        {Math.round(
                          (activeSprint.tasks.filter((t) => t.status === "done").length /
                            activeSprint.tasks.length) *
                            100
                        )}
                        %
                      </span>
                    </div>
                    <Progress
                      value={
                        (activeSprint.tasks.filter((t) => t.status === "done").length /
                          activeSprint.tasks.length) *
                        100
                      }
                      className="h-2"
                    />
                  </div>

                  <div className="space-y-2">
                    {activeSprint.tasks.slice(0, 3).map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`h-2 w-2 rounded-full shrink-0 ${
                              task.status === "done"
                                ? "bg-success"
                                : task.status === "in-progress"
                                ? "bg-primary"
                                : "bg-muted-foreground"
                            }`}
                          />
                          <span className="text-sm font-medium text-foreground truncate">
                            {task.title}
                          </span>
                        </div>
                        <Badge className={statusColors[task.status]} variant="secondary">
                          {task.status.replace("-", " ")}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No active sprint</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Velocity Chart */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">
                Sprint Velocity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={velocityData}>
                    <defs>
                      <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="sprint"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="velocity"
                      stroke="hsl(var(--primary))"
                      fill="url(#velocityGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-between mt-4 text-sm">
                <span className="text-muted-foreground">Average</span>
                <span className="font-medium text-foreground">29.2 pts</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Commits */}
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold text-foreground">
                Recent Commits
              </CardTitle>
              <Link href="/development/git">
                <Button variant="outline" size="sm">
                  View All <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {gitCommits.slice(0, 4).map((commit) => (
                <div
                  key={commit.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="mt-0.5">
                    <GitBranch className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {commit.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <code className="px-1.5 py-0.5 rounded bg-secondary font-mono">
                        {commit.hash}
                      </code>
                      <span>on {commit.branch}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="bg-secondary text-foreground text-[8px]">
                          {commit.author.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">
                        {commit.author.name}
                      </span>
                      <span className="text-xs text-success">+{commit.additions}</span>
                      <span className="text-xs text-destructive">-{commit.deletions}</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Tasks Needing Attention */}
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold text-foreground">
                Needs Attention
              </CardTitle>
              <Badge variant="destructive" className="text-xs">
                {reviewTasks.length + todoTasks.filter((t) => t.priority === "critical").length}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Review Tasks */}
              {reviewTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20"
                >
                  <AlertCircle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">
                        {task.title}
                      </p>
                      <Badge variant="outline" className="text-xs border-warning text-warning">
                        Review
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Waiting for review from team
                    </p>
                    {task.assignee && (
                      <div className="flex items-center gap-2 mt-2">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="bg-secondary text-foreground text-[8px]">
                            {task.assignee.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">
                          {task.assignee.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Critical Tasks */}
              {todoTasks
                .filter((t) => t.priority === "critical")
                .map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20"
                  >
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">
                          {task.title}
                        </p>
                        <Badge variant="destructive" className="text-xs">
                          Critical
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        High priority task pending
                      </p>
                    </div>
                  </div>
                ))}

              {reviewTasks.length === 0 &&
                todoTasks.filter((t) => t.priority === "critical").length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    <CheckCircle2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">All clear! No urgent items.</p>
                  </div>
                )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2">
              <Link href="/development/projects">
                <Button variant="outline" size="sm" className="gap-2">
                  <FolderKanban className="h-4 w-4" />
                  Projects
                </Button>
              </Link>
              <Link href="/development/sprints">
                <Button variant="outline" size="sm" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Sprints
                </Button>
              </Link>
              <Link href="/development/git">
                <Button variant="outline" size="sm" className="gap-2">
                  <GitBranch className="h-4 w-4" />
                  Git
                </Button>
              </Link>
              <Link href="/development/terminal">
                <Button variant="outline" size="sm" className="gap-2">
                  <Play className="h-4 w-4" />
                  Terminal
                </Button>
              </Link>
              <Link href="/development/ai-assistant">
                <Button size="sm" className="gap-2">
                  Ask AI Assistant
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
