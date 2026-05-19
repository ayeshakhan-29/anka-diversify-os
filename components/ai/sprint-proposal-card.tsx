"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Zap, X, RefreshCw, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SprintProposal {
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  suggestedTasks: { taskId: string; title: string; reason: string; priority: string }[];
}

interface SprintProposalCardProps {
  proposal: SprintProposal;
  selectedTasks: Set<string>;
  isCreating: boolean;
  onToggle: (taskId: string) => void;
  onCreate: () => void;
  onDismiss: () => void;
}

export function SprintProposalCard({
  proposal,
  selectedTasks,
  isCreating,
  onToggle,
  onCreate,
  onDismiss,
}: SprintProposalCardProps) {
  return (
    <div className="border border-violet-500/30 rounded-lg overflow-hidden bg-violet-500/5">
      <div className="flex items-center justify-between px-4 py-3 bg-violet-500/10 border-b border-violet-500/20">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-violet-400" />
          <span className="text-sm font-medium">AI sprint proposal</span>
        </div>
        <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-4 space-y-3">
        {/* Sprint meta */}
        <div className="rounded-md border bg-background p-3 space-y-1">
          <p className="text-sm font-semibold">{proposal.name}</p>
          {proposal.goal && (
            <p className="text-xs text-muted-foreground">{proposal.goal}</p>
          )}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
            <CalendarDays className="h-3 w-3" />
            {proposal.startDate} → {proposal.endDate}
          </div>
        </div>

        {/* Task list */}
        {proposal.suggestedTasks.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground font-medium">
              {proposal.suggestedTasks.length} suggested tasks — select which to include:
            </p>
            {proposal.suggestedTasks.map((task) => (
              <div
                key={task.taskId}
                className="flex items-start gap-3 rounded-md border bg-background p-2.5 cursor-pointer hover:bg-secondary/20"
                onClick={() => onToggle(task.taskId)}
              >
                <input
                  type="checkbox"
                  checked={selectedTasks.has(task.taskId)}
                  onChange={() => onToggle(task.taskId)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-3.5 w-3.5 mt-0.5 accent-violet-500 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium">{task.title}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs shrink-0",
                        task.priority === "high"
                          ? "border-red-500/40 text-red-400"
                          : task.priority === "medium"
                            ? "border-yellow-500/40 text-yellow-400"
                            : "border-green-500/40 text-green-400",
                      )}
                    >
                      {task.priority}
                    </Badge>
                  </div>
                  {task.reason && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{task.reason}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            className="flex-1 bg-violet-600 hover:bg-violet-700 text-white text-xs h-8"
            onClick={onCreate}
            disabled={isCreating}
          >
            {isCreating ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" />Creating...
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5 mr-1" />
                Create sprint{selectedTasks.size > 0 ? ` + ${selectedTasks.size} tasks` : ""}
              </>
            )}
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={onDismiss}>
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}
