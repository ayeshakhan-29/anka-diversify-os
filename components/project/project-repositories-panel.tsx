"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { Label } from "@/components/ui/label";
import { GitBranch, Plus, Trash2, Loader2, ShieldCheck, Star, RefreshCw } from "lucide-react";
import { projectRepositoryApi, type ProjectRepository } from "@/lib/project-api";

const ROLE_OPTIONS = [
  { value: "frontend", label: "Frontend" },
  { value: "backend", label: "Backend" },
  { value: "mobile", label: "Mobile" },
  { value: "infrastructure", label: "Infrastructure" },
  { value: "shared_library", label: "Shared Library" },
  { value: "documentation", label: "Documentation" },
  { value: "data", label: "Data" },
  { value: "custom", label: "Custom" },
];

const roleBadgeClass: Record<string, string> = {
  frontend: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  backend: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  mobile: "bg-purple-500/10 text-purple-500 border-purple-500/30",
  infrastructure: "bg-orange-500/10 text-orange-500 border-orange-500/30",
  shared_library: "bg-cyan-500/10 text-cyan-500 border-cyan-500/30",
  documentation: "bg-slate-500/10 text-slate-500 border-slate-500/30",
  data: "bg-pink-500/10 text-pink-500 border-pink-500/30",
  custom: "bg-muted text-muted-foreground border-border",
};

interface ProjectRepositoriesPanelProps {
  projectId: string;
}

export function ProjectRepositoriesPanel({ projectId }: ProjectRepositoriesPanelProps) {
  const [repos, setRepos] = useState<ProjectRepository[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repoToDelete, setRepoToDelete] = useState<ProjectRepository | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    role: "backend",
    githubUrl: "",
    githubToken: "",
    localPath: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await projectRepositoryApi.list(projectId);
      setRepos(data);
    } catch (err: any) {
      setError(err.message || "Failed to load repositories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const resetForm = () => setForm({ name: "", role: "backend", githubUrl: "", githubToken: "", localPath: "" });

  const handleCreate = async () => {
    if (!form.name.trim() || !form.githubUrl.trim()) {
      setError("Name and GitHub URL are required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await projectRepositoryApi.create(projectId, {
        name: form.name.trim(),
        role: form.role,
        githubUrl: form.githubUrl.trim(),
        githubToken: form.githubToken.trim() || undefined,
        localPath: form.localPath.trim() || undefined,
      });
      setIsAddOpen(false);
      resetForm();
      await load();
    } catch (err: any) {
      setError(err.message || "Failed to add repository");
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async (repo: ProjectRepository) => {
    setSyncingId(repo.id);
    setError(null);
    try {
      await projectRepositoryApi.sync(projectId, repo.id);
    } catch (err: any) {
      setError(err.message || "Failed to sync repository");
    } finally {
      setSyncingId(null);
    }
  };

  const handleDelete = async () => {
    if (!repoToDelete) return;
    try {
      await projectRepositoryApi.remove(projectId, repoToDelete.id);
      setRepoToDelete(null);
      await load();
    } catch (err: any) {
      setError(err.message || "Failed to delete repository");
      setRepoToDelete(null);
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-base sm:text-lg font-semibold">Repositories</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Register the frontend, backend, or other repositories that make up this project.
          </p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => { resetForm(); setError(null); setIsAddOpen(true); }}>
          <Plus className="h-4 w-4" />
          Add Repository
        </Button>
      </div>

      {error && !isAddOpen && (
        <div className="mb-4 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : repos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <GitBranch className="h-12 w-12 mb-4 opacity-30" />
          <p className="text-sm">No repositories registered yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {repos.map((repo) => (
            <Card key={repo.id} className="group relative hover:border-primary/50 transition-all">
              <CardContent className="p-4">
                {!repo.isPrimary && (
                  <button
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={() => setRepoToDelete(repo)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <GitBranch className="h-4 w-4 text-muted-foreground shrink-0" />
                  <p className="font-medium text-sm truncate">{repo.name}</p>
                  {repo.isPrimary && <Star className="h-3.5 w-3.5 text-amber-400 shrink-0" fill="currentColor" />}
                </div>
                <Badge variant="outline" className={roleBadgeClass[repo.role] || roleBadgeClass.custom}>
                  {ROLE_OPTIONS.find((r) => r.value === repo.role)?.label || repo.role}
                </Badge>
                <p className="text-xs text-muted-foreground mt-3 truncate">{repo.githubUrl}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span>{repo.defaultBranch}</span>
                  {repo.hasToken && (
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" /> Token set
                    </span>
                  )}
                </div>
                {!repo.isPrimary && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 h-7 text-xs gap-1.5 w-full"
                    onClick={() => handleSync(repo)}
                    disabled={syncingId === repo.id}
                  >
                    {syncingId === repo.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3" />
                    )}
                    Sync AI Context
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
          <Card
            className="border-dashed hover:border-primary/50 transition-all cursor-pointer"
            onClick={() => { resetForm(); setError(null); setIsAddOpen(true); }}
          >
            <CardContent className="p-4 h-full flex flex-col items-center justify-center text-muted-foreground min-h-30">
              <Plus className="h-8 w-8 mb-2" />
              <span className="text-sm">Add Repository</span>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add repository dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Repository</DialogTitle>
            <DialogDescription>
              Register another repository that belongs to this project (e.g. a separate backend or mobile repo).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="repo-name">Name</Label>
              <Input
                id="repo-name"
                placeholder="e.g. backend"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="repo-role">Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
                <SelectTrigger id="repo-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="repo-url">GitHub URL</Label>
              <Input
                id="repo-url"
                placeholder="https://github.com/org/repo"
                value={form.githubUrl}
                onChange={(e) => setForm((f) => ({ ...f, githubUrl: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="repo-token">GitHub Token (optional)</Label>
              <Input
                id="repo-token"
                type="password"
                placeholder="Personal access token"
                value={form.githubToken}
                onChange={(e) => setForm((f) => ({ ...f, githubToken: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="repo-local-path">Local Path (optional)</Label>
              <Input
                id="repo-local-path"
                placeholder="/Users/you/code/repo"
                value={form.localPath}
                onChange={(e) => setForm((f) => ({ ...f, localPath: e.target.value }))}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Repository"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!repoToDelete} onOpenChange={(open) => !open && setRepoToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove repository?</DialogTitle>
            <DialogDescription>
              This removes "{repoToDelete?.name}" from the project. This does not delete the actual GitHub repository.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRepoToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
