"use client";

import { useState, use, useEffect, useCallback, useRef } from "react";
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
import { ProjectIDE } from "@/components/project/project-ide";
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
import { projects as mockProjects } from "@/lib/mock-data";
import { projectApi } from "@/lib/project-api";
import type { Project, Task, ProjectFile, Activity, Comment, ProjectChatMessage, ProjectMember } from "@/lib/types";
import { inviteApi } from "@/lib/invite-api";
import type { TeamUser } from "@/lib/invite-api";
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
  UserPlus,
  GitMerge,
  Unlink,
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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  // Fetch project metadata from backend
  useEffect(() => {
    projectApi.getById(id).then((p) => {
      setProject(p);
    }).catch(() => { /* keep mock seed */ });
  }, [id]);

  // Fetch real tasks from backend (separate from project metadata)
  useEffect(() => {
    setTasksLoading(true);
    projectApi.getTasks(id)
      .then((t) => setTasks(t))
      .catch(() => setTasks(seedProject.tasks)) // fall back to mock tasks
      .finally(() => setTasksLoading(false));
  }, [id]);

  // ── files state ──
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [isAddFileOpen, setIsAddFileOpen] = useState(false);
  const [newFile, setNewFile] = useState({ name: "", type: "doc", phase: "development", url: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileUploading, setFileUploading] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<ProjectFile | null>(null);

  useEffect(() => {
    projectApi.getFiles(id).then(setFiles).catch(() => {});
  }, [id]);

  const handleAddFile = async () => {
    const name = selectedFile ? selectedFile.name : newFile.name.trim();
    if (!name) return;

    setFileUploading(true);
    const optimistic: ProjectFile = {
      id: `tmp-${Date.now()}`,
      projectId: id,
      name,
      type: newFile.type as ProjectFile["type"],
      phase: newFile.phase,
      url: newFile.url || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setFiles((prev) => [optimistic, ...prev]);
    setIsAddFileOpen(false);

    try {
      let saved: ProjectFile;
      if (selectedFile) {
        saved = await projectApi.uploadFile(id, selectedFile, { phase: newFile.phase });
      } else {
        saved = await projectApi.createFile(id, newFile);
      }
      setFiles((prev) => prev.map((f) => f.id === optimistic.id ? saved : f));
    } catch {
      setFiles((prev) => prev.filter((f) => f.id !== optimistic.id));
    } finally {
      setFileUploading(false);
      setNewFile({ name: "", type: "doc", phase: "development", url: "" });
      setSelectedFile(null);
    }
  };

  const handleDeleteFile = async () => {
    if (!fileToDelete) return;
    const file = fileToDelete;
    setFileToDelete(null);
    setFiles((prev) => prev.filter((f) => f.id !== file.id));
    try {
      await projectApi.deleteFile(id, file.id);
    } catch {
      setFiles((prev) => [file, ...prev]);
    }
  };

  // ── members state ──
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [allUsers, setAllUsers] = useState<TeamUser[]>([]);
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);

  useEffect(() => {
    projectApi.getMembers(id).then(setMembers).catch(() => {});
    inviteApi.listUsers().then(setAllUsers).catch(() => {});
  }, [id]);

  const handleAddMember = async (userId: string) => {
    setMemberLoading(true);
    setMemberError(null);
    try {
      await projectApi.addMember(id, userId);
      const updated = await projectApi.getMembers(id);
      setMembers(updated);
    } catch (e: any) {
      setMemberError(e.message);
    } finally {
      setMemberLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await projectApi.removeMember(id, userId);
      setMembers((prev) => prev.filter((m) => m.id !== userId));
    } catch { /* silent */ }
  };

  // ── activities state ──
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeTab, setActiveTab] = useState("kanban");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── agent → IDE bridge ──
  const [pendingAgentChanges, setPendingAgentChanges] = useState<{ path: string; content: string; description: string }[] | null>(null);

  const handleAgentChanges = (changes: { path: string; content: string; description: string }[]) => {
    setPendingAgentChanges(changes);
    setActiveTab("code");
  };

  const refreshActivities = useCallback(() => {
    projectApi.getActivities(id).then(setActivities).catch(() => {});
  }, [id]);

  useEffect(() => { refreshActivities(); }, [refreshActivities]);

  // Poll every 8s when activity tab is open
  useEffect(() => {
    if (activeTab === "activity") {
      pollRef.current = setInterval(refreshActivities, 8000);
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeTab, refreshActivities]);

  // ── comments state ──
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

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

  useEffect(() => {
    if (!selectedTask) return;
    projectApi.getComments(id, selectedTask.id).then(setComments).catch(() => {});
  }, [id, selectedTask?.id]);

  const handleAddComment = async () => {
    if (!commentInput.trim() || !selectedTask || commentSubmitting) return;
    setCommentSubmitting(true);
    try {
      const comment = await projectApi.createComment(id, selectedTask.id, commentInput.trim());
      setComments((prev) => [...prev, comment]);
      setCommentInput("");
      refreshActivities();
    } catch { /* silent */ } finally {
      setCommentSubmitting(false);
    }
  };

  // ── delete task confirmation ──
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  // ── chat state ──
  const [chatMessages, setChatMessages] = useState<ProjectChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshChat = useCallback(() => {
    projectApi.getChatMessages(id).then((msgs) => {
      setChatMessages(msgs);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (activeTab === "chat") {
      refreshChat();
      chatPollRef.current = setInterval(refreshChat, 5000);
    } else {
      if (chatPollRef.current) clearInterval(chatPollRef.current);
    }
    return () => { if (chatPollRef.current) clearInterval(chatPollRef.current); };
  }, [activeTab, refreshChat]);

  const handleSendChat = async () => {
    if (!chatInput.trim() || chatSending) return;
    const content = chatInput.trim();
    setChatInput("");
    setChatSending(true);
    try {
      const msg = await projectApi.sendChatMessage(id, content);
      setChatMessages((prev) => [...prev, msg]);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch { setChatInput(content); }
    finally { setChatSending(false); }
  };

  // ── edit project dialog ──
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<{
    name: string; description: string; phase: string;
    priority: string; dueDate: string; githubUrl: string; localPath: string;
  }>({
    name: project.name,
    description: project.description,
    phase: project.phase,
    priority: project.priority || "medium",
    dueDate: toDateInputValue(project.dueDate),
    githubUrl: project.githubUrl || "",
    localPath: project.localPath || "",
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
      localPath: project.localPath || "",
    });
  }, [project.id, project.name]);

  // ── derived ──

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
    const newStatus = status as Task["status"];
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => t.id === draggedTask.id ? { ...t, status: newStatus } : t),
    );
    // Persist to backend
    projectApi.updateTask(id, draggedTask.id, { status })
      .then(() => refreshActivities())
      .catch(() => {
        setTasks((prev) =>
          prev.map((t) => t.id === draggedTask.id ? { ...t, status: draggedTask.status } : t),
        );
      });
    setDraggedTask(null);
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    const task = taskToDelete;
    setTaskToDelete(null);
    if (selectedTask?.id === task.id) setSelectedTask(null);
    // Optimistic remove
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    try {
      await projectApi.deleteTask(id, task.id);
      refreshActivities();
    } catch {
      setTasks((prev) => [...prev, task]);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim()) return;
    // Optimistic local task
    const optimistic: Task = {
      id: `tmp-${Date.now()}`,
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
    setTasks((prev) => [optimistic, ...prev]);
    setNewTask({ title: "", description: "", phase: "development", priority: "medium", dueDate: "" });
    setIsNewTaskOpen(false);
    try {
      const saved = await projectApi.createTask(id, {
        title: optimistic.title,
        description: optimistic.description,
        status: optimistic.status,
        priority: optimistic.priority,
        phase: optimistic.phase,
        dueDate: optimistic.dueDate || undefined,
      });
      setTasks((prev) => prev.map((t) => t.id === optimistic.id ? saved : t));
      refreshActivities();
    } catch { /* keep optimistic */ }
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
        localPath: editForm.localPath || undefined,
      });
      setProject(updated);
    } catch {
      setProject((p) => ({
        ...p,
        name: editForm.name,
        description: editForm.description,
        phase: editForm.phase as Project["phase"],
        priority: editForm.priority as Project["priority"],
        dueDate: editForm.dueDate || p.dueDate,
        githubUrl: editForm.githubUrl || undefined,
        localPath: editForm.localPath || undefined,
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
              {members.length > 0 && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center -space-x-2">
                      {members.slice(0, 4).map((member) => (
                        <Avatar key={member.id} className="h-7 w-7 border-2 border-background">
                          <AvatarFallback className="text-xs">{(member.name || member.email).slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">{members.length} member{members.length !== 1 ? "s" : ""}</span>
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
          <Tabs value={activeTab} className="w-full" onValueChange={(v) => { setActiveTab(v); if (v === "activity") refreshActivities(); }}>
            <div className="px-4 border-t">
              <TabsList className="h-12 bg-transparent gap-4 -mb-px">
                {["kanban", "files", "code", "chat", "activity", "ai-assistant"].map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent capitalize"
                  >
                    {tab === "kanban" ? "Kanban Board"
                      : tab === "files" ? "Files & Deliverables"
                      : tab === "code" ? "Code"
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
                    <SelectTrigger className="w-45">
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

                <div className="grid grid-cols-4 gap-4 min-h-150">
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
                                      setTaskToDelete(task);
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
                                    {(task.blockedByIds?.length ?? 0) > 0 && (
                                      <span className="flex items-center gap-0.5 text-xs text-red-400" title={`Blocked by ${task.blockedByIds!.length} task(s)`}>
                                        <GitMerge className="h-3 w-3" />
                                        {task.blockedByIds!.length}
                                      </span>
                                    )}
                                    {(task.blockingIds?.length ?? 0) > 0 && (
                                      <span className="flex items-center gap-0.5 text-xs text-yellow-400" title={`Blocking ${task.blockingIds!.length} task(s)`}>
                                        <GitMerge className="h-3 w-3 rotate-180" />
                                        {task.blockingIds!.length}
                                      </span>
                                    )}
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
                  <Button className="gap-2" onClick={() => setIsAddFileOpen(true)}>
                    <Upload className="h-4 w-4" />
                    Add File
                  </Button>
                </div>
                {files.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <File className="h-12 w-12 mb-4 opacity-30" />
                    <p className="text-sm">No files yet. Add your first deliverable.</p>
                  </div>
                ) : (
                  ["product-modeling", "development", "marketing"].map((phase) => {
                    const phaseFiles = files.filter((f) => f.phase === phase);
                    if (phaseFiles.length === 0) return null;
                    return (
                      <div key={phase} className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                          <Badge variant="outline" className={phaseColors[phase]}>{phaseLabels[phase]}</Badge>
                          <span className="text-sm text-muted-foreground">Phase Deliverables</span>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                          {phaseFiles.map((file) => {
                            const Icon = file.type === "image" ? Image
                              : file.type === "code" ? FileText
                              : File;
                            return (
                              <Card key={file.id} className="group hover:border-primary/50 transition-all relative">
                                <CardContent className="p-4">
                                  <button
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                    onClick={() => setFileToDelete(file)}
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-3">
                                    {file.url ? (
                                      <a href={file.url} target="_blank" rel="noreferrer" className="flex items-center justify-center w-full h-full">
                                        <Icon className="h-8 w-8 text-muted-foreground" />
                                      </a>
                                    ) : (
                                      <Icon className="h-8 w-8 text-muted-foreground" />
                                    )}
                                  </div>
                                  <p className="font-medium text-sm truncate">{file.name}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {new Date(file.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                    {file.size && ` · ${file.size}`}
                                  </p>
                                </CardContent>
                              </Card>
                            );
                          })}
                          <Card
                            className="border-dashed hover:border-primary/50 transition-all cursor-pointer"
                            onClick={() => { setNewFile((f) => ({ ...f, phase })); setIsAddFileOpen(true); }}
                          >
                            <CardContent className="p-4 h-full flex flex-col items-center justify-center text-muted-foreground">
                              <Plus className="h-8 w-8 mb-2" />
                              <span className="text-sm">Add File</span>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </TabsContent>

            {/* ── Chat ── */}
            <TabsContent value="chat" className="mt-0 h-[calc(100vh-280px)]">
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {chatMessages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    chatMessages.map((msg) => {
                      const currentUser = typeof window !== "undefined"
                        ? (() => { try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; } })()
                        : {};
                      const isMe = msg.userId === currentUser?.id;
                      return (
                        <div key={msg.id} className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback className="text-xs">{msg.userName.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className={`max-w-[70%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                            {!isMe && <p className="text-xs text-muted-foreground mb-1">{msg.userName}</p>}
                            <div className={`px-3 py-2 rounded-2xl text-sm ${isMe ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted rounded-tl-sm"}`}>
                              {msg.content}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(msg.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>
                <div className="p-4 border-t">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Type a message..."
                      className="flex-1"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }}
                    />
                    <Button size="icon" className="h-9 w-9" onClick={handleSendChat} disabled={chatSending || !chatInput.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ── Activity ── */}
            <TabsContent value="activity" className="mt-0">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
                {activities.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No activity yet. Create or move a task to get started.</p>
                ) : (
                  <div className="space-y-1">
                    {activities.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">{activity.userName.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="font-medium">{activity.userName}</span>
                            <span className="text-muted-foreground"> {activity.action.replace(/_/g, " ")} </span>
                            {activity.entityName && <span className="font-medium">{activity.entityName}</span>}
                            {activity.meta?.to && (
                              <span className="text-muted-foreground"> → {String(activity.meta.to).replace(/_/g, " ")}</span>
                            )}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {new Date(activity.createdAt).toLocaleString("en-US", {
                              month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ── Code (IDE) ── forceMount keeps terminal alive across tab switches */}
            <TabsContent
              value="code"
              className="mt-0 p-4"
              forceMount
              style={activeTab !== "code" ? { display: "none" } : undefined}
            >
              <ProjectIDE
                project={project}
                pendingChanges={pendingAgentChanges}
                onChangesApplied={() => setPendingAgentChanges(null)}
              />
            </TabsContent>

            {/* ── AI Assistant ── */}
            <TabsContent value="ai-assistant" className="mt-0 flex-1">
              <ProjectAIAssistant project={project} onAgentChanges={handleAgentChanges} />
            </TabsContent>
          </Tabs>
        </div>

        {/* ── Edit Project Dialog ── */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-125">
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
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Local Project Path</label>
                <Input
                  placeholder="/Users/you/projects/my-app"
                  value={editForm.localPath}
                  onChange={(e) => setEditForm((f) => ({ ...f, localPath: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">Where this repo is cloned on your machine. The terminal will start here and the AI agent will write changes directly to these files.</p>
              </div>

              {/* ── Team Members ── */}
              <div className="flex flex-col gap-2 pt-2 border-t">
                <label className="text-sm font-medium">Team Members</label>

                {/* Current members */}
                <div className="space-y-1.5">
                  {members.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No members yet.</p>
                  ) : (
                    members.map((m) => (
                      <div key={m.id} className="flex items-center justify-between gap-2 p-1.5 rounded-md hover:bg-muted/50">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">{(m.name || m.email).slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-xs font-medium">{m.name || m.email}</p>
                            <p className="text-xs text-muted-foreground capitalize">{m.role}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveMember(m.id)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>

                {/* Add member */}
                <div className="flex gap-2">
                  <Select
                    onValueChange={(userId) => handleAddMember(userId)}
                    disabled={memberLoading}
                  >
                    <SelectTrigger className="flex-1 h-8 text-xs">
                      <SelectValue placeholder="Add a team member…" />
                    </SelectTrigger>
                    <SelectContent>
                      {allUsers
                        .filter((u) => !members.some((m) => m.id === u.id))
                        .map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            <span className="text-xs">{u.name || u.email} <span className="text-muted-foreground capitalize">· {u.role}</span></span>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Button size="icon" className="h-8 w-8 shrink-0" variant="outline" disabled>
                    <UserPlus className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {memberError && <p className="text-xs text-destructive">{memberError}</p>}
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
          <DialogContent className="sm:max-w-100">
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

        {/* ── Delete Task Confirm ── */}
        <Dialog open={!!taskToDelete} onOpenChange={(open) => { if (!open) setTaskToDelete(null); }}>
          <DialogContent className="sm:max-w-100">
            <DialogHeader>
              <DialogTitle>Delete Task</DialogTitle>
              <DialogDescription>
                Delete <strong>{taskToDelete?.title}</strong>? This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTaskToDelete(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteTask}>Delete Task</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Add File Dialog ── */}
        <Dialog open={isAddFileOpen} onOpenChange={setIsAddFileOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add File</DialogTitle>
              <DialogDescription>Add a deliverable or reference file to this project</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              {/* File upload area */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Upload File</label>
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-6 cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  {selectedFile ? (
                    <span className="text-sm font-medium text-primary">{selectedFile.name}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">Click to choose a file</span>
                  )}
                  <span className="text-xs text-muted-foreground">PDF, DOC, DOCX, images up to 20MB</span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.svg,.txt,.md,.csv"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="flex-1 h-px bg-border" />
                <span>or add by URL</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {!selectedFile && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">File Name</label>
                  <Input
                    placeholder="e.g. Design Mockups v2"
                    value={newFile.name}
                    onChange={(e) => setNewFile((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Phase</label>
                  <Select value={newFile.phase} onValueChange={(v) => setNewFile((f) => ({ ...f, phase: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="product-modeling">Product Modeling</SelectItem>
                      <SelectItem value="development">Development</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Type</label>
                  <Select value={newFile.type} onValueChange={(v) => setNewFile((f) => ({ ...f, type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="doc">Document</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="spreadsheet">Spreadsheet</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="code">Code</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {!selectedFile && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">URL</label>
                  <Input
                    type="url"
                    placeholder="https://..."
                    value={newFile.url}
                    onChange={(e) => setNewFile((f) => ({ ...f, url: e.target.value }))}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsAddFileOpen(false); setSelectedFile(null); }}>Cancel</Button>
              <Button
                onClick={handleAddFile}
                disabled={fileUploading || (!selectedFile && !newFile.name.trim())}
              >
                {fileUploading ? "Uploading…" : "Add File"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Delete File Confirm ── */}
        <Dialog open={!!fileToDelete} onOpenChange={(open) => { if (!open) setFileToDelete(null); }}>
          <DialogContent className="sm:max-w-100">
            <DialogHeader>
              <DialogTitle>Delete File</DialogTitle>
              <DialogDescription>
                Delete <strong>{fileToDelete?.name}</strong>? This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setFileToDelete(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteFile}>Delete File</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Task Detail Sidebar ── */}
        {selectedTask && (
          <div className="fixed inset-y-0 right-0 w-100 bg-card border-l shadow-xl z-50">
            <div className="flex flex-col h-full">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-semibold">Task Details</h3>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setTaskToDelete(selectedTask)}
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
                {/* Dependencies */}
                <div className="pt-4 border-t">
                  <h5 className="font-medium mb-3 flex items-center gap-2">
                    <GitMerge className="h-4 w-4" />Dependencies
                  </h5>
                  <div className="space-y-2 mb-3">
                    {(selectedTask.blockedByIds ?? []).length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Blocked by</p>
                        {selectedTask.blockedByIds!.map((blockingId) => {
                          const blocker = tasks.find((t) => t.id === blockingId);
                          return (
                            <div key={blockingId} className="flex items-center justify-between text-xs bg-red-500/10 border border-red-500/20 rounded px-2 py-1.5 mb-1">
                              <span className="text-red-400 truncate">{blocker?.title || blockingId}</span>
                              <button
                                onClick={async () => {
                                  await projectApi.removeDependency(project.id, selectedTask.id, blockingId);
                                  setTasks((prev) => prev.map((t) => t.id === selectedTask.id ? { ...t, blockedByIds: t.blockedByIds?.filter((id) => id !== blockingId) } : t));
                                }}
                                className="ml-2 text-muted-foreground hover:text-destructive shrink-0"
                              >
                                <Unlink className="h-3 w-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {(selectedTask.blockingIds ?? []).length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Blocking</p>
                        {selectedTask.blockingIds!.map((blockedId) => {
                          const blocked = tasks.find((t) => t.id === blockedId);
                          return (
                            <div key={blockedId} className="flex items-center justify-between text-xs bg-yellow-500/10 border border-yellow-500/20 rounded px-2 py-1.5 mb-1">
                              <span className="text-yellow-400 truncate">{blocked?.title || blockedId}</span>
                              <button
                                onClick={async () => {
                                  await projectApi.removeDependency(project.id, blockedId, selectedTask.id);
                                  setTasks((prev) => prev.map((t) => t.id === selectedTask.id ? { ...t, blockingIds: t.blockingIds?.filter((id) => id !== blockedId) } : t));
                                }}
                                className="ml-2 text-muted-foreground hover:text-destructive shrink-0"
                              >
                                <Unlink className="h-3 w-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <Select
                      onValueChange={async (blockingTaskId) => {
                        await projectApi.addDependency(project.id, selectedTask.id, blockingTaskId);
                        setTasks((prev) => prev.map((t) => t.id === selectedTask.id
                          ? { ...t, blockedByIds: [...(t.blockedByIds ?? []), blockingTaskId] }
                          : t.id === blockingTaskId
                          ? { ...t, blockingIds: [...(t.blockingIds ?? []), selectedTask.id] }
                          : t
                        ));
                      }}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder="+ Add blocker..." />
                      </SelectTrigger>
                      <SelectContent>
                        {tasks
                          .filter((t) => t.id !== selectedTask.id && !(selectedTask.blockedByIds ?? []).includes(t.id))
                          .map((t) => (
                            <SelectItem key={t.id} value={t.id} className="text-xs">
                              {t.title}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h5 className="font-medium mb-3">Comments</h5>
                  <div className="space-y-3 mb-3">
                    {comments.map((c) => (
                      <div key={c.id} className="flex gap-2">
                        <Avatar className="h-6 w-6 shrink-0">
                          <AvatarFallback className="text-xs">{c.userName.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 bg-muted/50 rounded-lg p-2">
                          <p className="text-xs font-medium">{c.userName}</p>
                          <p className="text-sm mt-0.5">{c.content}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(c.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a comment..."
                      className="flex-1"
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
                    />
                    <Button size="icon" className="h-9 w-9" onClick={handleAddComment} disabled={commentSubmitting || !commentInput.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
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
