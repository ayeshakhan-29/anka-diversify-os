"use client";

import { useState, useEffect, useCallback } from "react";
import {
  GitBranch,
  Plus,
  RefreshCw,
  ExternalLink,
  Trash2,
  Edit3,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FolderGit2,
  Eye,
  EyeOff,
  Loader2,
  Layers,
  Terminal,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type { Project, ProjectRepository, ProjectRepositoryRole, CreateProjectRepositoryInput } from "@/lib/types";

const ROLE_CONFIG: Record<
  ProjectRepositoryRole,
  { label: string; color: string }
> = {
  frontend: { label: "Frontend", color: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
  backend: { label: "Backend", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  mobile: { label: "Mobile", color: "bg-purple-500/10 text-purple-400 border-purple-500/30" },
  infrastructure: { label: "Infrastructure", color: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  shared_library: { label: "Shared Library", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30" },
  documentation: { label: "Docs", color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30" },
  data: { label: "Data / AI", color: "bg-pink-500/10 text-pink-400 border-pink-500/30" },
  custom: { label: "Custom", color: "bg-muted text-muted-foreground border-border" },
};

const ALL_ROLES: ProjectRepositoryRole[] = [
  "frontend",
  "backend",
  "mobile",
  "infrastructure",
  "shared_library",
  "documentation",
  "data",
  "custom",
];

interface ProjectRepositoriesProps {
  projectId: string;
  project?: Project;
}

export function ProjectRepositories({ projectId, project }: ProjectRepositoriesProps) {
  const [repositories, setRepositories] = useState<ProjectRepository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Syncing state per repo
  const [syncingRepoId, setSyncingRepoId] = useState<string | null>(null);
  const [syncSuccessRepoId, setSyncSuccessRepoId] = useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRepo, setEditingRepo] = useState<ProjectRepository | null>(null);
  const [repoToDelete, setRepoToDelete] = useState<ProjectRepository | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form fields
  const [formData, setFormData] = useState({
    name: "",
    role: "backend" as ProjectRepositoryRole,
    githubUrl: "",
    githubToken: "",
    defaultBranch: "main",
    buildCommand: "",
    testCommand: "",
    dependencies: [] as string[],
  });
  const [showToken, setShowToken] = useState(false);
  const [validatingToken, setValidatingToken] = useState(false);
  const [tokenValidationMsg, setTokenValidationMsg] = useState<{
    valid: boolean;
    text: string;
  } | null>(null);

  const fetchRepositories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await projectApi.getRepositories(projectId);

      // If backend has no primary repository row yet, but project has githubUrl,
      // synthesize primary repo card so primary repository is always visible
      const hasPrimary = list.some((r) => r.isPrimary);
      if (!hasPrimary && project?.githubUrl) {
        const primarySynth: ProjectRepository = {
          id: `primary-${projectId}`,
          projectId,
          name: project.name ? `${project.name} (main)` : "primary",
          role: "backend",
          githubUrl: project.githubUrl,
          defaultBranch: "main",
          buildCommand: null,
          testCommand: null,
          isPrimary: true,
          dependencies: [],
          hasToken: true,
          localPath: project.localPath || null,
        };
        setRepositories([primarySynth, ...list]);
      } else {
        setRepositories(list);
      }
    } catch (err: any) {
      console.error("Failed to load repositories:", err);
      // If error but project has githubUrl, fallback to showing primary
      if (project?.githubUrl) {
        setRepositories([
          {
            id: `primary-${projectId}`,
            projectId,
            name: project.name || "primary",
            role: "backend",
            githubUrl: project.githubUrl,
            defaultBranch: "main",
            buildCommand: null,
            testCommand: null,
            isPrimary: true,
            dependencies: [],
            hasToken: true,
            localPath: project.localPath || null,
          },
        ]);
      } else {
        setError(err.message || "Failed to load project repositories.");
      }
    } finally {
      setLoading(false);
    }
  }, [projectId, project?.githubUrl, project?.name, project?.localPath]);

  useEffect(() => {
    fetchRepositories();
  }, [fetchRepositories]);

  const handleOpenAddModal = () => {
    setEditingRepo(null);
    setFormData({
      name: "",
      role: "backend",
      githubUrl: "",
      githubToken: "",
      defaultBranch: "main",
      buildCommand: "",
      testCommand: "",
      dependencies: [],
    });
    setShowToken(false);
    setFormError(null);
    setTokenValidationMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (repo: ProjectRepository) => {
    setEditingRepo(repo);
    setFormData({
      name: repo.name,
      role: repo.role,
      githubUrl: repo.githubUrl,
      githubToken: "", // Never populate token field on edit for security
      defaultBranch: repo.defaultBranch || "main",
      buildCommand: repo.buildCommand || "",
      testCommand: repo.testCommand || "",
      dependencies: repo.dependencies || [],
    });
    setShowToken(false);
    setFormError(null);
    setTokenValidationMsg(null);
    setIsModalOpen(true);
  };

  const handleValidateToken = async () => {
    if (!formData.githubToken || formData.githubToken.length < 10) {
      setTokenValidationMsg({ valid: false, text: "Token is too short to validate." });
      return;
    }
    setValidatingToken(true);
    setTokenValidationMsg(null);
    try {
      const res = await projectApi.validateGitHubToken(formData.githubToken);
      if (res.valid) {
        setTokenValidationMsg({
          valid: true,
          text: `Valid GitHub token (${res.username || "authenticated"})`,
        });
      } else {
        setTokenValidationMsg({
          valid: false,
          text: res.error || "Invalid token.",
        });
      }
    } catch (e: any) {
      setTokenValidationMsg({
        valid: false,
        text: e.message || "Failed to validate token.",
      });
    } finally {
      setValidatingToken(false);
    }
  };

  const handleSaveRepository = async () => {
    if (!formData.name.trim()) {
      setFormError("Repository name is required.");
      return;
    }
    if (!formData.githubUrl.trim()) {
      setFormError("GitHub Repository URL is required.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (editingRepo) {
        // Update existing repository
        const updatePayload: Partial<CreateProjectRepositoryInput> = {
          name: formData.name.trim(),
          role: formData.role,
          githubUrl: formData.githubUrl.trim(),
          defaultBranch: formData.defaultBranch.trim() || "main",
          buildCommand: formData.buildCommand.trim() || undefined,
          testCommand: formData.testCommand.trim() || undefined,
          dependencies: formData.dependencies,
        };

        // Only send githubToken if the user explicitly provided a new one
        if (formData.githubToken.trim().length > 0) {
          updatePayload.githubToken = formData.githubToken.trim();
        }

        await projectApi.updateRepository(projectId, editingRepo.id, updatePayload);
      } else {
        // Create new secondary repository
        const createPayload: CreateProjectRepositoryInput = {
          name: formData.name.trim(),
          role: formData.role,
          githubUrl: formData.githubUrl.trim(),
          defaultBranch: formData.defaultBranch.trim() || "main",
          buildCommand: formData.buildCommand.trim() || undefined,
          testCommand: formData.testCommand.trim() || undefined,
          dependencies: formData.dependencies,
        };

        if (formData.githubToken.trim().length > 0) {
          createPayload.githubToken = formData.githubToken.trim();
        }

        await projectApi.createRepository(projectId, createPayload);
      }

      setIsModalOpen(false);
      await fetchRepositories();
    } catch (e: any) {
      setFormError(e.message || "Failed to save repository.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRepository = async () => {
    if (!repoToDelete) return;
    if (repoToDelete.isPrimary) {
      setRepoToDelete(null);
      return;
    }

    setIsDeleting(true);
    try {
      await projectApi.deleteRepository(projectId, repoToDelete.id);
      setRepoToDelete(null);
      await fetchRepositories();
    } catch (e: any) {
      alert(`Delete failed: ${e.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSyncRepo = async (repo: ProjectRepository) => {
    setSyncingRepoId(repo.id);
    setSyncSuccessRepoId(null);
    try {
      if (repo.isPrimary && repo.id.startsWith("primary-")) {
        await projectApi.syncGithub(projectId, repo.githubUrl);
      } else {
        await projectApi.syncRepository(projectId, repo.id);
      }
      setSyncSuccessRepoId(repo.id);
      setTimeout(() => setSyncSuccessRepoId(null), 3000);
    } catch (e: any) {
      console.error("Sync error:", e);
      alert(`Sync failed: ${e.message}`);
    } finally {
      setSyncingRepoId(null);
    }
  };

  const primaryRepo = repositories.find((r) => r.isPrimary);
  const secondaryRepos = repositories.filter((r) => !r.isPrimary);
  const totalRepos = repositories.length;

  return (
    <div className="space-y-6">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold tracking-tight">Repositories</h2>
            {totalRepos >= 2 ? (
              <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-0.5 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Multi-Repo Agent Enabled ({totalRepos} repos)
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs text-muted-foreground px-2.5 py-0.5">
                Single Repository
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {totalRepos >= 2
              ? "All registered repositories participate in coordinated AI tasks and independent verification."
              : "Add another repository to enable multi-repo agent workflows across your frontend, backend, or libraries."}
          </p>
        </div>

        <Button onClick={handleOpenAddModal} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Add Repository
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchRepositories}>
            Retry
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground space-y-3">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <p className="text-sm">Loading project repositories...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* ── Primary Repository Card ── */}
          {primaryRepo && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <GitBranch className="h-3.5 w-3.5 text-primary" />
                <span>Primary Repository</span>
              </div>

              <Card className="border-primary/30 bg-primary/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                          <FolderGit2 className="h-4 w-4 text-primary" />
                          {primaryRepo.name}
                        </CardTitle>
                        <Badge className="bg-primary/20 text-primary border-primary/40 font-mono text-[11px]">
                          PRIMARY
                        </Badge>
                        <Badge
                          variant="outline"
                          className={ROLE_CONFIG[primaryRepo.role]?.color || ROLE_CONFIG.custom.color}
                        >
                          {ROLE_CONFIG[primaryRepo.role]?.label || primaryRepo.role}
                        </Badge>
                      </div>
                      <a
                        href={primaryRepo.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 w-fit"
                      >
                        <span>{primaryRepo.githubUrl}</span>
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 h-8 text-xs"
                        onClick={() => handleSyncRepo(primaryRepo)}
                        disabled={syncingRepoId === primaryRepo.id}
                      >
                        <RefreshCw
                          className={`h-3.5 w-3.5 ${
                            syncingRepoId === primaryRepo.id ? "animate-spin text-primary" : ""
                          }`}
                        />
                        {syncingRepoId === primaryRepo.id ? "Syncing..." : syncSuccessRepoId === primaryRepo.id ? "Synced!" : "Sync"}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-primary/20">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Default Branch</span>
                      <span className="font-mono font-medium">{primaryRepo.defaultBranch || "main"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Authentication</span>
                      <span className="inline-flex items-center gap-1 font-medium text-emerald-400">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Token configured
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Management</span>
                      <span className="text-muted-foreground">Managed via Settings</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Role</span>
                      <span className="font-medium capitalize">{primaryRepo.role}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── Additional Repositories ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <Layers className="h-3.5 w-3.5" />
                <span>Additional Repositories ({secondaryRepos.length})</span>
              </div>
            </div>

            {secondaryRepos.length === 0 ? (
              <Card className="border-dashed p-8 text-center bg-card/40">
                <div className="max-w-md mx-auto space-y-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                    <Plus className="h-5 w-5" />
                  </div>
                  <h4 className="font-medium text-sm">No additional repositories registered</h4>
                  <p className="text-xs text-muted-foreground">
                    Connect companion repositories like a separate frontend, microservice backend, or shared package
                    to unlock automated multi-repository task execution.
                  </p>
                  <Button onClick={handleOpenAddModal} variant="outline" size="sm" className="gap-2">
                    <Plus className="h-3.5 w-3.5" />
                    Add Repository
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {secondaryRepos.map((repo) => {
                  const roleStyle = ROLE_CONFIG[repo.role] || ROLE_CONFIG.custom;
                  const isSyncing = syncingRepoId === repo.id;
                  const isSyncSuccess = syncSuccessRepoId === repo.id;

                  return (
                    <Card key={repo.id} className="hover:border-foreground/30 transition-colors bg-card/60">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm truncate">{repo.name}</span>
                              <Badge variant="outline" className={`text-[10px] px-2 py-0 ${roleStyle.color}`}>
                                {roleStyle.label}
                              </Badge>
                            </div>
                            <a
                              href={repo.githubUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 truncate"
                            >
                              <span className="truncate">{repo.githubUrl}</span>
                              <ExternalLink className="h-3 w-3 shrink-0" />
                            </a>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              title="Sync Context"
                              onClick={() => handleSyncRepo(repo)}
                              disabled={isSyncing}
                            >
                              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin text-primary" : ""}`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              title="Edit Repository"
                              onClick={() => handleOpenEditModal(repo)}
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              title="Delete Repository"
                              onClick={() => setRepoToDelete(repo)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0 space-y-3 text-xs">
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t text-[11px]">
                          <div>
                            <span className="text-muted-foreground block">Branch</span>
                            <span className="font-mono font-medium">{repo.defaultBranch || "main"}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block">Access Token</span>
                            {repo.hasToken ? (
                              <span className="inline-flex items-center gap-1 font-medium text-emerald-400">
                                <ShieldCheck className="h-3 w-3" />
                                Configured
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Public / None</span>
                            )}
                          </div>
                        </div>

                        {(repo.buildCommand || repo.testCommand) && (
                          <div className="p-2 rounded bg-muted/40 font-mono text-[10px] space-y-1">
                            {repo.buildCommand && (
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Terminal className="h-3 w-3 text-primary shrink-0" />
                                <span className="text-foreground">{repo.buildCommand}</span>
                              </div>
                            )}
                            {repo.testCommand && (
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Terminal className="h-3 w-3 text-emerald-400 shrink-0" />
                                <span className="text-foreground">{repo.testCommand}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {repo.dependencies && repo.dependencies.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                              Dependencies:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {repo.dependencies.map((depId) => {
                                const depRepo = repositories.find((r) => r.id === depId);
                                return (
                                  <Badge key={depId} variant="secondary" className="text-[10px] py-0 px-1.5">
                                    {depRepo?.name || depId}
                                  </Badge>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {isSyncSuccess && (
                          <div className="text-[11px] text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Context snapshot synced successfully.
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Add / Edit Repository Modal ── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{editingRepo ? "Edit Repository" : "Add Repository"}</DialogTitle>
            <DialogDescription>
              {editingRepo
                ? `Update configuration for "${editingRepo.name}".`
                : "Register an additional repository under this project for multi-repository coordination."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-sm">
            {formError && (
              <div className="p-3 rounded bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                {formError}
              </div>
            )}

            {/* Name & Role */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">
                  Repository Name <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="e.g. backend-api"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">
                  Repository Role <span className="text-destructive">*</span>
                </label>
                <Select
                  value={formData.role}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, role: v as ProjectRepositoryRole }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_ROLES.map((roleKey) => (
                      <SelectItem key={roleKey} value={roleKey}>
                        {ROLE_CONFIG[roleKey]?.label || roleKey}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* GitHub URL & Branch */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-medium">
                  GitHub Repository URL <span className="text-destructive">*</span>
                </label>
                <Input
                  type="url"
                  placeholder="https://github.com/org/repo"
                  value={formData.githubUrl}
                  onChange={(e) => setFormData((prev) => ({ ...prev, githubUrl: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Default Branch</label>
                <Input
                  placeholder="main"
                  value={formData.defaultBranch}
                  onChange={(e) => setFormData((prev) => ({ ...prev, defaultBranch: e.target.value }))}
                />
              </div>
            </div>

            {/* Token Input with Security Rules */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium">GitHub Personal Access Token</label>
                {editingRepo?.hasToken && (
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                    <ShieldCheck className="h-3 w-3" />
                    Token configured
                  </span>
                )}
              </div>
              <div className="relative flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showToken ? "text" : "password"}
                    placeholder={
                      editingRepo?.hasToken
                        ? "Leave blank to keep existing token"
                        : "ghp_xxxxxxxxxxxx"
                    }
                    value={formData.githubToken}
                    onChange={(e) => setFormData((prev) => ({ ...prev, githubToken: e.target.value }))}
                    className="pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {formData.githubToken.length >= 10 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleValidateToken}
                    disabled={validatingToken}
                    className="shrink-0 text-xs"
                  >
                    {validatingToken ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Validate"}
                  </Button>
                )}
              </div>
              {tokenValidationMsg && (
                <p
                  className={`text-xs mt-1 ${
                    tokenValidationMsg.valid ? "text-emerald-400" : "text-destructive"
                  }`}
                >
                  {tokenValidationMsg.text}
                </p>
              )}
            </div>

            {/* Build & Test Commands */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Build Command (optional)</label>
                <Input
                  placeholder="e.g. npm run build"
                  value={formData.buildCommand}
                  onChange={(e) => setFormData((prev) => ({ ...prev, buildCommand: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Test Command (optional)</label>
                <Input
                  placeholder="e.g. npm test"
                  value={formData.testCommand}
                  onChange={(e) => setFormData((prev) => ({ ...prev, testCommand: e.target.value }))}
                />
              </div>
            </div>

            {/* Dependencies */}
            {repositories.filter((r) => !editingRepo || r.id !== editingRepo.id).length > 0 && (
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-medium">Dependencies (optional)</label>
                <p className="text-[11px] text-muted-foreground mb-1.5">
                  Select other repositories that this repository depends on:
                </p>
                <div className="space-y-1 max-h-28 overflow-y-auto border rounded p-2 bg-background/50">
                  {repositories
                    .filter((r) => !editingRepo || r.id !== editingRepo.id)
                    .map((r) => {
                      const isChecked = formData.dependencies.includes(r.id);
                      return (
                        <label
                          key={r.id}
                          className="flex items-center gap-2 text-xs py-1 px-1.5 rounded hover:bg-muted/40 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData((prev) => ({
                                  ...prev,
                                  dependencies: [...prev.dependencies, r.id],
                                }));
                              } else {
                                setFormData((prev) => ({
                                  ...prev,
                                  dependencies: prev.dependencies.filter((id) => id !== r.id),
                                }));
                              }
                            }}
                            className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5"
                          />
                          <span className="font-medium">{r.name}</span>
                          <span className="text-[10px] text-muted-foreground">({r.role})</span>
                          {r.isPrimary && (
                            <Badge variant="outline" className="text-[9px] py-0 px-1">
                              Primary
                            </Badge>
                          )}
                        </label>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSaveRepository} disabled={isSubmitting} className="gap-2">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingRepo ? "Save Changes" : "Add Repository"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <AlertDialog open={!!repoToDelete} onOpenChange={(open) => !open && setRepoToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Repository?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{repoToDelete?.name}</strong> from this project? The
              underlying GitHub repository will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRepository}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Removing..." : "Remove Repository"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
