"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Calendar,
  Plus,
  Play,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  TrendingUp,
  Target,
  Sparkles,
  Loader2,
  X,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { projectApi } from "@/lib/project-api"
import { aiClient } from "@/lib/ai-client"
import type { Sprint, Project } from "@/lib/types"
import { cn } from "@/lib/utils"

interface SprintSuggestion {
  taskId: string;
  title: string;
  reason: string;
  priority: string;
}

const statusColors: Record<string, string> = {
  planning: "bg-muted text-muted-foreground",
  active: "bg-success/20 text-success",
  completed: "bg-primary/20 text-primary",
}

const statusIcons: Record<string, React.ElementType> = {
  planning: Clock,
  active: Play,
  completed: CheckCircle2,
}

function formatDateRange(start: string, end: string) {
  const startDate = new Date(start)
  const endDate = new Date(end)
  return `${startDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} - ${endDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`
}

function getDaysRemaining(end: string) {
  const endDate = new Date(end)
  const now = new Date()
  const diff = endDate.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function SprintsPage() {
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Create sprint form state
  const [formName, setFormName] = useState("")
  const [formGoal, setFormGoal] = useState("")
  const [formProjectId, setFormProjectId] = useState("")
  const [formStartDate, setFormStartDate] = useState("")
  const [formEndDate, setFormEndDate] = useState("")
  const [formVelocity, setFormVelocity] = useState("")
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const allProjects = await projectApi.getAll()
        setProjects(allProjects)

        const sprintArrays = await Promise.all(
          allProjects.map((p) => projectApi.getSprints(p.id).catch(() => [] as Sprint[]))
        )
        setSprints(sprintArrays.flat())
      } catch (err) {
        console.error("Failed to load sprints:", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const activeSprints = sprints.filter((s) => s.status === "active")
  const planningSprints = sprints.filter((s) => s.status === "planning")
  const completedSprints = sprints.filter((s) => s.status === "completed")

  const totalVelocity = completedSprints.reduce((sum, s) => sum + s.velocity, 0)
  const avgVelocity = completedSprints.length > 0 ? Math.round(totalVelocity / completedSprints.length) : 0

  async function handleCreateSprint() {
    if (!formName || !formProjectId || !formStartDate || !formEndDate) return
    setCreating(true)
    try {
      const newSprint = await projectApi.createSprint(formProjectId, {
        name: formName,
        goal: formGoal || undefined,
        startDate: formStartDate,
        endDate: formEndDate,
        velocity: formVelocity ? parseInt(formVelocity, 10) : undefined,
      })
      setSprints((prev) => [newSprint, ...prev])
      setDialogOpen(false)
      setFormName("")
      setFormGoal("")
      setFormProjectId("")
      setFormStartDate("")
      setFormEndDate("")
      setFormVelocity("")
    } catch (err) {
      console.error("Failed to create sprint:", err)
    } finally {
      setCreating(false)
    }
  }

  async function handleCompleteSprint(sprint: Sprint) {
    try {
      const updated = await projectApi.updateSprint(sprint.projectId, sprint.id, { status: "completed" })
      setSprints((prev) => prev.map((s) => (s.id === sprint.id ? updated : s)))
    } catch (err) {
      console.error("Failed to complete sprint:", err)
    }
  }

  const [suggestions, setSuggestions] = useState<Record<string, SprintSuggestion[]>>({})
  const [loadingSuggestions, setLoadingSuggestions] = useState<string | null>(null)

  async function handleSuggestTasks(sprint: Sprint) {
    setLoadingSuggestions(sprint.id)
    try {
      const result = await aiClient.suggestSprintTasks(sprint.projectId, sprint.id)
      setSuggestions((prev) => ({ ...prev, [sprint.id]: result }))
    } catch (err) {
      console.error("Failed to get suggestions:", err)
    } finally {
      setLoadingSuggestions(null)
    }
  }

  async function handleAddSuggestedTask(sprint: Sprint, taskId: string) {
    try {
      await projectApi.addTaskToSprint(sprint.projectId, sprint.id, taskId)
      setSuggestions((prev) => ({
        ...prev,
        [sprint.id]: (prev[sprint.id] || []).filter((s) => s.taskId !== taskId),
      }))
      const updated = await projectApi.getSprints(sprint.projectId)
      setSprints((prev) => [...prev.filter((s) => s.projectId !== sprint.projectId), ...updated])
    } catch (err) {
      console.error("Failed to add task:", err)
    }
  }

  async function handleDeleteSprint(sprint: Sprint) {
    try {
      await projectApi.deleteSprint(sprint.projectId, sprint.id)
      setSprints((prev) => prev.filter((s) => s.id !== sprint.id))
    } catch (err) {
      console.error("Failed to delete sprint:", err)
    }
  }

  return (
    <MainLayout breadcrumb={["Development", "Sprints"]}>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Sprints</p>
                  <p className="text-2xl font-semibold text-foreground">{activeSprints.length}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <Play className="h-5 w-5 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">In Planning</p>
                  <p className="text-2xl font-semibold text-foreground">{planningSprints.length}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-semibold text-foreground">{completedSprints.length}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Velocity</p>
                  <p className="text-2xl font-semibold text-foreground">{avgVelocity}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                  <TrendingUp className="h-5 w-5 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Sprint Management</h2>
            <p className="text-sm text-muted-foreground">
              Plan and track your agile sprints
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Sprint
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Sprint</DialogTitle>
                <DialogDescription>
                  Define a new sprint for your team.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="sprintName">Sprint Name</Label>
                  <Input
                    id="sprintName"
                    placeholder="e.g., Sprint 13 - User Dashboard"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sprintGoal">Goal (optional)</Label>
                  <Input
                    id="sprintGoal"
                    placeholder="What should this sprint achieve?"
                    value={formGoal}
                    onChange={(e) => setFormGoal(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Project</Label>
                  <Select value={formProjectId} onValueChange={setFormProjectId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Target Velocity (optional)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 30"
                    value={formVelocity}
                    onChange={(e) => setFormVelocity(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button
                  onClick={handleCreateSprint}
                  disabled={creating || !formName || !formProjectId || !formStartDate || !formEndDate}
                >
                  {creating ? "Creating..." : "Create Sprint"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="text-center py-12 text-muted-foreground">Loading sprints...</div>
        )}

        {/* Empty state */}
        {!loading && sprints.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No sprints yet. Create your first sprint to get started.</p>
          </div>
        )}

        {/* Sprint Cards */}
        {!loading && sprints.length > 0 && (
          <div className="space-y-6">
            {/* Active Sprints */}
            {activeSprints.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Play className="h-4 w-4 text-success" />
                  Active Sprints
                </h3>
                <div className="grid gap-4">
                  {activeSprints.map((sprint) => {
                    const project = projects.find((p) => p.id === sprint.projectId)
                    const daysRemaining = getDaysRemaining(sprint.endDate)
                    const completedTasks = sprint.tasks.filter((t) => t.status === "done").length
                    const totalTasks = sprint.tasks.length
                    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
                    const StatusIcon = statusIcons[sprint.status] || Clock

                    return (
                      <Card key={sprint.id} className="bg-card border-border border-l-4 border-l-success">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-foreground">{sprint.name}</h3>
                                <Badge className={statusColors[sprint.status] || ""}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {sprint.status}
                                </Badge>
                              </div>
                              {project && (
                                <p className="text-sm text-muted-foreground mb-4">
                                  Project: {project.name}
                                </p>
                              )}

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                                <div className="p-3 rounded-lg bg-secondary/50">
                                  <p className="text-xs text-muted-foreground">Duration</p>
                                  <p className="text-sm font-medium text-foreground mt-1">
                                    {formatDateRange(sprint.startDate, sprint.endDate)}
                                  </p>
                                </div>
                                <div className="p-3 rounded-lg bg-secondary/50">
                                  <p className="text-xs text-muted-foreground">Days Remaining</p>
                                  <p className={cn(
                                    "text-sm font-medium mt-1",
                                    daysRemaining < 3 ? "text-destructive" : "text-foreground"
                                  )}>
                                    {daysRemaining > 0 ? `${daysRemaining} days` : "Ending today"}
                                  </p>
                                </div>
                                <div className="p-3 rounded-lg bg-secondary/50">
                                  <p className="text-xs text-muted-foreground">Tasks</p>
                                  <p className="text-sm font-medium text-foreground mt-1">
                                    {completedTasks}/{totalTasks} completed
                                  </p>
                                </div>
                                <div className="p-3 rounded-lg bg-secondary/50">
                                  <p className="text-xs text-muted-foreground">Velocity</p>
                                  <p className="text-sm font-medium text-foreground mt-1">
                                    {sprint.velocity} pts
                                  </p>
                                </div>
                              </div>

                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm text-muted-foreground">Progress</span>
                                  <span className="text-sm font-medium text-foreground">{progress}%</span>
                                </div>
                                <Progress value={progress} className="h-2" />
                              </div>

                              {/* Task Breakdown */}
                              <div className="flex gap-2 mt-4 flex-wrap">
                                {(["backlog", "todo", "in-progress", "review", "done"] as const).map((status) => {
                                  const count = sprint.tasks.filter((t) => t.status === status).length
                                  if (count === 0) return null
                                  return (
                                    <Badge key={status} variant="outline" className="text-xs">
                                      {status.replace("-", " ")}: {count}
                                    </Badge>
                                  )
                                })}
                              </div>
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Target className="h-4 w-4 mr-2" />
                                  View Board
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSuggestTasks(sprint)}>
                                  <Sparkles className="h-4 w-4 mr-2" />
                                  AI Suggest Tasks
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleCompleteSprint(sprint)}>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Complete Sprint
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDeleteSprint(sprint)}
                                >
                                  Delete Sprint
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {/* AI Suggestions Panel */}
                          {loadingSuggestions === sprint.id && (
                            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground border border-dashed rounded-lg p-3">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              AI is analyzing tasks...
                            </div>
                          )}
                          {suggestions[sprint.id]?.length > 0 && (
                            <div className="mt-4 border border-primary/20 rounded-lg bg-primary/5 overflow-hidden">
                              <div className="flex items-center justify-between px-4 py-2 bg-primary/10 border-b border-primary/20">
                                <span className="text-sm font-medium flex items-center gap-2">
                                  <Sparkles className="h-4 w-4 text-primary" />
                                  AI suggests {suggestions[sprint.id].length} tasks for this sprint
                                </span>
                                <button onClick={() => setSuggestions((p) => ({ ...p, [sprint.id]: [] }))} className="text-muted-foreground hover:text-foreground">
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                              <div className="p-3 space-y-2">
                                {suggestions[sprint.id].map((s) => (
                                  <div key={s.taskId} className="flex items-start justify-between gap-3 rounded border bg-background p-2.5">
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium truncate">{s.title}</p>
                                      <p className="text-xs text-muted-foreground mt-0.5">{s.reason}</p>
                                    </div>
                                    <Button size="sm" className="h-7 text-xs shrink-0" onClick={() => handleAddSuggestedTask(sprint, s.taskId)}>
                                      Add
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Planning Sprints */}
            {planningSprints.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Planning
                </h3>
                <div className="grid gap-4">
                  {planningSprints.map((sprint) => {
                    const project = projects.find((p) => p.id === sprint.projectId)
                    const StatusIcon = statusIcons[sprint.status] || Clock

                    return (
                      <Card key={sprint.id} className="bg-card border-border border-l-4 border-l-muted">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-foreground">{sprint.name}</h3>
                                <Badge className={statusColors[sprint.status] || ""}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {sprint.status}
                                </Badge>
                              </div>
                              {project && (
                                <p className="text-sm text-muted-foreground">
                                  Project: {project.name}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground flex-wrap">
                                <span>{formatDateRange(sprint.startDate, sprint.endDate)}</span>
                                <span>Tasks: {sprint.tasks.length}</span>
                              </div>
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Calendar className="h-4 w-4 mr-2" />
                                  Edit Sprint
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDeleteSprint(sprint)}
                                >
                                  Delete Sprint
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Completed Sprints */}
            {completedSprints.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Completed Sprints
                </h3>
                <div className="grid gap-4">
                  {completedSprints.map((sprint) => {
                    const project = projects.find((p) => p.id === sprint.projectId)
                    const StatusIcon = statusIcons[sprint.status] || CheckCircle2

                    return (
                      <Card key={sprint.id} className="bg-card border-border opacity-80">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-foreground">{sprint.name}</h3>
                                <Badge className={statusColors[sprint.status] || ""}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {sprint.status}
                                </Badge>
                              </div>
                              {project && (
                                <p className="text-sm text-muted-foreground">
                                  Project: {project.name}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground flex-wrap">
                                <span>{formatDateRange(sprint.startDate, sprint.endDate)}</span>
                                <span>Velocity: {sprint.velocity} pts</span>
                                <span>Tasks: {sprint.tasks.length}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                View Report
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => handleDeleteSprint(sprint)}
                                  >
                                    Delete Sprint
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  )
}
