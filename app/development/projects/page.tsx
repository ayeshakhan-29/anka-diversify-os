"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { ProjectsHeader } from "@/components/project/ProjectsHeader";
import { ProjectsGrid } from "@/components/project/ProjectsGrid";
import { ProjectsList } from "@/components/project/ProjectsList";
import { projectApi } from "@/lib/project-api";
import type { Project } from "@/lib/types";

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
  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch projects from backend on mount; fall back to mock data if unavailable
  useEffect(() => {
    projectApi
      .getAll()
      .then((backendProjects) => setProjectsList(backendProjects))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredProjects = projectsList.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPhase = phaseFilter === "all" || project.phase === phaseFilter;
    return matchesSearch && matchesPhase;
  });

  const handleAddProject = async (projectData: {
    name: string;
    description: string;
    phase: string;
    githubUrl: string;
    priority: string;
    teamLead?: string;
  }) => {
    try {
      const created = await projectApi.create({
        name: projectData.name,
        description: projectData.description,
        phase: projectData.phase,
        priority: projectData.priority,
        githubUrl: projectData.githubUrl || undefined,
      });

      setProjectsList((prev) => [created, ...prev]);
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  };

  const getProjectProgress = (project: Project) => {
    const total = project.tasks.length;
    const done = project.tasks.filter((t) => t.status === "done").length;
    return total > 0 ? Math.round((done / total) * 100) : project.progress ?? 0;
  };

  const getTaskStats = (project: Project) => ({
    todo: project.tasks.filter((t) => t.status === "todo").length,
    inProgress: project.tasks.filter((t) => t.status === "in-progress").length,
    done: project.tasks.filter((t) => t.status === "done").length,
  });

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

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
            Loading projects...
          </div>
        ) : viewMode === "grid" ? (
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
