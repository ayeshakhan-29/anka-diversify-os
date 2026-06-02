"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FolderKanban, Github } from "lucide-react";

interface ProjectRow {
  id: string;
  name: string;
  phase: string | null;
  status: string;
  progress: number | null;
  githubUrl: string | null;
  memberCount: number;
}

interface ActiveProjectsProps {
  projects: ProjectRow[];
}

const phaseColors: Record<string, string> = {
  "product-modeling": "bg-blue-100 text-blue-800",
  development: "bg-green-100 text-green-800",
  marketing: "bg-purple-100 text-purple-800",
  completed: "bg-gray-100 text-gray-800",
};

export function ActiveProjects({ projects }: ActiveProjectsProps) {
  const inDev = projects.filter((p) => p.phase === "development").length;

  return (
    <Card className="lg:col-span-2 bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-foreground">
          Active Projects
        </CardTitle>
        <Badge variant="secondary">{inDev} in development</Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {projects.map((project) => (
              <div
                key={project.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 shrink-0">
                    <FolderKanban className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-medium text-foreground truncate">{project.name}</h4>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {project.phase && (
                        <Badge className={phaseColors[project.phase] ?? "bg-gray-100 text-gray-800"}>
                          {project.phase}
                        </Badge>
                      )}
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {project.memberCount} members
                      </span>
                      {project.githubUrl && (
                        <Badge variant="outline" className="text-xs">
                          <Github className="h-3 w-3 mr-1" />
                          Connected
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <div className="text-sm text-muted-foreground mb-1">Progress</div>
                  <Progress value={project.progress ?? 0} className="w-full sm:w-20 mb-2" />
                  <div className="text-sm font-medium">{project.progress ?? 0}%</div>
                </div>
              </div>
          ))}
          {projects.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">No active projects</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
