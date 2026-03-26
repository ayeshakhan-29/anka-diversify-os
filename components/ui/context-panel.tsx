"use client";

import React from "react";
import { ProjectContext } from "@/lib/ai-client";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Folder,
  FileText,
  CheckCircle,
  AlertTriangle,
  Clock,
  Users,
  Target,
} from "lucide-react";

interface ContextPanelProps {
  context?: ProjectContext;
  isLoading?: boolean;
  className?: string;
}

export function ContextPanel({
  context,
  isLoading = false,
  className,
}: ContextPanelProps) {
  if (isLoading) {
    return (
      <Card className={cn("w-80", className)}>
        <CardHeader>
          <CardTitle className="text-lg">Project Context</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse"></div>
                <div className="h-3 bg-muted rounded w-3/4 animate-pulse"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!context) {
    return (
      <Card className={cn("w-80", className)}>
        <CardHeader>
          <CardTitle className="text-lg">Project Context</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No project context available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "done":
        return "default";
      case "in_progress":
        return "secondary";
      case "todo":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <Card className={cn("w-80", className)}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Folder className="h-5 w-5" />
          Project Context
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Project Info */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Target className="h-4 w-4" />
            Project Details
          </h4>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Name:</span> {context.project.name}
            </div>
            {context.project.description && (
              <div>
                <span className="font-medium">Description:</span>
                <p className="text-muted-foreground mt-1">
                  {context.project.description}
                </p>
              </div>
            )}
            {context.project.phase && (
              <div>
                <span className="font-medium">Phase:</span>
                <Badge variant="outline" className="ml-2">
                  {context.project.phase}
                </Badge>
              </div>
            )}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-medium">Progress:</span>
                <span className="text-sm">{context.project.progress}%</span>
              </div>
              <Progress value={context.project.progress} className="h-2" />
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="font-medium">Team Size:</span>
              <span>{context.project.teamSize} people</span>
            </div>
          </div>
        </div>

        {/* Project Summary */}
        {context.summary && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Summary
            </h4>
            <div className="text-sm text-muted-foreground">
              <p>{context.summary.summary}</p>
              <div className="text-xs mt-2">
                Last updated:{" "}
                {new Date(context.summary.lastUpdated).toLocaleDateString()}
              </div>
            </div>
          </div>
        )}

        {/* Active Tasks */}
        {context.activeTasks.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Active Tasks ({context.activeTasks.length})
            </h4>
            <div className="space-y-2">
              {context.activeTasks.slice(0, 5).map((task) => (
                <div key={task.id} className="text-sm space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium truncate">{task.title}</span>
                    <Badge
                      variant={getPriorityColor(task.priority)}
                      className="text-xs"
                    >
                      {task.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={getStatusColor(task.status)}
                      className="text-xs"
                    >
                      {task.status.replace("_", " ")}
                    </Badge>
                    {task.dueDate && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {context.activeTasks.length > 5 && (
                <div className="text-xs text-muted-foreground">
                  +{context.activeTasks.length - 5} more tasks
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent Decisions */}
        {context.recentDecisions.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Recent Decisions ({context.recentDecisions.length})
            </h4>
            <div className="space-y-2">
              {context.recentDecisions.slice(0, 3).map((decision) => (
                <div key={decision.id} className="text-sm space-y-1">
                  <div className="font-medium">{decision.title}</div>
                  <div className="text-muted-foreground text-xs">
                    {decision.description}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Made: {new Date(decision.madeAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
              {context.recentDecisions.length > 3 && (
                <div className="text-xs text-muted-foreground">
                  +{context.recentDecisions.length - 3} more decisions
                </div>
              )}
            </div>
          </div>
        )}

        {/* Project Rules */}
        {context.rules.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">
              Project Rules ({context.rules.length})
            </h4>
            <div className="space-y-2">
              {context.rules.slice(0, 3).map((rule) => (
                <div key={rule.id} className="text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{rule.title}</span>
                    <Badge
                      variant={getPriorityColor(rule.priority)}
                      className="text-xs"
                    >
                      {rule.priority}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {rule.description}
                  </div>
                </div>
              ))}
              {context.rules.length > 3 && (
                <div className="text-xs text-muted-foreground">
                  +{context.rules.length - 3} more rules
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ContextPanel;
