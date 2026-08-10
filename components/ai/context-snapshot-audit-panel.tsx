"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, History, GitBranch, FileText } from "lucide-react";
import { aiClient, type ContextSnapshot } from "@/lib/ai-client";

const riskBadgeClass: Record<string, string> = {
  LOW: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  MEDIUM: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  HIGH: "bg-orange-500/10 text-orange-500 border-orange-500/30",
  CRITICAL: "bg-rose-500/10 text-rose-500 border-rose-500/30",
};

interface ContextSnapshotAuditPanelProps {
  projectId: string;
}

export function ContextSnapshotAuditPanel({ projectId }: ContextSnapshotAuditPanelProps) {
  const [snapshots, setSnapshots] = useState<ContextSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    aiClient
      .getContextSnapshots(projectId)
      .then((data) => { if (!cancelled) setSnapshots(data); })
      .catch((err) => { if (!cancelled) setError(err.message || "Failed to load context history"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  if (snapshots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
        <History className="h-10 w-10 mb-3 opacity-30" />
        <p className="text-sm">No AI agent runs recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {snapshots.map((snap) => (
        <Card key={snap.id} className="hover:border-primary/50 transition-all">
          <CardContent className="p-3">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm flex-1 min-w-0 truncate">{snap.userMessage}</p>
              <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                {new Date(snap.createdAt).toLocaleString("en-US", {
                  month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                })}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {snap.taskType && <Badge variant="outline" className="text-[10px]">{snap.taskType}</Badge>}
              {snap.risk && (
                <Badge variant="outline" className={`text-[10px] ${riskBadgeClass[snap.risk] || ""}`}>
                  {snap.risk} risk
                </Badge>
              )}
              {snap.repoName && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <GitBranch className="h-3 w-3" /> {snap.repoName}
                  {!snap.repositoryId && " (primary)"}
                </span>
              )}
              {snap.keyFilesUsed && snap.keyFilesUsed.length > 0 && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <FileText className="h-3 w-3" /> {snap.keyFilesUsed.length} files in context
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
