"use client";

import {
  GitPullRequest,
  X,
  ShieldAlert,
  ThumbsUp,
  MessageCircle,
  Lightbulb,
  ExternalLink,
  Plus,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PullRequest, PRReview } from "@/lib/ai-client";

interface PRReviewPanelProps {
  review: PRReview;
  prNumber: number;
  pr: PullRequest | undefined;
  onClose: () => void;
}

export function PRReviewPanel({ review, prNumber, pr, onClose }: PRReviewPanelProps) {
  const verdictColor =
    review.verdict === "approve"
      ? "green"
      : review.verdict === "request_changes"
        ? "red"
        : "yellow";
  const VerdictIcon =
    review.verdict === "approve"
      ? ThumbsUp
      : review.verdict === "request_changes"
        ? ShieldAlert
        : MessageCircle;

  return (
    <div className="border border-white/10 rounded-lg overflow-hidden bg-secondary/20">
      <div className="flex items-center justify-between px-4 py-3 bg-secondary/30 border-b border-white/10">
        <div className="flex items-center gap-2">
          <GitPullRequest className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium truncate">
            PR #{prNumber}{pr ? `: ${pr.title}` : ""}
          </span>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground shrink-0">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className={cn("text-2xl font-bold", `text-${verdictColor}-400`)}>
            {review.qualityScore}
          </div>
          <div className={cn("flex items-center gap-1.5 text-sm font-medium", `text-${verdictColor}-400`)}>
            <VerdictIcon className="h-4 w-4" />
            {review.verdict === "approve"
              ? "Approve"
              : review.verdict === "request_changes"
                ? "Request Changes"
                : "Needs Discussion"}
          </div>
          {pr && (
            <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
              <span className="text-green-400 flex items-center gap-0.5">
                <Plus className="h-3 w-3" />{pr.additions}
              </span>
              <span className="text-red-400 flex items-center gap-0.5">
                <Minus className="h-3 w-3" />{pr.deletions}
              </span>
              <span>{pr.changedFiles} files</span>
              <a href={pr.url} target="_blank" rel="noreferrer" className="hover:text-foreground">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}
        </div>

        <p className="text-sm text-muted-foreground">{review.summary}</p>

        {review.risks.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-red-400 uppercase tracking-wide">Risks</p>
            {review.risks.map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-red-300">
                <ShieldAlert className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                {r}
              </div>
            ))}
          </div>
        )}

        {review.suggestions.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-yellow-400 uppercase tracking-wide">
              Suggestions
            </p>
            {review.suggestions.map((s, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-yellow-300">
                <Lightbulb className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                {s}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
