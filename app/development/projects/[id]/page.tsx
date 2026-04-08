"use client";

import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectAIAssistant } from "@/components/ai/project-ai-assistant";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { projects as mockProjects, users } from "@/lib/mock-data";
import { projectApi } from "@/lib/project-api";
import type { Project, Task } from "@/lib/types";
import {
  ArrowLeft,
  Plus,
  MoreVertical,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  GripVertical,
  Paperclip,
  Flag,
  User,
  Tag,
  Upload,
  FileText,
  File,
  ChevronRight,
  Settings,
  Trash2,
  Edit3,
  Link2,
  Send,
  X,
} from "lucide-react";
import Link from "next/link";
import { Image } from "lucide-react";

// ─── constants ───────────────────────────────────────────────────────────────

const phaseColors: Record<string, string> = {
  "product-modeling": "bg-chart-4/20 text-chart-4 border-chart-4/30",
  development: "bg-primary/20 text-primary border-primary/30",
  marketing: "bg-warning/20 text-warning border-warning/30",
  completed: "bg-success/20 text-success border-success/30",
};
const phaseLabels: Record<string, string> = {
  "product-modeling": "Product Modeling",
  development: "Development",
  marketing: "Marketing",
  completed: "Completed",
};
const priorityColors: Record<string, string> = {
  critical: "bg-destructive text-destructive-foreground",
  high: "bg-warning text-warning-foreground",
  medium: "bg-primary text-primary-foreground",
  low: "bg-muted text-muted-foreground",
};
const statusColumns = [
  { id: "todo", label: "To Do", icon: Circle, color: "text-muted-foreground" },
  { id: "in-progress", label: "In Progress", icon: Clock, color: "text-primary" },
  { id: "review", label: "Review", icon: AlertCircle, color: "text-warning" },
  { id: "done", label: "Done", icon: CheckCircle2, color: "text-success" },
];

function toDateInputValue(iso?: string) {
  if (!iso) return "";
  return iso.slice(0, 10);
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  // Seed from mock so the page renders immediately, then hydrate from backend
  const seedProject = mockProjects.find((p) => p.id === id) || mockProjects[0];
  const [project, setProject] = useState<Project>(seedProject);
  const [tasks, setTasks] = useState<Task[]>(seedProject.tasks);

  // Fetch real data from backend on mount
  useEffect(() => {
    projectApi.getById(id).then((p) => {
      setProject(p);
      if (p.tasks.length > 0) setTasks(p.tasks);
    }).catch(() => { /* keep mock seed */ });
  }, [id]);

  // ── kanban state ──
  const [phaseFilter, setPhaseFilter] = useState("all");
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  // ── new task form ──
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "", description: "", phase: "development",
    priority: "medium", dueDate: "",
  });

  // ── task detail sidebar ──
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // ── edit project dialog ──
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<{
    name: string; description: string; phase: string;
    priority: string; dueDate: string; githubUrl: string;
  }>({
    name: project.name,
    description: project.description,
    phase: project.phase,
    priority: project.priority || "medium",
    dueDate: toDateInputValue(project.dueDate),
    githubUrl: project.githubUrl || "",
  });
  const [editSaving, setEditSaving] = useState(false);

  // ── delete project dialog ──
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Sync edit form when project loads from backend
  useEffect(() => {
    setEditForm({
      name: project.name,
      description: project.description,
      phase: project.phase,
      priority: project.priority || "medium",
      dueDate: toDateInputValue(project.dueDate),
      githubUrl: project.githubUrl || "",
    });
  }, [project.id, project.name]);

  // ── derived ──
  const teamMembers = project.team;
  const filteredTasks = tasks.filter(
    (t) => phaseFilter === "all" || t.phase === phaseFilter,
  );
  const getTasksByStatus = (status: string) =>
    filteredTasks.filter((t) => t.status === status);
  const progress =
    tasks.length === 0
      ? project.progress ?? 0
      : Math.round((tasks.filter((t) => t.status === "done").length / tasks.length) * 100);

  // ── handlers ──
  const handleDragStart = (task: Task) => setDraggedTask(task);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (status: string) => {
    if (!draggedTask) return;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === draggedTask.id ? { ...t, status: status as Task["status"] } : t,
      ),
    );
    setDraggedTask(null);
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (selectedTask?.id === taskId) setSelectedTask(null);
  };

  const handleAddTask = () => {
    if (!newTask.title.trim()) return;
    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      description: newTask.description,
      status: "todo",
      priority: newTask.priority as Task["priority"],
      projectId: id,
      phase: newTask.phase as Task["phase"],
      dueDate: newTask.dueDate,
      createdAt: new Date().toISOString(),
      tags: [],
    };
    setTasks((prev) => [...prev, task]);
    setNewTask({ title: "", description: "", phase: "development", priority: "medium", dueDate: "" });
    setIsNewTaskOpen(false);
  };

  const handleSaveEdit = async () => {
    setEditSaving(true);
    try {
      const updated = await projectApi.update(id, {
        name: editForm.name,
        description: editForm.description,
        phase: editForm.phase,
        priority: editForm.priority,
        dueDate: editForm.dueDate || undefined,
        githubUrl: editForm.githubUrl || undefined,
      });
      setProject(updated);
    } catch {
      // Update locally if backend unavailable
      setProject((p) => ({
        ...p,
        name: editForm.name,
        description: editForm.description,
        phase: editForm.phase as Project["phase"],
        priority: editForm.priority as Project["priority"],
        dueDate: editForm.dueDate || p.dueDate,
        githubUrl: editForm.githubUrl || undefined,
      }));
    } finally {
      setEditSaving(false);
      setIsEditOpen(false);
    }
  };

  const handleDeleteProject = async () => {
    setDeleting(true);
    try {
      await projectApi.remove(id);
    } catch { /* best-effort */ }
    router.push("/development/projects");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  return (
    <MainLayout>
      <div className="flex flex-col h-full">

        {/* ── Header ── */}
        <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="p-4">
            <div className="flex items-center gap-4 mb-4">
              <Link href="/development/projects">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold">{project.name}</h1>
                  <Badge variant="outline" className={phaseColors[project.phase]}>
                    {phaseLabels[project.phase]}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{project.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setIsEditOpen(true)}
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit Project
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCopyLink}>
                      <Link2 className="h-4 w-4 mr-2" />
                      Copy Link
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setIsDeleteOpen(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Project
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Stats bar */}
            <div className="flex items-center gap-6">
              {teamMembers.length > 0 && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center -space-x-2">
                      {teamMembers.slice(0, 4).map((member) => (
                        <Avatar key={member.id} className="h-7 w-7 border-2 border-background">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback className="text-xs">{member.name.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">{teamMembers.length} members</span>
                  </div>
                  <div className="h-4 w-px bg-border" />
                </>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Due:</span>
                <span>{project.dueDate ? new Date(project.dueDate).toLocaleDateString() : "—"}</span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2 flex-1 max-w-xs">
                <span className="text-sm text-muted-foreground">Progress:</span>
                <Progress value={progress} className="h-2 flex-1" />
                <span className="text-sm font-medium">{progress}%</span>
              </div>
            </div>
          </div>

          {/* ── Tabs ── */}
          <Tabs defaultValue="kanban" className="w-full">
            <div className="px-4 border-t">
              <TabsList className="h-12 bg-transparent gap-4 -mb-px">
                {["kanban", "files", "chat", "activity", "ai-assistant"].map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent capitalize"
                  >
                    {tab === "kanban" ? "Kanban Board"
                      : tab === "files" ? "Files & Deliverables"
                      : tab === "ai-assistant" ? "AI Assistant"
                      : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* ── Kanban ── */}
            <TabsContent value="kanban" className="mt-0 flex-1">
              <div className="p-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <Select value={phaseFilter} onValueChange={setPhaseFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by phase" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Phases</SelectItem>
                      <SelectItem value="product-modeling">Product Modeling</SelectItem>
                      <SelectItem value="development">Development</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button className="gap-2" onClick={() => setIsNewTaskOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Add Task
                  </Button>
                </div>

                <div className="grid grid-cols-4 gap-4 min-h-[600px]">
                  {statusColumns.map((column) => {
                    const columnTasks = getTasksByStatus(column.id);
                    const Icon = column.icon;
                    return (
                      <div
                        key={column.id}
                        className="flex flex-col bg-secondary/30 rounded-lg"
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(column.id)}
                      >
                        <div className="p-3 border-b border-border/50 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${column.color}`} />
                            <span className="font-medium text-sm">{column.label}</span>
                            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              {columnTasks.length}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => setIsNewTaskOpen(true)}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                          {columnTasks.map((task) => (
                            <Card
                              key={task.id}
                              className="cursor-pointer hover:border-primary/50 transition-all group"
                              draggable
                              onDragStart={() => handleDragStart(task)}
                              onClick={() => setSelectedTask(task)}
                            >
                              <CardContent className="p-3 space-y-3">
                                <div className="flex items-start gap-2">
                                  <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 cursor-grab shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm leading-tight">{task.title}</p>
                                    {task.description && (
                                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                        {task.description}
                                      </p>
                                    )}
                                  </div>
                                  {/* Delete task button */}
                                  <button
                                    className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-muted-foreground hover:text-destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteTask(task.id);
                                    }}
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge
                                    variant="outline"
                                    className={`${phaseColors[task.phase]} text-xs px-1.5 py-0`}
                                  >
                                    {phaseLabels[task.phase]}
                                  </Badge>
                                  {task.tags?.map((tag) => (
                                    <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                                  <div className="flex items-center gap-2">
                                    {task.assignee && (
                                      <Avatar className="h-5 w-5">
                                        <AvatarImage src={task.assignee.avatar} />
                                        <AvatarFallback className="text-xs">
                                          {task.assignee.name.slice(0, 2)}
                                        </AvatarFallback>
                                      </Avatar>
                                    )}
                                    <div className={`h-2 w-2 rounded-full ${priorityColors[task.priority]}`} />
                                  </div>
                                  {task.dueDate && (
                                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Calendar className="h-3 w-3" />
                                      {new Date(task.dueDate).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                      })}
                                    </span>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            {/* ── Files ── */}
            <TabsContent value="files" className="mt-0">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold">Files & Deliverables</h2>
                  <Button className="gap-2">
                    <Upload className="h-4 w-4" />
                    Upload File
                  </Button>
                </div>
                {["product-modeling", "development", "marketing"].map((phase) => (
                  <div key={phase} className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant="outline" className={phaseColors[phase]}>{phaseLabels[phase]}</Badge>
                      <span className="text-sm text-muted-foreground">Phase Deliverables</span>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      {[
                        { i: 1, Icon: FileText },
                        { i: 2, Icon: Image },
                        { i: 3, Icon: File },
                      ].map(({ i, Icon }) => (
                        <Card key={i} className="group hover:border-primary/50 transition-all cursor-pointer">
                          <CardContent className="p-4">
                            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-3">
                              <Icon className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <p className="font-medium text-sm truncate">Deliverable {i}</p>
                            <p className="text-xs text-muted-foreground mt-1">Updated 2 days ago</p>
                          </CardContent>
                        </Card>
                      ))}
                      <Card className="border-dashed hover:border-primary/50 transition-all cursor-pointer">
                        <CardContent className="p-4 h-full flex flex-col items-center justify-center text-muted-foreground">
                          <Plus className="h-8 w-8 mb-2" />
                          <span className="text-sm">Add File</span>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* ── Chat ── */}
            <TabsContent value="chat" className="mt-0 h-[calc(100vh-280px)]">
              <div className="flex flex-col h-full">
                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                  {[
                    { user: users[0], message: "Hey team, pushed latest updates. Please review.", time: "10:30 AM" },
                    { user: users[1], message: "Great work! Will take a look this afternoon.", time: "10:45 AM" },
                    { user: users[0], message: "Perfect, let's sync tomorrow.", time: "11:30 AM" },
                  ].map((chat, i) => (
                    <div key={i} className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={chat.user.avatar} />
                        <AvatarFallback>{chat.user.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{chat.user.name}</span>
                          <span className="text-xs text-muted-foreground">{chat.time}</span>
                        </div>
                        <p className="text-sm mt-1 text-foreground/90">{chat.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Input placeholder="Type a message..." className="flex-1" />
                    <Button size="icon" className="h-8 w-8"><Send className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ── Activity ── */}
            <TabsContent value="activity" className="mt-0">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
                <div className="space-y-4">
                  {[
                    { user: users[0], action: "moved task", target: "Setup CI/CD Pipeline", from: "In Progress", to: "Review", time: "2 hours ago" },
                    { user: users[1], action: "commented on", target: "API Integration", time: "3 hours ago" },
                    { user: users[0], action: "created task", target: "User Authentication Flow", time: "Yesterday" },
                  ].map((activity, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={activity.user.avatar} />
                        <AvatarFallback>{activity.user.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{activity.user.name}</span>
                          <span className="text-muted-foreground"> {activity.action} </span>
                          <span className="font-medium">{activity.target}</span>
                          {activity.from && (
                            <span className="text-muted-foreground"> from {activity.from} to {activity.to}</span>
                          )}
                        </p>
                        <span className="text-xs text-muted-foreground">{activity.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* ── AI Assistant ── */}
            <TabsContent value="ai-assistant" className="mt-0 flex-1">
              <ProjectAIAssistant project={project} />
            </TabsContent>
          </Tabs>
        </div>

        {/* ── Edit Project Dialog ── */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
              <DialogDescription>Update project details and settings</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Project Name</label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Phase</label>
                  <Select value={editForm.phase} onValueChange={(v) => setEditForm((f) => ({ ...f, phase: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="product-modeling">Product Modeling</SelectItem>
                      <SelectItem value="development">Development</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Priority</label>
                  <Select value={editForm.priority} onValueChange={(v) => setEditForm((f) => ({ ...f, priority: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Due Date</label>
                <Input
                  type="date"
                  value={editForm.dueDate}
                  onChange={(e) => setEditForm((f) => ({ ...f, dueDate: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">GitHub Repository URL</label>
                <Input
                  type="url"
                  placeholder="https://github.com/username/repo"
                  value={editForm.githubUrl}
                  onChange={(e) => setEditForm((f) => ({ ...f, githubUrl: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveEdit} disabled={editSaving}>
                {editSaving ? "Saving…" : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Delete Project Confirm ── */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Delete Project</DialogTitle>
              <DialogDescription>
                This will permanently delete <strong>{project.name}</strong> and all its data. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteProject} disabled={deleting}>
                {deleting ? "Deleting…" : "Delete Project"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Add Task Dialog ── */}
        <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>Add a new task to the project</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Task Title</label>
                <Input
                  placeholder="Enter task title"
                  value={newTask.title}
                  onChange={(e) => setNewTask((t) => ({ ...t, title: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Describe the task"
                  rows={3}
                  value={newTask.description}
                  onChange={(e) => setNewTask((t) => ({ ...t, description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Phase</label>
                  <Select value={newTask.phase} onValueChange={(v) => setNewTask((t) => ({ ...t, phase: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="product-modeling">Product Modeling</SelectItem>
                      <SelectItem value="development">Development</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Priority</label>
                  <Select value={newTask.priority} onValueChange={(v) => setNewTask((t) => ({ ...t, priority: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Due Date</label>
                <Input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask((t) => ({ ...t, dueDate: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewTaskOpen(false)}>Cancel</Button>
              <Button onClick={handleAddTask} disabled={!newTask.title.trim()}>Create Task</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Task Detail Sidebar ── */}
        {selectedTask && (
          <div className="fixed inset-y-0 right-0 w-[400px] bg-card border-l shadow-xl z-50">
            <div className="flex flex-col h-full">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-semibold">Task Details</h3>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDeleteTask(selectedTask.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedTask(null)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <div>
                  <h4 className="text-lg font-semibold">{selectedTask.title}</h4>
                  <p className="text-sm text-muted-foreground mt-2">{selectedTask.description}</p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <User className="h-4 w-4" /> Assignee
                    </span>
                    <div className="flex items-center gap-2">
                      {selectedTask.assignee ? (
                        <>
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={selectedTask.assignee.avatar} />
                            <AvatarFallback>{selectedTask.assignee.name.slice(0, 2)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{selectedTask.assignee.name}</span>
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">Unassigned</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Flag className="h-4 w-4" /> Priority
                    </span>
                    <Badge className={priorityColors[selectedTask.priority]}>{selectedTask.priority}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" /> Due Date
                    </span>
                    <span className="text-sm">
                      {selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString() : "Not set"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Tag className="h-4 w-4" /> Phase
                    </span>
                    <Badge variant="outline" className={phaseColors[selectedTask.phase]}>
                      {phaseLabels[selectedTask.phase]}
                    </Badge>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <h5 className="font-medium mb-3">Comments</h5>
                  <div className="mt-3 flex gap-2">
                    <Input placeholder="Add a comment..." className="flex-1" />
                    <Button size="icon" className="h-9 w-9"><Send className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
