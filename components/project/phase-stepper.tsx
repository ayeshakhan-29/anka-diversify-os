"use client";

import { CheckCircle2, Circle, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { WORKFLOW_PHASES, type WorkflowPhase, type ProjectPhaseState, type WorkflowPhaseStatus } from "@/lib/types";

const PHASE_LABELS: Record<WorkflowPhase, string> = {
  requirements: "Requirements",
  documentation: "Documentation",
  architecture: "Architecture",
  implementation: "Implementation",
  testing: "Testing",
  review: "Review",
};

const STATUS_STYLES: Record<WorkflowPhaseStatus, { icon: typeof Circle; className: string; label: string }> = {
  not_started: { icon: Circle, className: "text-muted-foreground border-muted-foreground/30", label: "Not Started" },
  in_progress: { icon: Clock, className: "text-primary border-primary bg-primary/10", label: "In Progress" },
  awaiting_approval: { icon: AlertCircle, className: "text-amber-400 border-amber-500/40 bg-amber-500/10", label: "Awaiting Approval" },
  approved: { icon: CheckCircle2, className: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10", label: "Approved" },
  completed: { icon: CheckCircle2, className: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10", label: "Completed" },
};

interface PhaseStepperProps {
  states: ProjectPhaseState[];
  activePhase: WorkflowPhase;
  onSelectPhase: (phase: WorkflowPhase) => void;
}

export function PhaseStepper({ states, activePhase, onSelectPhase }: PhaseStepperProps) {
  const statusByPhase = new Map(states.map((s) => [s.phase, s.status]));

  return (
    <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden px-4 py-3 border-t bg-card/30 backdrop-blur-md">
      {WORKFLOW_PHASES.map((phase, i) => {
        const status = statusByPhase.get(phase) || "not_started";
        const style = STATUS_STYLES[status];
        const Icon = style.icon;
        const isActive = phase === activePhase;

        return (
          <div key={phase} className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => onSelectPhase(phase)}
              title={style.label}
              className={cn(
                "flex items-center gap-1.5 sm:gap-2 rounded-full border px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm whitespace-nowrap transition-colors",
                style.className,
                isActive ? "bg-background shadow-sm ring-1 ring-primary/30" : "hover:bg-background/50",
              )}
            >
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className={cn(isActive && "font-medium")}>{PHASE_LABELS[phase]}</span>
              {phase === "architecture" && (
                <span className="text-[10px] text-warning" title="Most important human gate">★</span>
              )}
            </button>
            {i < WORKFLOW_PHASES.length - 1 && (
              <div className="h-px w-3 sm:w-6 bg-border shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}
