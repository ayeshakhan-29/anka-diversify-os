"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  MoreVertical,
  ExternalLink,
  FolderKanban,
  Upload,
  Github,
  ArrowRight,
  Circle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Project, TeamMember } from "@/lib/types";

interface ProjectsListProps {
  filteredProjects: Project[];
  phaseColors: Record<string, string>;
  phaseLabels: Record<string, string>;
  priorityColors: Record<string, string>;
  getProjectProgress: (project: Project) => number;
  getTaskStats: (project: Project) => {
    todo: number;
    inProgress: number;
    done: number;
  };
}

export function ProjectsList({
  filteredProjects,
  phaseColors,
  phaseLabels,
  priorityColors,
  getProjectProgress,
  getTaskStats,
}: ProjectsListProps) {
  return (
    <div className="space-y-4">
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
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {project.description}
                  </p>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                {/* Task Stats */}
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Tasks</div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Circle className="h-3 w-3" />
                      <span>{stats.todo}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-primary">
                      <Clock className="h-3 w-3" />
                      <span>{stats.inProgress}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-success">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>{stats.done}</span>
                    </div>
                  </div>
                </div>

                {/* Team Members */}
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Team</div>
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {teamMembers.slice(0, 3).map((member) => (
                        <Avatar
                          key={member.id}
                          className="h-6 w-6 border-2 border-card"
                        >
                          {member.avatar ? (
                            <AvatarImage
                              src={member.avatar}
                              alt={member.name}
                            />
                          ) : (
                            <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">
                              {member.name
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")}
                            </AvatarFallback>
                          )}
                        </Avatar>
                      ))}
                      {teamMembers.length > 3 && (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-secondary text-[10px] font-medium text-muted-foreground">
                          +{teamMembers.length - 3}
                        </div>
                      )}
                    </div>
                    <Link href={`/development/projects/${project.id}`}>
                      <Button variant="ghost" size="sm" className="gap-1">
                        Open
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* GitHub Integration */}
              {project.githubUrl && (
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Github className="h-3 w-3" />
                    <span>View Repository</span>
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                  {project.lastCommit && (
                    <div className="flex-1 text-right">
                      <div className="text-xs text-muted-foreground mb-1">
                        Last Commit
                      </div>
                      <div
                        className="text-xs font-medium text-foreground truncate"
                        title={project.lastCommit.message}
                      >
                        {project.lastCommit.message}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        by {project.lastCommit.author} •{" "}
                        {new Date(
                          project.lastCommit.timestamp,
                        ).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
