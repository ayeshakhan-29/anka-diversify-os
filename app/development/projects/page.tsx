"use client";

import { useState } from "react";
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
import {
  Search,
  Plus,
  Filter,
  MoreVertical,
  FolderKanban,
  Calendar,
  Users,
  ArrowRight,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  Layers,
  FileText,
  Upload,
  ExternalLink,
  Grid3X3,
  List,
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
  critical: "bg-destructive/20 text-destructive",
  high: "bg-warning/20 text-warning",
  medium: "bg-primary/20 text-primary",
  low: "bg-muted text-muted-foreground",
};

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [phaseFilter, setPhaseFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPhase = phaseFilter === "all" || project.phase === phaseFilter;
    return matchesSearch && matchesPhase;
  });

  const getProjectProgress = (project: (typeof projects)[0]) => {
    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter(
      (t) => t.status === "done",
    ).length;
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  };

  const getTaskStats = (project: (typeof projects)[0]) => {
    return {
      todo: project.tasks.filter((t) => t.status === "todo").length,
      inProgress: project.tasks.filter((t) => t.status === "in-progress")
        .length,
      review: project.tasks.filter((t) => t.status === "review").length,
      done: project.tasks.filter((t) => t.status === "done").length,
    };
  };

  return (
    <MainLayout>
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Projects</h1>
            <p className="text-muted-foreground">
              Manage and track all your projects through their lifecycle
            </p>
          </div>
          <Dialog open={isNewProjectOpen} onOpenChange={setIsNewProjectOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Add a new project to your workspace
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Project Name</label>
                  <Input placeholder="Enter project name" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea placeholder="Describe your project" rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">
                      Starting Phase
                    </label>
                    <Select defaultValue="product-modeling">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="product-modeling">
                          Product Modeling
                        </SelectItem>
                        <SelectItem value="development">Development</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Priority</label>
                    <Select defaultValue="medium">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Team Lead</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team lead" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsNewProjectOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={() => setIsNewProjectOpen(false)}>
                  Create Project
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Phase Pipeline Overview */}
        <div className="grid grid-cols-4 gap-4">
          {["product-modeling", "development", "marketing", "completed"].map(
            (phase) => {
              const count = projects.filter((p) => p.phase === phase).length;
              return (
                <Card
                  key={phase}
                  className={`cursor-pointer transition-all hover:border-primary/50 ${phaseFilter === phase ? "border-primary ring-1 ring-primary/20" : ""}`}
                  onClick={() =>
                    setPhaseFilter(phaseFilter === phase ? "all" : phase)
                  }
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">
                          {phaseLabels[phase]}
                        </p>
                        <p className="text-2xl font-bold mt-1">{count}</p>
                      </div>
                      <div
                        className={`h-10 w-10 rounded-lg flex items-center justify-center ${phaseColors[phase]}`}
                      >
                        {phase === "product-modeling" && (
                          <Layers className="h-5 w-5" />
                        )}
                        {phase === "development" && (
                          <FolderKanban className="h-5 w-5" />
                        )}
                        {phase === "marketing" && (
                          <FileText className="h-5 w-5" />
                        )}
                        {phase === "completed" && (
                          <CheckCircle2 className="h-5 w-5" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            },
          )}
        </div>

        {/* Filters & Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={phaseFilter} onValueChange={setPhaseFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by phase" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Phases</SelectItem>
              <SelectItem value="product-modeling">Product Modeling</SelectItem>
              <SelectItem value="development">Development</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 border rounded-lg p-1">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Projects Grid/List */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => {
              const progress = getProjectProgress(project);
              const stats = getTaskStats(project);
              const teamMembers = project.team;

              return (
                <Card
                  key={project.id}
                  className="group hover:border-primary/50 transition-all"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant="outline"
                            className={phaseColors[project.phase]}
                          >
                            {phaseLabels[project.phase]}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={priorityColors[project.priority]}
                          >
                            {project.priority}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg">
                          {project.name}
                        </CardTitle>
                        <CardDescription className="line-clamp-2 mt-1">
                          {project.description}
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open Project
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FolderKanban className="h-4 w-4 mr-2" />
                            View Kanban
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Files
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    {/* Task Stats */}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Circle className="h-3 w-3" />
                        <span>{stats.todo}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-primary">
                        <Clock className="h-3 w-3" />
                        <span>{stats.inProgress}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-warning">
                        <AlertCircle className="h-3 w-3" />
                        <span>{stats.review}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-success">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>{stats.done}</span>
                      </div>
                    </div>

                    {/* Team & Due Date */}
                    <div className="flex items-center justify-between pt-2 border-t">
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
                        {teamMembers.length > 4 && (
                          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                            +{teamMembers.length - 4}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          {new Date(project.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Action */}
                    <Link href={`/development/projects/${project.id}`}>
                      <Button variant="outline" className="w-full gap-2 mt-2">
                        Open Project
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredProjects.map((project) => {
              const progress = getProjectProgress(project);
              const teamMembers = project.team;

              return (
                <Card
                  key={project.id}
                  className="group hover:border-primary/50 transition-all"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium truncate">
                            {project.name}
                          </h3>
                          <Badge
                            variant="outline"
                            className={`${phaseColors[project.phase]} text-xs`}
                          >
                            {phaseLabels[project.phase]}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`${priorityColors[project.priority]} text-xs`}
                          >
                            {project.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {project.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="w-32">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">
                              Progress
                            </span>
                            <span>{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-1.5" />
                        </div>
                        <div className="flex items-center -space-x-2">
                          {teamMembers.slice(0, 3).map((member) => (
                            <Avatar
                              key={member.id}
                              className="h-6 w-6 border-2 border-background"
                            >
                              <AvatarImage src={member.avatar} />
                              <AvatarFallback className="text-xs">
                                {member.name.slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>
                            {new Date(project.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                        <Link href={`/development/projects/${project.id}`}>
                          <Button variant="ghost" size="sm" className="gap-1">
                            Open
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
