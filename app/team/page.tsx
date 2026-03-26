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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  projects as mockProjects,
  teamMembers as mockUsers,
} from "@/lib/mock-data";
import type { Task } from "@/lib/types";
import {
  Search,
  Filter,
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  GripVertical,
  LayoutGrid,
  List,
  ChevronRight,
  BarChart3,
  TrendingUp,
  Target,
  Briefcase,
} from "lucide-react";

const phaseColors: Record<string, string> = {
  "product-modeling": "bg-chart-4/20 text-chart-4",
  development: "bg-primary/20 text-primary",
  marketing: "bg-warning/20 text-warning",
  completed: "bg-success/20 text-success",
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

// Gather all tasks from all projects with project info
const allTasks = mockProjects.flatMap((project) =>
  project.tasks.map((task) => ({
    ...task,
    projectName: project.name,
    projectPhase: project.phase,
  })),
);

export default function TeamBoardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [memberFilter, setMemberFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [phaseFilter, setPhaseFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"board" | "list">("board");

  const filteredTasks = allTasks.filter((task) => {
    const matchesSearch = task.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesMember =
      memberFilter === "all" || task.assignee?.id === memberFilter;
    const matchesProject =
      projectFilter === "all" || task.projectId === projectFilter;
    const matchesPhase = phaseFilter === "all" || task.phase === phaseFilter;
    return matchesSearch && matchesMember && matchesProject && matchesPhase;
  });

  const getTasksByStatus = (status: string) =>
    filteredTasks.filter((task) => task.status === status);

  // Calculate team stats
  const teamStats = mockUsers.map((user) => {
    const userTasks = allTasks.filter((t) => t.assignee?.id === user.id);
    return {
      ...user,
      totalTasks: userTasks.length,
      completedTasks: userTasks.filter((t) => t.status === "done").length,
      inProgressTasks: userTasks.filter((t) => t.status === "in-progress")
        .length,
      reviewTasks: userTasks.filter((t) => t.status === "review").length,
    };
  });

  return (
    <MainLayout>
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Team Board</h1>
            <p className="text-muted-foreground">
              Cross-project task management and team workload overview
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "board" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("board")}
              className="gap-2"
            >
              <LayoutGrid className="h-4 w-4" />
              Board
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="gap-2"
            >
              <List className="h-4 w-4" />
              List
            </Button>
          </div>
        </div>

        {/* Team Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Tasks</p>
                  <p className="text-2xl font-bold">{allTasks.length}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Target className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold">
                    {allTasks.filter((t) => t.status === "in-progress").length}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-warning/20 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">
                    {allTasks.filter((t) => t.status === "done").length}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-success/20 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Team Members</p>
                  <p className="text-2xl font-bold">{mockUsers.length}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-chart-4/20 flex items-center justify-center">
                  <Users className="h-5 w-5 text-chart-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="board" className="w-full">
          <TabsList>
            <TabsTrigger value="board">Task Board</TabsTrigger>
            <TabsTrigger value="members">Team Members</TabsTrigger>
            <TabsTrigger value="workload">Workload</TabsTrigger>
          </TabsList>

          <TabsContent value="board" className="mt-4">
            {/* Filters */}
            <div className="flex items-center gap-4 mb-4 flex-wrap">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={memberFilter} onValueChange={setMemberFilter}>
                <SelectTrigger className="w-[180px]">
                  <Users className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Members</SelectItem>
                  {mockUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-[180px]">
                  <Briefcase className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {mockProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={phaseFilter} onValueChange={setPhaseFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
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

            {/* Kanban Board */}
            {viewMode === "board" ? (
              <div className="grid grid-cols-4 gap-4 min-h-[600px]">
                {statusColumns.map((column) => {
                  const columnTasks = getTasksByStatus(column.id);
                  const Icon = column.icon;

                  return (
                    <div
                      key={column.id}
                      className="flex flex-col bg-secondary/30 rounded-lg"
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
                      </div>

                      <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                        {columnTasks.map((task) => {
                          const assignee = mockUsers.find(
                            (u) => u.id === task.assigneeId,
                          );

                          return (
                            <Card
                              key={task.id}
                              className="cursor-pointer hover:border-primary/50 transition-all group"
                            >
                              <CardContent className="p-3 space-y-3">
                                <div className="flex items-start gap-2">
                                  <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm leading-tight">
                                      {task.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1 truncate">
                                      {task.projectName}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge
                                    variant="outline"
                                    className={`${phaseColors[task.phase]} text-xs px-1.5 py-0`}
                                  >
                                    {phaseLabels[task.phase]}
                                  </Badge>
                                  <div
                                    className={`h-2 w-2 rounded-full ${priorityColors[task.priority]}`}
                                  />
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                                  {assignee && (
                                    <div className="flex items-center gap-2">
                                      <Avatar className="h-5 w-5">
                                        <AvatarImage src={assignee.avatar} />
                                        <AvatarFallback className="text-xs">
                                          {assignee.name.slice(0, 2)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-xs text-muted-foreground">
                                        {assignee.name.split(" ")[0]}
                                      </span>
                                    </div>
                                  )}
                                  {task.dueDate && (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
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
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTasks.map((task) => {
                  const assignee = mockUsers.find(
                    (u) => u.id === task.assigneeId,
                  );
                  const statusInfo = statusColumns.find(
                    (s) => s.id === task.status,
                  );
                  const StatusIcon = statusInfo?.icon || Circle;

                  return (
                    <Card
                      key={task.id}
                      className="hover:border-primary/50 transition-all"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <StatusIcon
                            className={`h-4 w-4 ${statusInfo?.color}`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm truncate">
                                {task.title}
                              </p>
                              <Badge
                                variant="outline"
                                className={`${phaseColors[task.phase]} text-xs`}
                              >
                                {phaseLabels[task.phase]}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {task.projectName}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div
                              className={`h-2 w-2 rounded-full ${priorityColors[task.priority]}`}
                            />
                            {assignee && (
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={assignee.avatar} />
                                <AvatarFallback className="text-xs">
                                  {assignee.name.slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            {task.dueDate && (
                              <span className="text-xs text-muted-foreground">
                                {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            )}
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="members" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamStats.map((member) => (
                <Card
                  key={member.id}
                  className="hover:border-primary/50 transition-all"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>
                          {member.name.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold">{member.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {member.role}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {member.department}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t">
                      <div className="text-center">
                        <p className="text-lg font-semibold">
                          {member.totalTasks}
                        </p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-primary">
                          {member.inProgressTasks}
                        </p>
                        <p className="text-xs text-muted-foreground">Active</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-success">
                          {member.completedTasks}
                        </p>
                        <p className="text-xs text-muted-foreground">Done</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="workload" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Team Workload Distribution
                </CardTitle>
                <CardDescription>
                  Current task assignments across team members
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamStats.map((member) => {
                    const totalCapacity = 10;
                    const workload = Math.min(
                      (member.totalTasks / totalCapacity) * 100,
                      100,
                    );

                    return (
                      <div key={member.id} className="flex items-center gap-4">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback>
                            {member.name.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">
                              {member.name}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {member.totalTasks} tasks
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                workload > 80
                                  ? "bg-destructive"
                                  : workload > 60
                                    ? "bg-warning"
                                    : "bg-primary"
                              }`}
                              style={{ width: `${workload}%` }}
                            />
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            workload > 80
                              ? "text-destructive border-destructive"
                              : workload > 60
                                ? "text-warning border-warning"
                                : "text-success border-success"
                          }
                        >
                          {workload > 80
                            ? "Overloaded"
                            : workload > 60
                              ? "Busy"
                              : "Available"}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Project Distribution */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base">Tasks by Project</CardTitle>
                <CardDescription>
                  Distribution of tasks across active projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockProjects.map((project) => {
                    const projectTasks = allTasks.filter(
                      (t) => t.projectId === project.id,
                    );
                    const completedTasks = projectTasks.filter(
                      (t) => t.status === "done",
                    ).length;
                    const progress =
                      projectTasks.length > 0
                        ? (completedTasks / projectTasks.length) * 100
                        : 0;

                    return (
                      <div key={project.id} className="p-3 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {project.name}
                            </span>
                            <Badge
                              variant="outline"
                              className={`${phaseColors[project.phase]} text-xs`}
                            >
                              {phaseLabels[project.phase]}
                            </Badge>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {completedTasks}/{projectTasks.length} tasks
                          </span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
