"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Github,
  FolderOpen,
  RefreshCw,
  GitPullRequest,
  Sparkles,
  Lightbulb,
  Code,
  Bug,
  FileText,
  Check,
  Plus,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Project } from "@/lib/types";
import type { PullRequest, PRReview } from "@/lib/ai-client";
import type { ProjectHealth } from "@/lib/ai-service";

interface AISidebarProps {
  project: Project;
  mode: "chat" | "agent";
  githubUrl: string;
  repoSnapshot: { repoName: string; fileTree: string[]; lastSyncedAt: string } | null;
  isSyncing: boolean;
  syncError: string | null;
  health: ProjectHealth | null;
  pullRequests: PullRequest[] | null;
  prsLoading: boolean;
  reviewingPR: number | null;
  prReviews: Record<number, PRReview>;
  onGithubUrlChange: (url: string) => void;
  onSync: () => void;
  onLoadPRs: () => void;
  onReviewPR: (prNumber: number) => void;
  onQuickAction: (prompt: string) => void;
  onSetInput: (value: string) => void;
}

const chatPrompts = [
  "Summarize the current project status",
  "What tasks are high priority?",
  "Suggest improvements for the architecture",
  "Generate a progress report",
];

const agentPrompts = [
  "Add error handling to all API calls",
  "Add loading states to the main page",
  "Fix TypeScript errors in the codebase",
  "Add input validation to forms",
];

export function AISidebar({
  project,
  mode,
  githubUrl,
  repoSnapshot,
  isSyncing,
  syncError,
  health,
  pullRequests,
  prsLoading,
  reviewingPR,
  prReviews,
  onGithubUrlChange,
  onSync,
  onLoadPRs,
  onReviewPR,
  onQuickAction,
  onSetInput,
}: AISidebarProps) {
  const suggestions = mode === "chat" ? chatPrompts : agentPrompts;

  return (
    <div className="w-64 space-y-3 shrink-0 hidden lg:flex lg:flex-col overflow-y-auto">
      {/* GitHub Repository */}
      <Card>
        <CardHeader className="pb-2 pt-3 px-3">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <Github className="h-3 w-3" />
            Repository
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3 space-y-2">
          {repoSnapshot ? (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-green-500">
                <FolderOpen className="h-3.5 w-3.5 shrink-0" />
                <span className="font-medium truncate">{repoSnapshot.repoName}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {repoSnapshot.fileTree.length} files indexed
              </p>
              <p className="text-xs text-muted-foreground">
                Synced {new Date(repoSnapshot.lastSyncedAt).toLocaleDateString()}
              </p>
              <div className="flex gap-1.5">
                <Input
                  value={githubUrl}
                  onChange={(e) => onGithubUrlChange(e.target.value)}
                  placeholder="github.com/owner/repo"
                  className="h-7 text-xs"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 shrink-0"
                  onClick={onSync}
                  disabled={isSyncing}
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")} />
                </Button>
              </div>
              {syncError && <p className="text-xs text-destructive">{syncError}</p>}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Connect a GitHub repo to give the AI access to your codebase.
              </p>
              <Input
                value={githubUrl}
                onChange={(e) => onGithubUrlChange(e.target.value)}
                placeholder="https://github.com/owner/repo"
                className="h-7 text-xs"
              />
              <Button
                size="sm"
                className="w-full h-7 text-xs"
                onClick={onSync}
                disabled={isSyncing || !githubUrl.trim()}
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" />Syncing...
                  </>
                ) : (
                  <>
                    <Github className="h-3.5 w-3.5 mr-1" />Connect & Sync
                  </>
                )}
              </Button>
              {syncError && <p className="text-xs text-destructive">{syncError}</p>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pull Requests */}
      {repoSnapshot && (
        <Card>
          <CardHeader className="pb-2 pt-3 px-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <GitPullRequest className="h-3 w-3" />Pull Requests
              </CardTitle>
              <button
                onClick={onLoadPRs}
                disabled={prsLoading}
                className="text-xs text-primary hover:underline disabled:opacity-50"
              >
                {prsLoading ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : pullRequests === null ? (
                  "Load"
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
              </button>
            </div>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            {pullRequests === null ? (
              <p className="text-xs text-muted-foreground">Click Load to fetch open PRs</p>
            ) : pullRequests.length === 0 ? (
              <p className="text-xs text-muted-foreground">No open pull requests</p>
            ) : (
              <div className="space-y-2">
                {pullRequests.map((pr) => (
                  <div key={pr.number} className="rounded-md border bg-secondary/20 p-2 space-y-1">
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{pr.title}</p>
                        <p className="text-xs text-muted-foreground">
                          #{pr.number} · {pr.author}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-xs text-green-400 flex items-center gap-0.5">
                          <Plus className="h-2.5 w-2.5" />{pr.additions}
                        </span>
                        <span className="text-xs text-red-400 flex items-center gap-0.5">
                          <Minus className="h-2.5 w-2.5" />{pr.deletions}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full h-6 text-xs"
                      onClick={() => onReviewPR(pr.number)}
                      disabled={reviewingPR === pr.number}
                    >
                      {reviewingPR === pr.number ? (
                        <>
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />Reviewing...
                        </>
                      ) : prReviews[pr.number] ? (
                        <>
                          <Check className="h-3 w-3 mr-1 text-green-400" />View Review
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3 w-3 mr-1" />AI Review
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Project Health Score */}
      {health && (
        <Card>
          <CardHeader className="pb-2 pt-3 px-3">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Sparkles className="h-3 w-3" />Project Health
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 space-y-2">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "text-2xl font-bold",
                  health.status === "healthy"
                    ? "text-green-400"
                    : health.status === "warning"
                      ? "text-yellow-400"
                      : "text-red-400",
                )}
              >
                {health.score}
              </div>
              <div>
                <div
                  className={cn(
                    "text-xs font-medium capitalize",
                    health.status === "healthy"
                      ? "text-green-400"
                      : health.status === "warning"
                        ? "text-yellow-400"
                        : "text-red-400",
                  )}
                >
                  {health.status}
                </div>
                <div className="text-xs text-muted-foreground">
                  {health.stats.completionRate}% done
                </div>
              </div>
            </div>
            {health.flags.length > 0 && (
              <div className="space-y-1">
                {health.flags.map((flag, i) => (
                  <div key={i} className="flex items-start gap-1 text-xs text-yellow-400">
                    <span className="shrink-0 mt-0.5">⚠</span>{flag}
                  </div>
                ))}
              </div>
            )}
            {health.stats.overdueTasks > 0 && (
              <div className="text-xs text-red-400 font-medium">
                {health.stats.overdueTasks} overdue
              </div>
            )}
            {health.recommendations.length > 0 && (
              <button
                className="text-xs text-primary hover:underline text-left"
                onClick={() =>
                  onQuickAction(
                    `My project health score is ${health.score}/100 with these flags: ${health.flags.join(", ")}. Give me specific actionable steps to improve it.`,
                  )
                }
              >
                Get recommendations →
              </button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Project context */}
      <Card>
        <CardHeader className="pb-2 pt-3 px-3">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Project Context
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Phase</span>
            <Badge variant="outline" className="text-xs">{project.phase}</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tasks</span>
            <span>{project.tasks.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Progress</span>
            <span>{project.progress}%</span>
          </div>
          {health && health.stats.overdueTasks > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Overdue</span>
              <span className="text-red-400 font-medium">{health.stats.overdueTasks}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suggested prompts */}
      <Card>
        <CardHeader className="pb-2 pt-3 px-3">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <Lightbulb className="h-3 w-3" />
            {mode === "agent" ? "Agent Tasks" : "Suggestions"}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3 space-y-1">
          {suggestions.map((prompt, i) => (
            <button
              key={i}
              onClick={() => onSetInput(prompt)}
              className="w-full text-left p-2 rounded-md bg-secondary/50 hover:bg-secondary text-xs text-foreground transition-colors"
            >
              {prompt}
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Capabilities */}
      <Card>
        <CardHeader className="pb-2 pt-3 px-3">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {mode === "agent" ? "Agent can" : "Capabilities"}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3 space-y-2">
          {mode === "agent"
            ? [
                { icon: Code, label: "Edit existing files" },
                { icon: FileText, label: "Create new files" },
                { icon: Bug, label: "Fix bugs in code" },
                { icon: Github, label: "Push to GitHub" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Icon className="h-3.5 w-3.5 text-violet-400" />
                  {label}
                </div>
              ))
            : [
                { icon: Code, label: "Code help" },
                { icon: Bug, label: "Debug issues" },
                { icon: FileText, label: "Documentation" },
                { icon: Lightbulb, label: "Suggestions" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  {label}
                </div>
              ))}
        </CardContent>
      </Card>
    </div>
  );
}
