"use client";

import { useState } from "react";
import { Search, Plus, Filter, Grid3X3, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProjectsHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  phaseFilter: string;
  setPhaseFilter: (filter: string) => void;
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
  filteredProjectsCount: number;
  phaseLabels: Record<string, string>;
  onAddProject: (project: {
    name: string;
    description: string;
    phase: string;
    githubUrl: string;
    priority: string;
    teamLead?: string;
  }) => void;
}

export function ProjectsHeader({
  searchQuery,
  setSearchQuery,
  phaseFilter,
  setPhaseFilter,
  viewMode,
  setViewMode,
  filteredProjectsCount,
  phaseLabels,
  onAddProject,
}: ProjectsHeaderProps) {
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [startingPhase, setStartingPhase] = useState("product-modeling");
  const [githubUrl, setGithubUrl] = useState("");
  const [priority, setPriority] = useState("medium");
  const [teamLead, setTeamLead] = useState("");

  const handleAddProject = () => {
    if (!projectName || !githubUrl) {
      console.error("Project name and GitHub URL are required");
      return;
    }

    onAddProject({
      name: projectName,
      description: projectDescription,
      phase: startingPhase,
      githubUrl: githubUrl,
      priority: priority,
      teamLead: teamLead || undefined,
    });

    // Reset form
    setProjectName("");
    setProjectDescription("");
    setStartingPhase("product-modeling");
    setGithubUrl("");
    setPriority("medium");
    setTeamLead("");
    setIsNewProjectOpen(false);
  };

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-foreground">Projects</h1>
        <p className="text-muted-foreground">
          {filteredProjectsCount}{" "}
          {filteredProjectsCount === 1 ? "project" : "projects"}
        </p>
      </div>

      <div className="flex items-center gap-4">
        {/* Add Project Button */}
        <Dialog open={isNewProjectOpen} onOpenChange={setIsNewProjectOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Project
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Add a new project to your workspace with all details
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="projectName" className="text-sm font-medium">
                  Project Name
                </label>
                <Input
                  id="projectName"
                  placeholder="Enter project name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <Textarea
                  id="description"
                  placeholder="Describe your project"
                  rows={3}
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="phase" className="text-sm font-medium">
                    Starting Phase
                  </label>
                  <Select
                    value={startingPhase}
                    onValueChange={setStartingPhase}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="product-modeling">
                        Product Modeling
                      </SelectItem>
                      <SelectItem value="development">Development</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="priority" className="text-sm font-medium">
                    Priority
                  </label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="githubUrl" className="text-sm font-medium">
                  GitHub Repository URL
                </label>
                <Input
                  id="githubUrl"
                  type="url"
                  placeholder="https://github.com/username/repository"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="teamLead" className="text-sm font-medium">
                  Team Lead (Optional)
                </label>
                <Select value={teamLead} onValueChange={setTeamLead}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team lead" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="john-doe">John Doe</SelectItem>
                    <SelectItem value="jane-smith">Jane Smith</SelectItem>
                    <SelectItem value="mike-johnson">Mike Johnson</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleAddProject} className="flex-1">
                  Add Project
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsNewProjectOpen(false);
                    setProjectName("");
                    setProjectDescription("");
                    setStartingPhase("product-modeling");
                    setGithubUrl("");
                    setPriority("medium");
                    setTeamLead("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Search and Filters */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 bg-secondary pl-9 border-border focus:bg-background"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              {phaseFilter === "all" ? "All Phases" : phaseLabels[phaseFilter]}
              <List className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Filter by Phase</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setPhaseFilter("all")}>
              All Phases
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setPhaseFilter("product-modeling")}
            >
              Product Modeling
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPhaseFilter("development")}>
              Development
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPhaseFilter("marketing")}>
              Marketing
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPhaseFilter("completed")}>
              Completed
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              {viewMode === "grid" ? (
                <List className="h-4 w-4" />
              ) : (
                <Grid3X3 className="h-4 w-4" />
              )}
              {viewMode === "grid" ? "List View" : "Grid View"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>View Mode</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setViewMode("grid")}>
              Grid View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setViewMode("list")}>
              List View
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
