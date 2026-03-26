"use client"

import { useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
  Filter,
  MoreHorizontal,
  Copy,
  ExternalLink,
  Check,
  X,
  Plus,
  RefreshCw,
} from "lucide-react"
import { gitCommits, gitBranches, teamMembers } from "@/lib/mock-data"
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

const mockPullRequests = [
  {
    id: "pr1",
    title: "feat: implement user authentication flow",
    number: 42,
    status: "open",
    author: teamMembers[3],
    branch: "feature/auth",
    targetBranch: "main",
    createdAt: "2026-03-26T08:00:00",
    reviewers: [teamMembers[0], teamMembers[1]],
    comments: 5,
    additions: 245,
    deletions: 12,
  },
  {
    id: "pr2",
    title: "fix: resolve dashboard rendering issue",
    number: 41,
    status: "merged",
    author: teamMembers[0],
    branch: "hotfix/dashboard",
    targetBranch: "main",
    createdAt: "2026-03-25T14:00:00",
    reviewers: [teamMembers[3]],
    comments: 3,
    additions: 18,
    deletions: 42,
  },
  {
    id: "pr3",
    title: "docs: update API documentation",
    number: 40,
    status: "review",
    author: teamMembers[4],
    branch: "docs/api",
    targetBranch: "main",
    createdAt: "2026-03-25T10:00:00",
    reviewers: [teamMembers[0], teamMembers[1]],
    comments: 2,
    additions: 156,
    deletions: 23,
  },
]

const prStatusColors = {
  open: "bg-success/20 text-success",
  merged: "bg-primary/20 text-primary",
  closed: "bg-destructive/20 text-destructive",
  review: "bg-warning/20 text-warning",
}

export default function GitPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [branchFilter, setBranchFilter] = useState<string>("all")
  const [copiedHash, setCopiedHash] = useState<string | null>(null)

  const copyToClipboard = (hash: string) => {
    navigator.clipboard.writeText(hash)
    setCopiedHash(hash)
    setTimeout(() => setCopiedHash(null), 2000)
  }

  const filteredCommits = gitCommits.filter((commit) => {
    const matchesSearch =
      commit.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      commit.hash.includes(searchQuery.toLowerCase())
    const matchesBranch = branchFilter === "all" || commit.branch === branchFilter
    return matchesSearch && matchesBranch
  })

  return (
    <MainLayout breadcrumb={["Development", "Git"]}>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Commits</p>
                  <p className="text-2xl font-semibold text-foreground">{gitCommits.length}</p>
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
                  <p className="text-2xl font-semibold text-foreground">{gitBranches.length}</p>
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
                  <p className="text-2xl font-semibold text-foreground">
                    {mockPullRequests.filter((pr) => pr.status === "open").length}
                  </p>
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
                  <p className="text-2xl font-semibold text-foreground">2</p>
                </div>
                <GitMerge className="h-8 w-8 text-chart-4 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="commits" className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList className="bg-secondary">
              <TabsTrigger value="commits">Commits</TabsTrigger>
              <TabsTrigger value="branches">Branches</TabsTrigger>
              <TabsTrigger value="pull-requests">Pull Requests</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync
              </Button>
              <Button size="sm">
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
              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger className="w-40">
                  <GitBranch className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {gitBranches.map((branch) => (
                    <SelectItem key={branch.name} value={branch.name}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {filteredCommits.map((commit) => (
                    <div
                      key={commit.id}
                      className="flex items-start gap-4 p-4 hover:bg-secondary/30 transition-colors"
                    >
                      <div className="mt-1">
                        <GitCommit className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">{commit.message}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
                          <button
                            onClick={() => copyToClipboard(commit.hash)}
                            className="flex items-center gap-1 px-2 py-0.5 rounded bg-secondary font-mono text-xs hover:bg-secondary/80 transition-colors"
                          >
                            {copiedHash === commit.hash ? (
                              <Check className="h-3 w-3 text-success" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                            {commit.hash}
                          </button>
                          <Badge variant="outline" className="text-xs">
                            <GitBranch className="h-3 w-3 mr-1" />
                            {commit.branch}
                          </Badge>
                          <span className="text-success">+{commit.additions}</span>
                          <span className="text-destructive">-{commit.deletions}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="bg-secondary text-foreground text-[8px]">
                              {commit.author.name.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-muted-foreground">{commit.author.name}</span>
                          <span className="text-sm text-muted-foreground">
                            committed {formatTimeAgo(commit.timestamp)}
                          </span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy SHA
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View on GitHub
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <GitBranch className="h-4 w-4 mr-2" />
                            Create Branch
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Branches Tab */}
          <TabsContent value="branches" className="space-y-4">
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {gitBranches.map((branch) => (
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
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <Avatar className="h-4 w-4">
                              <AvatarFallback className="bg-secondary text-foreground text-[6px]">
                                {branch.author.name.split(" ").map((n) => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <span>{branch.author.name}</span>
                            <span>updated {formatTimeAgo(branch.lastCommit)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
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
                            <DropdownMenuItem>View commits</DropdownMenuItem>
                            <DropdownMenuItem>Compare</DropdownMenuItem>
                            {!branch.isDefault && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive">
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pull Requests Tab */}
          <TabsContent value="pull-requests" className="space-y-4">
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {mockPullRequests.map((pr) => (
                    <div
                      key={pr.id}
                      className="flex items-start gap-4 p-4 hover:bg-secondary/30 transition-colors"
                    >
                      <div className="mt-1">
                        {pr.status === "merged" ? (
                          <GitMerge className="h-5 w-5 text-primary" />
                        ) : (
                          <GitPullRequest className={cn(
                            "h-5 w-5",
                            pr.status === "open" && "text-success",
                            pr.status === "closed" && "text-destructive",
                            pr.status === "review" && "text-warning"
                          )} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-foreground">{pr.title}</p>
                          <Badge className={cn("text-xs", prStatusColors[pr.status])}>
                            {pr.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          #{pr.number} opened by {pr.author.name} {formatTimeAgo(pr.createdAt)}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <GitBranch className="h-3 w-3" />
                            {pr.branch} &rarr; {pr.targetBranch}
                          </span>
                          <span className="text-success">+{pr.additions}</span>
                          <span className="text-destructive">-{pr.deletions}</span>
                          <span>{pr.comments} comments</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-muted-foreground">Reviewers:</span>
                          <div className="flex -space-x-1">
                            {pr.reviewers.map((reviewer) => (
                              <Avatar key={reviewer.id} className="h-5 w-5 border border-card">
                                <AvatarFallback className="bg-secondary text-foreground text-[8px]">
                                  {reviewer.name.split(" ").map((n) => n[0]).join("")}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {pr.status === "open" && (
                          <Button size="sm">
                            <Check className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}
