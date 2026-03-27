"use client";

import { ProjectCard } from "./ProjectCard";

interface ProjectsGridProps {
  filteredProjects: any[];
  phaseColors: Record<string, string>;
  phaseLabels: Record<string, string>;
  priorityColors: Record<string, string>;
  getProjectProgress: (project: any) => number;
  getTaskStats: (project: any) => {
    todo: number;
    inProgress: number;
    done: number;
  };
}

export function ProjectsGrid({
  filteredProjects,
  phaseColors,
  phaseLabels,
  priorityColors,
  getProjectProgress,
  getTaskStats,
}: ProjectsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredProjects.map((project) => {
        const progress = getProjectProgress(project);
        const stats = getTaskStats(project);
        const teamMembers = project.team;

        return (
          <ProjectCard
            key={project.id}
            project={project}
            progress={progress}
            stats={stats}
            teamMembers={teamMembers}
            phaseColors={phaseColors}
            phaseLabels={phaseLabels}
            priorityColors={priorityColors}
          />
        );
      })}
    </div>
  );
}
