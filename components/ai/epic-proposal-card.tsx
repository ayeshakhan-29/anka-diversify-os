"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, X, RefreshCw, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EpicProposal } from "@/lib/ai-service";

interface EpicProposalCardProps {
  proposedEpic: EpicProposal;
  selectedTasks: Set<number>;
  isAdding: boolean;
  onToggle: (i: number) => void;
  onAdd: () => void;
  onDismiss: () => void;
}

export function EpicProposalCard({
  proposedEpic,
  selectedTasks,
  isAdding,
  onToggle,
  onAdd,
  onDismiss,
}: EpicProposalCardProps) {
  return (
    <div className="border border-blue-500/30 rounded-lg overflow-hidden bg-blue-500/5">
      <div className="flex items-center justify-between px-4 py-3 bg-blue-500/10 border-b border-blue-500/20">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-400" />
          <div>
            <span className="text-sm font-medium">{proposedEpic.title}</span>
            <span className="text-xs text-muted-foreground ml-2">
              — {proposedEpic.tasks.length} tasks
            </span>
          </div>
        </div>
        <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="p-4 space-y-2">
        <p className="text-xs text-muted-foreground">{proposedEpic.description}</p>
        {proposedEpic.tasks.map((task, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-md border bg-background p-3 cursor-pointer hover:bg-secondary/20"
            onClick={() => onToggle(i)}
          >
            <input
              type="checkbox"
              checked={selectedTasks.has(i)}
              onChange={() => onToggle(i)}
              onClick={(e) => e.stopPropagation()}
              className="h-3.5 w-3.5 mt-0.5 accent-blue-500 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">{task.title}</span>
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
                {task.phase && (
                  <span className="text-xs text-muted-foreground">{task.phase}</span>
                )}
              </div>
              {task.userStory && (
                <p className="text-xs text-blue-400/80 mt-0.5 italic">{task.userStory}</p>
              )}
              {task.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {task.description}
                </p>
              )}
            </div>
          </div>
        ))}
        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
            onClick={onAdd}
            disabled={isAdding || selectedTasks.size === 0}
          >
            {isAdding ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" />Adding...
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5 mr-1" />Add {selectedTasks.size} tasks to Kanban
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
