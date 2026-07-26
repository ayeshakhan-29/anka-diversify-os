"use client";

import { useCallback, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, MessageSquareWarning, FileText, History, Sparkles, Wand2, Coins } from "lucide-react";
import { projectApi } from "@/lib/project-api";
import type { WorkflowPhase, ProjectPhaseState, PhaseArtifact, PhaseApproval, WorkflowRun } from "@/lib/types";

const PHASE_LABELS: Record<WorkflowPhase, string> = {
  requirements: "Requirements",
  documentation: "Documentation",
  architecture: "Architecture",
  implementation: "Implementation",
  testing: "Testing",
  review: "Review",
};

interface PhaseDetailViewProps {
  projectId: string;
  phase: WorkflowPhase;
  onStatesChange?: (states: ProjectPhaseState[]) => void;
}

export function PhaseDetailView({ projectId, phase, onStatesChange }: PhaseDetailViewProps) {
  const [phaseState, setPhaseState] = useState<ProjectPhaseState | null>(null);
  const [artifacts, setArtifacts] = useState<PhaseArtifact[]>([]);
  const [approvals, setApprovals] = useState<PhaseApproval[]>([]);
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [lastRunCost, setLastRunCost] = useState<number | null>(null);

  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [comment, setComment] = useState("");

  const refresh = useCallback(async () => {
    const [states, phaseArtifacts, phaseApprovals, allRuns] = await Promise.all([
      projectApi.getPhaseStates(projectId),
      projectApi.getPhaseArtifacts(projectId, phase),
      projectApi.getPhaseApprovals(projectId, phase),
      projectApi.getWorkflowRuns(projectId),
    ]);
    setPhaseState(states.find((s) => s.phase === phase) || null);
    setArtifacts(phaseArtifacts);
    setApprovals(phaseApprovals);
    setRuns(allRuns.filter((r) => r.currentPhase === phase));
    onStatesChange?.(states);
  }, [projectId, phase, onStatesChange]);

  useEffect(() => {
    setLoading(true);
    refresh().finally(() => setLoading(false));
    setIsEditing(false);
    setComment("");
  }, [refresh]);

  const latestArtifact = artifacts[0];
  const status = phaseState?.status || "not_started";
  const isApproved = status === "approved" || status === "completed";

  const startEditing = () => {
    setDraftTitle(latestArtifact?.title || `${PHASE_LABELS[phase]} Proposal`);
    setDraftContent(latestArtifact?.content || "");
    setIsEditing(true);
  };

  const handleSaveDraft = async () => {
    if (!draftContent.trim()) return;
    setBusy(true);
    try {
      if (status === "not_started") {
        await projectApi.startPhase(projectId, phase);
      }
      await projectApi.createPhaseArtifact(projectId, {
        phase,
        type: `${phase}_doc`,
        title: draftTitle.trim() || `${PHASE_LABELS[phase]} Proposal`,
        content: draftContent,
      });
      setIsEditing(false);
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const handleGenerateWithAI = async () => {
    setGenerating(true);
    try {
      const { workflowRun } = await projectApi.runAutomatedPhase(projectId, phase);
      setLastRunCost(workflowRun.costUSD ?? null);
      setIsEditing(false);
      await refresh();
    } finally {
      setGenerating(false);
    }
  };

  const handleRequestApproval = async () => {
    setBusy(true);
    try {
      await projectApi.requestPhaseApproval(projectId, phase);
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const handleApprove = async () => {
    setBusy(true);
    try {
      await projectApi.approvePhase(projectId, phase, comment.trim() || undefined);
      setComment("");
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const handleRequestChanges = async () => {
    setBusy(true);
    try {
      await projectApi.requestPhaseChanges(projectId, phase, comment.trim() || undefined);
      setComment("");
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-40 w-full" />
        </div>
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 grid gap-4 lg:grid-cols-3">
      {/* Main content */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              {PHASE_LABELS[phase]}
              {phase === "architecture" && <span className="text-warning" title="Most important human gate">★</span>}
            </h2>
            <p className="text-sm text-muted-foreground">
              {phase === "architecture"
                ? "System design, components, data flow, tech decisions, and risks — approving this locks context for implementation."
                : `AI focus and human review for the ${PHASE_LABELS[phase].toLowerCase()} phase.`}
            </p>
          </div>
          <StatusBadge status={status} />
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {latestArtifact ? latestArtifact.title : `${PHASE_LABELS[phase]} Proposal`}
            </CardTitle>
            {!isEditing && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={handleGenerateWithAI}
                  disabled={isApproved || generating}
                >
                  <Wand2 className="h-3.5 w-3.5" />
                  {generating ? "Generating…" : "Generate with AI"}
                </Button>
                <Button variant="outline" size="sm" onClick={startEditing} disabled={isApproved || generating}>
                  {latestArtifact ? "Edit / New Version" : "Draft Proposal"}
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {lastRunCost !== null && !isEditing && (
              <p className="text-xs text-muted-foreground mb-3">
                Last AI generation cost ≈ ${lastRunCost.toFixed(4)}
              </p>
            )}
            {isEditing ? (
              <div className="space-y-3">
                <Input
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  placeholder="Proposal title"
                />
                <Textarea
                  value={draftContent}
                  onChange={(e) => setDraftContent(e.target.value)}
                  placeholder={`Write the ${PHASE_LABELS[phase].toLowerCase()} proposal in markdown — system overview, components, data flow, tech decisions, risks, diagrams (Mermaid supported as code fences).`}
                  rows={14}
                  className="font-mono text-sm"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} disabled={busy}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveDraft} disabled={busy || !draftContent.trim()}>
                    Save
                  </Button>
                </div>
              </div>
            ) : latestArtifact ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{latestArtifact.content}</ReactMarkdown>
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No {PHASE_LABELS[phase].toLowerCase()} proposal yet.</p>
                <p className="text-xs mt-1">Generate one with AI, or draft it yourself, to move this phase forward.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Approval actions */}
        {latestArtifact && !isEditing && !isApproved && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Review</CardTitle>
              <CardDescription>
                {status === "awaiting_approval"
                  ? "Waiting for approval — add a comment and approve, or send it back for changes."
                  : "Request approval once the proposal is ready for review."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {status === "awaiting_approval" ? (
                <>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Optional comment"
                    rows={3}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      className="gap-2 bg-success text-success-foreground hover:bg-success/90"
                      onClick={handleApprove}
                      disabled={busy}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Approve {PHASE_LABELS[phase]}
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-2 border-warning text-warning hover:bg-warning/10"
                      onClick={handleRequestChanges}
                      disabled={busy}
                    >
                      <MessageSquareWarning className="h-4 w-4" />
                      Request Changes
                    </Button>
                  </div>
                </>
              ) : (
                <Button onClick={handleRequestApproval} disabled={busy}>
                  Submit for Approval
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Side panel */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4" />
              Decision Log
            </CardTitle>
            <CardDescription>Approval history for this phase</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {approvals.length === 0 ? (
              <p className="text-sm text-muted-foreground">No decisions recorded yet.</p>
            ) : (
              approvals.map((a) => (
                <div key={a.id} className="text-sm border-l-2 pl-3 py-0.5" style={{ borderColor: a.decision === "approved" ? "var(--success)" : "var(--warning)" }}>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={a.decision === "approved" ? "text-success border-success" : "text-warning border-warning"}>
                      {a.decision.replace("_", " ")}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(a.approvedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {a.comments && <p className="text-muted-foreground mt-1">{a.comments}</p>}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {artifacts.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Previous Versions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {artifacts.slice(1).map((a) => (
                <div key={a.id} className="text-sm flex items-center justify-between">
                  <span className="truncate">{a.title}</span>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">v{a.version}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {runs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Coins className="h-4 w-4" />
                Automation Runs
              </CardTitle>
              <CardDescription>
                Total: ${runs.reduce((sum, r) => sum + (r.costUSD || 0), 0).toFixed(4)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {runs.map((r) => (
                <div key={r.id} className="text-sm flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge
                      variant="outline"
                      className={
                        r.status === "completed" ? "text-success border-success"
                          : r.status === "failed" ? "text-destructive border-destructive"
                            : "text-muted-foreground"
                      }
                    >
                      {r.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground truncate">
                      {r.modelUsage?.model || "—"}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {r.costUSD != null ? `$${r.costUSD.toFixed(4)}` : "—"}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Separator />
        <p className="text-xs text-muted-foreground">
          Draft proposals manually, or generate them with AI — both feed the same approval flow.
        </p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    not_started: { label: "Not Started", className: "text-muted-foreground border-muted-foreground/30" },
    in_progress: { label: "In Progress", className: "text-primary border-primary" },
    awaiting_approval: { label: "Awaiting Approval", className: "text-warning border-warning" },
    approved: { label: "Approved", className: "text-success border-success" },
    completed: { label: "Completed", className: "text-success border-success" },
  };
  const s = map[status] || map.not_started;
  return <Badge variant="outline" className={s.className}>{s.label}</Badge>;
}
