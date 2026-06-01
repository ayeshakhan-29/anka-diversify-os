"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

interface TaskRow {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  projectId: string;
  projectName: string | null;
}

interface RecentTasksProps {
  tasks: TaskRow[];
}

const priorityColors: Record<string, string> = {
  low: "border-muted-foreground text-muted-foreground",
  medium: "border-warning text-warning",
  high: "border-destructive text-destructive",
  critical: "border-destructive text-destructive bg-destructive/10",
};

export function RecentTasks({ tasks }: RecentTasksProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          Recent Tasks
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Task</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Project</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Priority</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {tasks.slice(0, 5).map((task) => (
                <tr key={task.id} className="border-b border-border/50">
                  <td className="py-4 px-2">
                    <p className="font-medium text-foreground">{task.title}</p>
                  </td>
                  <td className="py-4 px-2">
                    <span className="text-sm text-muted-foreground">
                      {task.projectName ?? task.projectId}
                    </span>
                  </td>
                  <td className="py-4 px-2">
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        task.status === "done"
                          ? "border-success text-success"
                          : task.status === "in_progress"
                          ? "border-primary text-primary"
                          : task.status === "review"
                          ? "border-warning text-warning"
                          : "border-muted-foreground text-muted-foreground"
                      }`}
                    >
                      {task.status.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="py-4 px-2">
                    <Badge
                      variant="outline"
                      className={`text-xs ${priorityColors[task.priority] ?? ""}`}
                    >
                      {task.priority}
                    </Badge>
                  </td>
                  <td className="py-4 px-2">
                    {task.dueDate ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {new Date(task.dueDate) < new Date() && task.status !== "done" && (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        )}
                        {new Date(task.dueDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                    No tasks yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
