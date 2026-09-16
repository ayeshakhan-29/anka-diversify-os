"use client";

import { useState } from "react";
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
  healthLoading: boolean;
  healthError: string | null;
  pullRequests: PullRequest[] | null;
  prsLoading: boolean;
  prsError: string | null;
  reviewingPR: number | null;
  prReviews: Record<number, PRReview>;
  prDescriptions: Record<number, { title: string; description: string }>;
  generatingDescription: number | null;
  onGithubUrlChange: (url: string) => void;
  onSync: () => void;
  onLoadPRs: () => void;
  onReviewPR: (prNumber: number) => void;
  onGeneratePRDescription: (prNumber: number) => void;
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
  healthLoading,
  healthError,
  pullRequests,
  prsLoading,
  prsError,
  reviewingPR,
  prReviews,
  prDescriptions,
  generatingDescription,
  onGithubUrlChange,
  onSync,
  onLoadPRs,
  onReviewPR,
  onGeneratePRDescription,
  onQuickAction,
  onSetInput,
}: AISidebarProps) {
  const suggestions = mode === "chat" ? chatPrompts : agentPrompts;
  const [showRecommendations, setShowRecommendations] = useState(false);

  const relativeTime = (timestamp: string) => {
    const days = Math.max(0, Math.floor((Date.now() - new Date(timestamp).getTime()) / 86_400_000));
    if (days === 0) return "today";
    if (days === 1) return "1 day ago";
    if (days < 14) return `${days} days ago`;
    if (days < 60) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

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
              <div className="flex items-center gap-1.5 text-xs text-green-700">
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
                  "Refresh"
                )}
              </button>
            </div>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            {prsLoading ? (
              <p className="text-xs text-muted-foreground">Loading pull requests…</p>
            ) : prsError ? (
              <p className="text-xs text-destructive">Unable to load pull requests</p>
            ) : pullRequests === null ? (
              <p className="text-xs text-muted-foreground">Load open pull requests</p>
            ) : pullRequests.length === 0 ? (
              <p className="text-xs text-muted-foreground">No open pull requests</p>
            ) : (
              <div className="space-y-2">
                {pullRequests.map((pr) => (
                  <div key={pr.number} className="rounded-md border bg-secondary/20 p-2 space-y-1">
                    <div className="min-w-0">
                      <a href={pr.url} target="_blank" rel="noreferrer" className="text-xs font-medium hover:underline line-clamp-2">
                        #{pr.number} {pr.title}
                      </a>
                      <p className="text-xs text-muted-foreground truncate">
                        {pr.headBranch} → {pr.baseBranch}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {pr.author || "Unknown author"} · updated {relativeTime(pr.updatedAt)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-6 text-xs"
                        onClick={() => onReviewPR(pr.number)}
                        disabled={reviewingPR === pr.number}
                      >
                        {reviewingPR === pr.number ? (
                          <><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Reviewing...</>
                        ) : prReviews[pr.number] ? (
                          <><Check className="h-3 w-3 mr-1 text-green-400" />View Review</>
                        ) : (
                          <><Sparkles className="h-3 w-3 mr-1" />AI Review</>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-6 text-xs"
                        onClick={() => onGeneratePRDescription(pr.number)}
                        disabled={generatingDescription === pr.number}
                      >
                        {generatingDescription === pr.number ? (
                          <><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Writing...</>
                        ) : (
                          <><FileText className="h-3 w-3 mr-1" />Description</>
                        )}
                      </Button>
                    </div>
                    {prDescriptions[pr.number] && (
                      <div className="mt-1 rounded border bg-background p-2 space-y-1">
                        <p className="text-xs font-medium truncate">{prDescriptions[pr.number].title}</p>
                        <button
                          className="text-xs text-primary hover:underline"
                          onClick={() => navigator.clipboard.writeText(
                            `## ${prDescriptions[pr.number].title}\n\n${prDescriptions[pr.number].description}`
                          )}
                        >
                          Copy markdown
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Standup Digest */}
      {mode === "chat" && (
        <Card>
          <CardHeader className="pb-2 pt-3 px-3">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <FileText className="h-3 w-3" />Standup Digest
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 space-y-2">
            <p className="text-xs text-muted-foreground">Generate a daily summary of what's done, in progress, and blocked.</p>
            <Button
              size="sm"
              variant="outline"
              className="w-full h-7 text-xs"
              onClick={() => onQuickAction(
                "Generate a standup digest: list tasks completed recently, tasks currently in progress with their assignees, any blocked tasks, and flag anything overdue. Format it as a clean daily standup report."
              )}
            >
              <RefreshCw className="h-3 w-3 mr-1" />Generate Standup
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="w-full h-7 text-xs"
              onClick={() => onQuickAction(
                "Write a brief weekly progress report for this project: what was accomplished, what is in flight, what risks or blockers exist, and what is planned next week."
              )}
            >
              <Sparkles className="h-3 w-3 mr-1" />Weekly Report
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Project Health Score */}
      <Card>
        <CardHeader className="pb-2 pt-3 px-3">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <Sparkles className="h-3 w-3" />Project Health
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3 space-y-2">
          {healthLoading ? (
            <p className="text-xs text-muted-foreground">Calculating project health…</p>
          ) : healthError || !health ? (
            <p className="text-xs text-destructive">Unable to calculate project health</p>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "text-2xl font-bold",
                    health.status === "HEALTHY"
                      ? "text-green-400"
                      : health.status === "FAIR" || health.status === "WARNING"
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
                      health.status === "HEALTHY"
                        ? "text-green-400"
                        : health.status === "FAIR" || health.status === "WARNING"
                          ? "text-yellow-400"
                          : "text-red-400",
                    )}
                  >
                    {health.status.replace("_", " ").toLowerCase()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {health.progress.percent === null ? "No tasks yet" : `${health.progress.percent}% done`}
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {health.activity.daysSinceActivity === null || !health.activity.lastActivityAt
                  ? "No activity recorded"
                  : health.activity.daysSinceActivity === 0
                    ? "Active today"
                    : `Last activity ${relativeTime(health.activity.lastActivityAt)}`}
              </p>
              {health.blockers.count > 0 && (
                <div className="text-xs text-yellow-400 font-medium">
                  {health.blockers.count} blocked
                </div>
              )}
              {health.overdue.count > 0 && (
                <div className="text-xs text-red-400 font-medium">
                  {health.overdue.count} overdue
                </div>
              )}
              {health.recommendations.length > 0 && (
                <div className="space-y-1">
                  <button
                    className="text-xs text-primary hover:underline text-left"
                    onClick={() => setShowRecommendations((shown) => !shown)}
                  >
                    {showRecommendations ? "Hide recommendations" : "Get recommendations →"}
                  </button>
                  {showRecommendations && health.recommendations.map((recommendation) => (
                    <p key={recommendation.code} className="text-xs text-muted-foreground">
                      {recommendation.message}
                    </p>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

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
          {health && health.overdue.count > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Overdue</span>
              <span className="text-red-400 font-medium">{health.overdue.count}</span>
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
