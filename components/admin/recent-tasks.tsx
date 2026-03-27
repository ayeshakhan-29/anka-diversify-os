"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { tasks } from "@/lib/mock-data";

const priorityColors: Record<string, string> = {
  low: "border-muted-foreground text-muted-foreground",
  medium: "border-warning text-warning",
  high: "border-destructive text-destructive",
  critical: "border-destructive text-destructive bg-destructive/10",
};

export function RecentTasks() {
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
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                  Task
                </th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                  Assignee
                </th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                  Status
                </th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                  Priority
                </th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                  Due Date
                </th>
              </tr>
            </thead>
            <tbody>
              {tasks.slice(0, 5).map((task) => (
                <tr key={task.id} className="border-b border-border/50">
                  <td className="py-4">
                    <div>
                      <p className="font-medium text-foreground">{task.title}</p>
                      <p className="text-sm text-muted-foreground">{task.projectId}</p>
                    </div>
                  </td>
                  <td className="py-4">
                    {task.assignee ? (
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-xs">
                          {task.assignee.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <span className="text-sm">{task.assignee.name}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Unassigned
                      </span>
                    )}
                  </td>
                  <td className="py-4">
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        task.status === "done"
                          ? "border-success text-success"
                          : task.status === "in-progress"
                          ? "border-primary text-primary"
                          : task.status === "review"
                          ? "border-warning text-warning"
                          : "border-muted-foreground text-muted-foreground"
                      }`}
                    >
                      {task.status.replace("-", " ")}
                    </Badge>
                  </td>
                  <td className="py-4">
                    <Badge className={`text-xs ${priorityColors[task.priority]}`}>
                      {task.priority}
                    </Badge>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {new Date(task.dueDate) < new Date() &&
                        task.status !== "done" && (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        )}
                      {new Date(task.dueDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
