"use client";

import { useState, use } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
  DialogTrigger,
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
import { projects, users } from "@/lib/mock-data";
import type { Task } from "@/lib/types";
import {
  ArrowLeft,
  Plus,
  MoreVertical,
  Calendar,
  Users,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  GripVertical,
  MessageSquare,
  Paperclip,
  Flag,
  User,
  Tag,
  Upload,
  FileText,
  Image,
  File,
  ChevronRight,
  Settings,
  Trash2,
  Edit3,
  Link2,
  Send,
} from "lucide-react";
import Link from "next/link";

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
  {
    id: "in-progress",
    label: "In Progress",
    icon: Clock,
    color: "text-primary",
  },
  { id: "review", label: "Review", icon: AlertCircle, color: "text-warning" },
  { id: "done", label: "Done", icon: CheckCircle2, color: "text-success" },
];

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const project = projects.find((p) => p.id === id) || projects[0];
  const teamMembers = project.team;

  const [tasks, setTasks] = useState<Task[]>(project.tasks);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [phaseFilter, setPhaseFilter] = useState<string>("all");
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  const filteredTasks = tasks.filter(
    (task) => phaseFilter === "all" || task.phase === phaseFilter,
  );

  const getTasksByStatus = (status: string) =>
    filteredTasks.filter((task) => task.status === status);

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (status: string) => {
    if (draggedTask) {
      setTasks(
        tasks.map((t) =>
          t.id === draggedTask.id
            ? { ...t, status: status as Task["status"] }
            : t,
        ),
      );
      setDraggedTask(null);
    }
  };

  const progress = Math.round(
    (tasks.filter((t) => t.status === "done").length / tasks.length) * 100,
  );

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
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
                  <Badge
                    variant="outline"
                    className={phaseColors[project.phase]}
                  >
                    {phaseLabels[project.phase]}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {project.description}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2">
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
                    <DropdownMenuItem>
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit Project
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link2 className="h-4 w-4 mr-2" />
                      Copy Link
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Project
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Project Stats Bar */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="flex items-center -space-x-2">
                  {teamMembers.slice(0, 4).map((member) => (
                    <Avatar
                      key={member.id}
                      className="h-7 w-7 border-2 border-background"
                    >
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback className="text-xs">
                        {member.name.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {teamMembers.length} members
                </span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Due:</span>
                <span>{new Date(project.dueDate).toLocaleDateString()}</span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2 flex-1 max-w-xs">
                <span className="text-sm text-muted-foreground">Progress:</span>
                <Progress value={progress} className="h-2 flex-1" />
                <span className="text-sm font-medium">{progress}%</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="kanban" className="w-full">
            <div className="px-4 border-t">
              <TabsList className="h-12 bg-transparent gap-4 -mb-px">
                <TabsTrigger
                  value="kanban"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent"
                >
                  Kanban Board
                </TabsTrigger>
                <TabsTrigger
                  value="files"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent"
                >
                  Files & Deliverables
                </TabsTrigger>
                <TabsTrigger
                  value="chat"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent"
                >
                  Project Chat
                </TabsTrigger>
                <TabsTrigger
                  value="activity"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent"
                >
                  Activity
                </TabsTrigger>
                <TabsTrigger
                  value="ai-assistant"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent"
                >
                  AI Assistant
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Kanban Tab */}
            <TabsContent value="kanban" className="mt-0 flex-1">
              <div className="p-4 flex flex-col gap-4">
                {/* Kanban Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Select value={phaseFilter} onValueChange={setPhaseFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by phase" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Phases</SelectItem>
                        <SelectItem value="product-modeling">
                          Product Modeling
                        </SelectItem>
                        <SelectItem value="development">Development</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Task
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Task</DialogTitle>
                        <DialogDescription>
                          Add a new task to the project
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex flex-col gap-4 py-4">
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-medium">
                            Task Title
                          </label>
                          <Input placeholder="Enter task title" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-medium">
                            Description
                          </label>
                          <Textarea placeholder="Describe the task" rows={3} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">Phase</label>
                            <Select defaultValue="development">
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="product-modeling">
                                  Product Modeling
                                </SelectItem>
                                <SelectItem value="development">
                                  Development
                                </SelectItem>
                                <SelectItem value="marketing">
                                  Marketing
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">
                              Priority
                            </label>
                            <Select defaultValue="medium">
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="critical">
                                  Critical
                                </SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">
                              Assignee
                            </label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select assignee" />
                              </SelectTrigger>
                              <SelectContent>
                                {teamMembers.map((member) => (
                                  <SelectItem key={member.id} value={member.id}>
                                    {member.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">
                              Due Date
                            </label>
                            <Input type="date" />
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsNewTaskOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={() => setIsNewTaskOpen(false)}>
                          Create Task
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Kanban Board */}
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
                            <span className="font-medium text-sm">
                              {column.label}
                            </span>
                            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              {columnTasks.length}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                          {columnTasks.map((task) => {
                            const assignee = task.assignee;

                            return (
                              <Card
                                key={task.id}
                                className="cursor-pointer hover:border-primary/50 transition-all group"
                                draggable
                                onDragStart={() => handleDragStart(task)}
                                onClick={() => setSelectedTask(task)}
                              >
                                <CardContent className="p-3 space-y-3">
                                  <div className="flex items-start gap-2">
                                    <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 cursor-grab" />
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm leading-tight">
                                        {task.title}
                                      </p>
                                      {task.description && (
                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                          {task.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Badge
                                      variant="outline"
                                      className={`${phaseColors[task.phase]} text-xs px-1.5 py-0`}
                                    >
                                      {phaseLabels[task.phase]}
                                    </Badge>
                                    {task.tags?.map((tag) => (
                                      <Badge
                                        key={tag}
                                        variant="secondary"
                                        className="text-xs px-1.5 py-0"
                                      >
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>

                                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                                    <div className="flex items-center gap-2">
                                      {assignee && (
                                        <Avatar className="h-5 w-5">
                                          <AvatarImage src={assignee.avatar} />
                                          <AvatarFallback className="text-xs">
                                            {assignee.name.slice(0, 2)}
                                          </AvatarFallback>
                                        </Avatar>
                                      )}
                                      <div
                                        className={`h-2 w-2 rounded-full ${priorityColors[task.priority]}`}
                                      />
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      {task.dueDate && (
                                        <span className="flex items-center gap-1">
                                          <Calendar className="h-3 w-3" />
                                          {new Date(
                                            task.dueDate,
                                          ).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                          })}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            {/* Files Tab */}
            <TabsContent value="files" className="mt-0">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold">
                    Files & Deliverables
                  </h2>
                  <Button className="gap-2">
                    <Upload className="h-4 w-4" />
                    Upload File
                  </Button>
                </div>

                {/* Files by Phase */}
                {["product-modeling", "development", "marketing"].map(
                  (phase) => (
                    <div key={phase} className="mb-8">
                      <div className="flex items-center gap-2 mb-4">
                        <Badge variant="outline" className={phaseColors[phase]}>
                          {phaseLabels[phase]}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Phase Deliverables
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-4">
                        {[1, 2, 3].map((i) => (
                          <Card
                            key={i}
                            className="group hover:border-primary/50 transition-all cursor-pointer"
                          >
                            <CardContent className="p-4">
                              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-3">
                                {i === 1 && (
                                  <FileText className="h-8 w-8 text-muted-foreground" />
                                )}
                                {i === 2 && (
                                  <Image className="h-8 w-8 text-muted-foreground" />
                                )}
                                {i === 3 && (
                                  <File className="h-8 w-8 text-muted-foreground" />
                                )}
                              </div>
                              <p className="font-medium text-sm truncate">
                                {phase === "product-modeling" &&
                                  i === 1 &&
                                  "Requirements.pdf"}
                                {phase === "product-modeling" &&
                                  i === 2 &&
                                  "Wireframes.fig"}
                                {phase === "product-modeling" &&
                                  i === 3 &&
                                  "User-Stories.xlsx"}
                                {phase === "development" &&
                                  i === 1 &&
                                  "API-Docs.md"}
                                {phase === "development" &&
                                  i === 2 &&
                                  "Architecture.png"}
                                {phase === "development" &&
                                  i === 3 &&
                                  "Database-Schema.sql"}
                                {phase === "marketing" &&
                                  i === 1 &&
                                  "Marketing-Plan.pdf"}
                                {phase === "marketing" &&
                                  i === 2 &&
                                  "Social-Assets.zip"}
                                {phase === "marketing" &&
                                  i === 3 &&
                                  "Analytics-Report.xlsx"}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Updated 2 days ago
                              </p>
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
                  ),
                )}
              </div>
            </TabsContent>

            {/* Chat Tab */}
            <TabsContent value="chat" className="mt-0 h-[calc(100vh-280px)]">
              <div className="flex flex-col h-full">
                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                  {/* Sample chat messages */}
                  {[
                    {
                      user: users[0],
                      message:
                        "Hey team, I have pushed the latest updates to the repository. Please review when you get a chance.",
                      time: "10:30 AM",
                    },
                    {
                      user: users[1],
                      message:
                        "Great work! I will take a look at it this afternoon.",
                      time: "10:45 AM",
                    },
                    {
                      user: users[2],
                      message:
                        "The new features are looking solid. I have a few suggestions for the UI that I will add as comments.",
                      time: "11:15 AM",
                    },
                    {
                      user: users[0],
                      message:
                        "Perfect, thanks everyone. Let us sync up tomorrow to discuss the feedback.",
                      time: "11:30 AM",
                    },
                  ].map((chat, i) => (
                    <div key={i} className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={chat.user.avatar} />
                        <AvatarFallback>
                          {chat.user.name.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {chat.user.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {chat.time}
                          </span>
                        </div>
                        <p className="text-sm mt-1 text-foreground/90">
                          {chat.message}
                        </p>
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
                    <Button size="icon" className="h-8 w-8">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="mt-0">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
                <div className="space-y-4">
                  {[
                    {
                      user: users[0],
                      action: "moved task",
                      target: "Setup CI/CD Pipeline",
                      from: "In Progress",
                      to: "Review",
                      time: "2 hours ago",
                    },
                    {
                      user: users[1],
                      action: "commented on",
                      target: "API Integration",
                      time: "3 hours ago",
                    },
                    {
                      user: users[2],
                      action: "uploaded file",
                      target: "design-mockups.fig",
                      time: "5 hours ago",
                    },
                    {
                      user: users[0],
                      action: "created task",
                      target: "User Authentication Flow",
                      time: "Yesterday",
                    },
                    {
                      user: users[1],
                      action: "completed task",
                      target: "Database Schema Design",
                      time: "Yesterday",
                    },
                  ].map((activity, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={activity.user.avatar} />
                        <AvatarFallback>
                          {activity.user.name.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">
                            {activity.user.name}
                          </span>
                          <span className="text-muted-foreground">
                            {" "}
                            {activity.action}{" "}
                          </span>
                          <span className="font-medium">{activity.target}</span>
                          {activity.from && (
                            <span className="text-muted-foreground">
                              {" "}
                              from {activity.from} to {activity.to}
                            </span>
                          )}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {activity.time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* AI Assistant Tab */}
            <TabsContent value="ai-assistant" className="mt-0 flex-1">
              <ProjectAIAssistant project={project} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Task Detail Sidebar */}
        {selectedTask && (
          <div className="fixed inset-y-0 right-0 w-[400px] bg-card border-l shadow-xl z-50">
            <div className="flex flex-col h-full">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-semibold">Task Details</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setSelectedTask(null)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <div>
                  <h4 className="text-lg font-semibold">
                    {selectedTask.title}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-2">
                    {selectedTask.description}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <User className="h-4 w-4" /> Assignee
                    </span>
                    <div className="flex items-center gap-2">
                      {selectedTask.assignee && (
                        <>
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={selectedTask.assignee.avatar} />
                            <AvatarFallback>
                              {selectedTask.assignee.name.slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">
                            {selectedTask.assignee.name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Flag className="h-4 w-4" /> Priority
                    </span>
                    <Badge className={priorityColors[selectedTask.priority]}>
                      {selectedTask.priority}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" /> Due Date
                    </span>
                    <span className="text-sm">
                      {selectedTask.dueDate
                        ? new Date(selectedTask.dueDate).toLocaleDateString()
                        : "Not set"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Tag className="h-4 w-4" /> Phase
                    </span>
                    <Badge
                      variant="outline"
                      className={phaseColors[selectedTask.phase]}
                    >
                      {phaseLabels[selectedTask.phase]}
                    </Badge>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h5 className="font-medium mb-3">Comments</h5>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={users[0].avatar} />
                        <AvatarFallback>JD</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 bg-muted rounded-lg p-2">
                        <p className="text-xs font-medium">{users[0].name}</p>
                        <p className="text-sm mt-1">
                          This looks good! Ready for review.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Input placeholder="Add a comment..." className="flex-1" />
                    <Button size="icon" className="h-9 w-9">
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
