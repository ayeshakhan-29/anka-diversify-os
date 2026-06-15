"use client"

import { useState, useEffect, useCallback } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  GitBranch,
  GitCommit,
  GitMerge,
  GitPullRequest,
  Search,
  MoreHorizontal,
  Copy,
  ExternalLink,
  Check,
  Plus,
  RefreshCw,
  Lock,
  Loader2,
  FolderGit2,
} from "lucide-react"
import { projectApi } from "@/lib/project-api"
import type { Project, GitCommitItem, GitBranchItem, GitPullItem } from "@/lib/types"
import { cn } from "@/lib/utils"

function formatTimeAgo(timestamp: string) {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return "Just now"
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}

function isToday(timestamp: string) {
  const d = new Date(timestamp)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
}

const prStatusColors: Record<string, string> = {
  open: "bg-success/20 text-success",
  merged: "bg-primary/20 text-primary",
  closed: "bg-destructive/20 text-destructive",
}

export default function GitPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  const [commits, setCommits] = useState<GitCommitItem[]>([])
  const [branches, setBranches] = useState<GitBranchItem[]>([])
  const [pulls, setPulls] = useState<GitPullItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [branchFilter, setBranchFilter] = useState("all")
  const [copiedSha, setCopiedSha] = useState<string | null>(null)

  useEffect(() => {
    projectApi.getAll().then((all) => {
      const withGit = all.filter((p) => p.githubUrl)
      setProjects(withGit)
      if (withGit.length > 0) setSelectedProjectId(withGit[0].id)
    }).catch(() => {})
  }, [])

  const fetchGitData = useCallback(async (projectId: string) => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      const [c, b, p] = await Promise.all([
        projectApi.getGitCommits(projectId),
        projectApi.getGitBranches(projectId),
        projectApi.getGitPulls(projectId),
      ])
      setCommits(c)
      setBranches(b)
      setPulls(p)
      setBranchFilter("all")
    } catch (e: any) {
      setError(e.message || "Failed to load git data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedProjectId) fetchGitData(selectedProjectId)
  }, [selectedProjectId, fetchGitData])

  const handleCommitsForBranch = async (branch: string) => {
    setBranchFilter(branch)
    if (!selectedProjectId) return
    setLoading(true)
    try {
      const c = await projectApi.getGitCommits(selectedProjectId, branch === "all" ? undefined : branch)
      setCommits(c)
    } catch {}
    finally { setLoading(false) }
  }

  const copyToClipboard = (sha: string) => {
    navigator.clipboard.writeText(sha)
    setCopiedSha(sha)
    setTimeout(() => setCopiedSha(null), 2000)
  }

  const filteredCommits = commits.filter((c) =>
    c.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.shortSha.includes(searchQuery.toLowerCase()) ||
    c.authorName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const openPRs = pulls.filter((p) => p.state === "open").length
  const mergedToday = pulls.filter((p) => p.state === "merged" && isToday(p.mergedAt || p.updatedAt)).length
  const selectedProject = projects.find((p) => p.id === selectedProjectId)

  return (
    <MainLayout breadcrumb={["Development", "Git"]}>
      <div className="space-y-6">

        {/* Project selector */}
        <div className="flex items-center gap-3">
          <FolderGit2 className="h-5 w-5 text-muted-foreground shrink-0" />
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No projects with a GitHub URL configured. Add one in project settings.
            </p>
          ) : (
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a project…" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {selectedProject?.githubUrl && (
            <a
              href={selectedProject.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {selectedProject.githubUrl.replace("https://github.com/", "")}
            </a>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Commits</p>
                  <p className="text-2xl font-semibold">{loading ? "—" : commits.length}</p>
                </div>
                <GitCommit className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Branches</p>
                  <p className="text-2xl font-semibold">{loading ? "—" : branches.length}</p>
                </div>
                <GitBranch className="h-8 w-8 text-accent opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Open PRs</p>
                  <p className="text-2xl font-semibold">{loading ? "—" : openPRs}</p>
                </div>
                <GitPullRequest className="h-8 w-8 text-success opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Merged Today</p>
                  <p className="text-2xl font-semibold">{loading ? "—" : mergedToday}</p>
                </div>
                <GitMerge className="h-8 w-8 text-chart-4 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="commits" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <TabsList className="bg-secondary">
              <TabsTrigger value="commits">Commits</TabsTrigger>
              <TabsTrigger value="branches">Branches</TabsTrigger>
              <TabsTrigger value="pull-requests">Pull Requests</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none"
                onClick={() => fetchGitData(selectedProjectId)}
                disabled={loading || !selectedProjectId}
              >
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Sync
              </Button>
              <Button
                size="sm"
                className="flex-1 sm:flex-none"
                onClick={() => selectedProject?.githubUrl && window.open(selectedProject.githubUrl + "/compare", "_blank")}
                disabled={!selectedProject?.githubUrl}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Branch
              </Button>
            </div>
          </div>

          {/* Commits Tab */}
          <TabsContent value="commits" className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search commits..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={branchFilter} onValueChange={handleCommitsForBranch}>
                <SelectTrigger className="w-44">
                  <GitBranch className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.name} value={b.name}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Card className="bg-card border-border">
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading commits…</span>
                  </div>
                ) : filteredCommits.length === 0 ? (
                  <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
                    No commits found.
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredCommits.map((commit) => (
                      <div
                        key={commit.sha}
                        className="flex items-start gap-4 p-4 hover:bg-secondary/30 transition-colors"
                      >
                        <div className="mt-1">
                          <GitCommit className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{commit.message}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
                            <button
                              onClick={() => copyToClipboard(commit.sha)}
                              className="flex items-center gap-1 px-2 py-0.5 rounded bg-secondary font-mono text-xs hover:bg-secondary/80 transition-colors"
                            >
                              {copiedSha === commit.sha ? (
                                <Check className="h-3 w-3 text-success" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                              {commit.shortSha}
                            </button>
                            {commit.branch && (
                              <Badge variant="outline" className="text-xs">
                                <GitBranch className="h-3 w-3 mr-1" />
                                {commit.branch}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Avatar className="h-5 w-5">
                              {commit.authorAvatar && <AvatarImage src={commit.authorAvatar} />}
                              <AvatarFallback className="bg-secondary text-foreground text-[8px]">
                                {commit.authorName.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">{commit.authorName}</span>
                            <span className="text-sm text-muted-foreground">
                              committed {formatTimeAgo(commit.timestamp)}
                            </span>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => copyToClipboard(commit.sha)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy SHA
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.open(commit.url, "_blank")}>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View on GitHub
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Branches Tab */}
          <TabsContent value="branches" className="space-y-4">
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading branches…</span>
                  </div>
                ) : branches.length === 0 ? (
                  <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
                    No branches found.
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {branches.map((branch) => (
                      <div
                        key={branch.name}
                        className="flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <GitBranch className={cn(
                            "h-5 w-5",
                            branch.isDefault ? "text-primary" : "text-muted-foreground"
                          )} />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground">{branch.name}</p>
                              {branch.isDefault && (
                                <Badge className="bg-primary/20 text-primary text-xs">default</Badge>
                              )}
                              {branch.protected && (
                                <Badge variant="outline" className="text-xs gap-1">
                                  <Lock className="h-3 w-3" />protected
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground font-mono mt-0.5">{branch.commitSha}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`${selectedProject?.githubUrl}/compare/${branch.name}`, "_blank")}
                            disabled={!selectedProject?.githubUrl}
                          >
                            <GitPullRequest className="h-4 w-4 mr-2" />
                            Create PR
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => window.open(branch.url, "_blank")}>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View on GitHub
                              </DropdownMenuItem>
                              {!branch.isDefault && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => window.open(`${selectedProject?.githubUrl}/branch/${branch.name}`, "_blank")}
                                  >
                                    Delete branch
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pull Requests Tab */}
          <TabsContent value="pull-requests" className="space-y-4">
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading pull requests…</span>
                  </div>
                ) : pulls.length === 0 ? (
                  <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
                    No pull requests found.
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {pulls.map((pr) => (
                      <div
                        key={pr.number}
                        className="flex items-start gap-4 p-4 hover:bg-secondary/30 transition-colors"
                      >
                        <div className="mt-1">
                          {pr.state === "merged" ? (
                            <GitMerge className="h-5 w-5 text-primary" />
                          ) : (
                            <GitPullRequest className={cn(
                              "h-5 w-5",
                              pr.state === "open" && "text-success",
                              pr.state === "closed" && "text-destructive",
                            )} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="font-medium text-foreground">{pr.title}</p>
                            <Badge className={cn("text-xs", prStatusColors[pr.state] ?? "bg-muted text-muted-foreground")}>
                              {pr.state}
                            </Badge>
                            {pr.draft && <Badge variant="outline" className="text-xs">Draft</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            #{pr.number} opened by {pr.author} {formatTimeAgo(pr.createdAt)}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <GitBranch className="h-3 w-3" />
                              {pr.headBranch} &rarr; {pr.baseBranch}
                            </span>
                            {pr.additions > 0 && <span className="text-success">+{pr.additions}</span>}
                            {pr.deletions > 0 && <span className="text-destructive">-{pr.deletions}</span>}
                            {pr.labels.length > 0 && pr.labels.map((l) => (
                              <Badge key={l} variant="outline" className="text-xs">{l}</Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(pr.url, "_blank")}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}
