"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Terminal,
  Shield,
  Loader2
} from "lucide-react";

export interface ActiveStageInfo {
  step: number;
  stageName?: string;
  label: string;
  detail: string;
  color?: string;
  badge?: string;
  progress?: number;
  log?: string;
  taskType?: string;
  risk?: string;
  estimatedComplexity?: string;
  targetPath?: string;
  executionContract?: {
    goal: string;
    taskType: string;
    pipeline?: string;
    environment?: string;
    repositoryRequired?: boolean;
    expectedFiles?: string[];
    validationType?: string;
    allowedActions: string[];
    forbiddenActions: string[];
    maxFiles: number;
    targetPaths: string[];
    contextScope: string[];
    diffCriticEnabled: boolean;
  };
}

export interface AgentLoadingStateProps {
  mode?: "chat" | "agent";
  currentBatchTaskTitle?: string | null;
  activeStage?: ActiveStageInfo | null;
  terminalLogs?: string[];
}

const UI_STAGES = [
  { id: 1, label: "Understand", steps: [1] },
  { id: 2, label: "Context", steps: [2] },
  { id: 3, label: "Plan", steps: [3] },
  { id: 4, label: "Generate", steps: [4] },
  { id: 5, label: "Validate", steps: [5] },
];

export function AgentLoadingState({
  mode = "agent",
  currentBatchTaskTitle,
  activeStage,
  terminalLogs = [],
}: AgentLoadingStateProps) {
  const [showActivity, setShowActivity] = useState(true);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal log container as new events arrive
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [terminalLogs, activeStage]);

  // Chat mode loading state: minimal, calm inline indicator
  if (mode === "chat") {
    return (
      <div 
        className="flex items-center gap-2.5 my-2 py-1.5 px-3 rounded-md border border-[#30363d] bg-[#0d1117] text-slate-300 w-fit"
        aria-live="polite"
        role="status"
      >
        <Loader2 className="h-3.5 w-3.5 text-blue-400 animate-spin" />
        <span className="text-xs font-mono text-slate-300">Thinking...</span>
      </div>
    );
  }

  // Determine current 1..5 step
  const rawStep = activeStage?.step || 1;
  // Map step numbers safely to 1..5 range
  const currentStep = Math.min(5, Math.max(1, rawStep > 5 ? 5 : rawStep));
  const isPreparing = !activeStage;

  const stageLabel = activeStage?.label || (currentBatchTaskTitle ? `Task: ${currentBatchTaskTitle}` : "Preparing execution pipeline...");
  const stageDetail = activeStage?.detail || (isPreparing ? "Initializing repository environment and workspace context..." : "");
  
  // Status label
  let statusText = "Running";
  if (currentStep === 3) statusText = "Planning";
  else if (currentStep === 4) statusText = "Generating";
  else if (currentStep === 5) statusText = "Validating";
  if (activeStage?.stageName === "SELF_HEALING" || activeStage?.stageName === "BUILD_REPAIR") {
    statusText = "Self-Healing";
  }

  const contract = activeStage?.executionContract;

  // Active display logs
  const displayLogs: string[] = terminalLogs.length > 0
    ? terminalLogs
    : [
        stageDetail || stageLabel || "Preparing execution pipeline...",
      ];

  return (
    <div 
      className="my-3 rounded-lg border border-[#30363d] bg-[#0d1117] text-slate-200 shadow-sm max-w-full overflow-hidden font-sans"
      aria-live="polite"
      role="status"
    >
      {/* ── 1. Header Row ── */}
      <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 border-b border-[#21262d] bg-[#161b22]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center justify-center h-5 w-5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
            <Terminal className="h-3 w-3" />
          </div>
          <div className="flex items-center gap-1.5 min-w-0 truncate text-xs">
            <span className="font-medium text-slate-200">ANKA Agent</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400 truncate">
              {currentBatchTaskTitle || "Autonomous Coding Engine"}
            </span>
          </div>
        </div>

        {/* Minimal Status Badge */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-blue-500/20 bg-blue-500/10 text-[11px] font-mono text-blue-300 shrink-0">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span>{statusText}</span>
        </div>
      </div>

      {/* ── 2. Stage Tracker Rail ── */}
      <div className="px-3.5 pt-3 pb-2.5 border-b border-[#21262d]">
        <div className="grid grid-cols-5 gap-2 items-center">
          {UI_STAGES.map((st) => {
            const isCompleted = currentStep > st.id;
            const isCurrent = currentStep === st.id;

            return (
              <div key={st.id} className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center justify-center shrink-0">
                    {isCompleted ? (
                      <div className="h-3.5 w-3.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <Check className="h-2 w-2 stroke-[2.5]" />
                      </div>
                    ) : isCurrent ? (
                      <div className="h-3.5 w-3.5 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                      </div>
                    ) : (
                      <div className="h-3.5 w-3.5 rounded-full bg-[#21262d] border border-[#30363d]" />
                    )}
                  </div>
                  <span 
                    className={`text-[11px] font-mono truncate ${
                      isCompleted 
                        ? "text-slate-400" 
                        : isCurrent 
                        ? "text-blue-300 font-semibold" 
                        : "text-slate-600"
                    }`}
                  >
                    {st.label}
                  </span>
                </div>
                {/* Understated progress bar segment */}
                <div className="w-full h-0.5 rounded-full bg-[#21262d] overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      isCompleted ? "bg-emerald-500/70" : isCurrent ? "bg-blue-400" : "bg-transparent"
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 3. Active Status Bar & Toggle ── */}
      <div className="flex items-center justify-between gap-3 px-3.5 py-2 bg-[#0d1117] text-xs">
        <div className="flex items-center gap-2 min-w-0 truncate">
          <Loader2 className="h-3 w-3 text-blue-400 animate-spin shrink-0" />
          <span className="font-mono text-[11px] text-slate-300 truncate">
            {stageDetail || stageLabel}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowActivity((prev) => !prev)}
          className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-slate-200 transition-colors shrink-0 px-1.5 py-0.5 rounded hover:bg-[#161b22]"
          aria-expanded={showActivity}
        >
          <span>{showActivity ? "Hide logs" : "Show logs"}</span>
          {showActivity ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>

      {/* ── 4. Terminal Activity Log Stream ── */}
      {showActivity && (
        <div className="border-t border-[#21262d] bg-[#090d13] p-3 space-y-2">
          {/* Execution Contract Summary (if target paths exist) */}
          {contract && contract.targetPaths && contract.targetPaths.length > 0 && (
            <div className="flex items-center gap-2 px-2 py-1 rounded bg-[#161b22] border border-[#21262d] text-[10px] font-mono text-slate-400 flex-wrap">
              <span className="flex items-center gap-1 text-slate-300 shrink-0">
                <Shield className="h-2.5 w-2.5 text-blue-400" /> Targets:
              </span>
              {contract.targetPaths.map((tp, idx) => (
                <span key={idx} className="bg-[#21262d] text-blue-300 px-1 py-0.5 rounded">
                  {tp}
                </span>
              ))}
            </div>
          )}

          {/* Real-time Log Lines */}
          <div 
            ref={logContainerRef}
            className="max-h-[160px] overflow-y-auto font-mono text-[11px] space-y-1 scrollbar-thin scrollbar-thumb-[#30363d] scrollbar-track-transparent pr-1"
          >
            {displayLogs.map((log, idx) => {
              const isLatest = idx === displayLogs.length - 1;
              return (
                <div 
                  key={idx} 
                  className="flex items-start gap-2 leading-relaxed text-slate-400 select-text"
                >
                  <span className="text-slate-600 select-none shrink-0 w-4 text-right text-[10px]">
                    {idx + 1}
                  </span>
                  <span className={isLatest ? "text-slate-200 font-medium" : "text-slate-400"}>
                    {log}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
