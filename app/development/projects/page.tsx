"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { ProjectsHeader } from "@/components/project/ProjectsHeader";
import { ProjectsGrid } from "@/components/project/ProjectsGrid";
import { ProjectsList } from "@/components/project/ProjectsList";
import { projects } from "@/lib/mock-data";

const phaseColors: Record<string, string> = {
  "product-modeling": "bg-chart-4/20 text-chart-4 border-chart-4/30",
  development: "bg-primary/20 text-primary border-primary/30",
  marketing: "bg-accent/20 text-accent border-accent/30",
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
  const [projectsList, setProjectsList] = useState(projects);

  const filteredProjects = projectsList.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPhase = phaseFilter === "all" || project.phase === phaseFilter;
    return matchesSearch && matchesPhase;
  });

  const handleAddProject = (projectData: {
    name: string;
    description: string;
    phase: string;
    githubUrl: string;
    priority: string;
    teamLead?: string;
  }) => {
    const newProject = {
      id: Date.now().toString(),
      name: projectData.name,
      description: projectData.description,
      phase: projectData.phase as any,
      progress: 0,
      team: [
        {
          id: "current",
          name: "Admin User",
          avatar: "",
          email: "admin@example.com",
          role: "admin",
          department: "engineering",
          status: "online" as const,
        },
      ],
      githubUrl: projectData.githubUrl,
      lastCommit: {
        message: "Initial project setup",
        author: "Admin User",
        timestamp: new Date().toISOString(),
      },
      startDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      tasks: [],
      priority: projectData.priority as any,
      status: "active" as const,
    };

    setProjectsList([...projectsList, newProject]);
    console.log("Project added:", newProject);
  };

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
      done: project.tasks.filter((t) => t.status === "done").length,
    };
  };

  return (
    <MainLayout breadcrumb={["Development", "Projects"]}>
      <div className="space-y-6">
        <ProjectsHeader
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          phaseFilter={phaseFilter}
          setPhaseFilter={setPhaseFilter}
          viewMode={viewMode}
          setViewMode={setViewMode}
          filteredProjectsCount={filteredProjects.length}
          phaseLabels={phaseLabels}
          onAddProject={handleAddProject}
        />

        {/* Projects Grid/List */}
        {viewMode === "grid" ? (
          <ProjectsGrid
            filteredProjects={filteredProjects}
            phaseColors={phaseColors}
            phaseLabels={phaseLabels}
            priorityColors={priorityColors}
            getProjectProgress={getProjectProgress}
            getTaskStats={getTaskStats}
          />
        ) : (
          <ProjectsList
            filteredProjects={filteredProjects}
            phaseColors={phaseColors}
            phaseLabels={phaseLabels}
            priorityColors={priorityColors}
            getProjectProgress={getProjectProgress}
            getTaskStats={getTaskStats}
          />
        )}
      </div>
    </MainLayout>
  );
}
