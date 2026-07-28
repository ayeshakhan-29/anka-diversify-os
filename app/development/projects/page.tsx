"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { ProjectsHeader } from "@/components/project/ProjectsHeader";
import { ProjectsGrid } from "@/components/project/ProjectsGrid";
import { ProjectsList } from "@/components/project/ProjectsList";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch projects from backend on mount; fall back to mock data if unavailable
  useEffect(() => {
    projectApi
      .getAll()
      .then((backendProjects) => setProjectsList(backendProjects))
      .catch(() => { })
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
    githubToken: string;
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
        githubToken: projectData.githubToken,
      });

      setProjectsList((prev) => [created, ...prev]);
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);
    try {
      await projectApi.delete(projectToDelete.id);
      setProjectsList((prev) => prev.filter((p) => p.id !== projectToDelete.id));
      setProjectToDelete(null);
    } catch (error) {
      console.error("Failed to delete project:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getProjectProgress = (project: Project) => {
    const total = project.tasks?.length || 0;
    const done = (project.tasks || []).filter((t) => t.status === "done").length;
    return total > 0 ? Math.round((done / total) * 100) : project.progress ?? 0;
  };

  const getTaskStats = (project: Project) => ({
    todo: (project.tasks || []).filter((t) => t.status === "todo").length,
    inProgress: (project.tasks || []).filter((t) => t.status === "in-progress").length,
    done: (project.tasks || []).filter((t) => t.status === "done").length,
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
            onDeleteProject={(id) => {
              const target = projectsList.find((p) => p.id === id);
              if (target) setProjectToDelete(target);
            }}
          />
        ) : (
          <ProjectsList
            filteredProjects={filteredProjects}
            phaseColors={phaseColors}
            phaseLabels={phaseLabels}
            priorityColors={priorityColors}
            getProjectProgress={getProjectProgress}
            getTaskStats={getTaskStats}
            onDeleteProject={(id) => {
              const target = projectsList.find((p) => p.id === id);
              if (target) setProjectToDelete(target);
            }}
          />
        )}

        {/* Custom Delete Confirmation Modal */}
        <AlertDialog open={!!projectToDelete} onOpenChange={(open) => !open && !isDeleting && setProjectToDelete(null)}>
          <AlertDialogContent className="sm:max-w-[425px]">
            <AlertDialogHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center text-destructive shrink-0">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <AlertDialogTitle>Delete Project</AlertDialogTitle>
                  <AlertDialogDescription className="text-xs text-muted-foreground mt-0.5">
                    This action is permanent and cannot be undone.
                  </AlertDialogDescription>
                </div>
              </div>
            </AlertDialogHeader>
            <div className="py-2 text-sm text-foreground">
              Are you sure you want to delete <span className="font-semibold text-destructive">{projectToDelete?.name}</span>? All associated tasks, files, sprints, and repository history will be permanently deleted.
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleConfirmDelete();
                }}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  "Delete Project"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
