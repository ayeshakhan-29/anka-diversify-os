"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  Cpu, 
  FileCode2, 
  Code2, 
  Terminal, 
  ShieldCheck, 
  Sparkles,
  Bot,
  Activity,
  CheckCircle2
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

interface AgentLoadingStateProps {
  mode?: "chat" | "agent";
  currentBatchTaskTitle?: string | null;
  activeStage?: ActiveStageInfo | null;
  terminalLogs?: string[];
}

const STAGE_ICONS: Record<number, any> = {
  1: Zap,
  2: Cpu,
  3: FileCode2,
  4: Code2,
  5: Sparkles,
  6: Terminal,
  7: ShieldCheck,
};

const SIMULATED_STAGES: ActiveStageInfo[] = [
  {
    step: 1,
    stageName: "TASK_DECOMPOSITION",
    label: "Analyze Request & Route Task",
    detail: "Ingesting user prompt, classifying intent, and establishing execution contract...",
    color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    badge: "STAGE 1/7",
    progress: 15,
    log: "Analyzing task intent and setting up environment pipeline..."
  },
  {
    step: 2,
    stageName: "CONTEXT_RETRIEVAL",
    label: "Scan Repository Context",
    detail: "Indexing file structure, parsing symbol graphs, and building context payload...",
    color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
    badge: "STAGE 2/7",
    progress: 30,
    log: "Reading file tree snapshot and symbol dependencies..."
  },
  {
    step: 3,
    stageName: "ARCHITECTURE_BLUEPRINT",
    label: "Build Architectural Roadmap",
    detail: "Drafting multi-phase blueprint and component wiring strategy...",
    color: "text-purple-400 border-purple-500/30 bg-purple-500/10",
    badge: "STAGE 3/7",
    progress: 45,
    log: "Generating execution contract and multi-file blueprint..."
  },
  {
    step: 4,
    stageName: "CODE_GENERATION",
    label: "Generate Code & Components",
    detail: "Synthesizing complete file diffs with defensive state machine guardrails...",
    color: "text-blue-400 border-blue-500/30 bg-blue-500/10",
    badge: "STAGE 4/7",
    progress: 65,
    log: "Writing production code files with state machine error boundaries..."
  },
  {
    step: 5,
    stageName: "STATIC_CRITIQUE",
    label: "Diff Critic & Layer Audit",
    detail: "Auditing 4-layer isolation rules, exports, and syntax compliance...",
    color: "text-indigo-400 border-indigo-500/30 bg-indigo-500/10",
    badge: "STAGE 5/7",
    progress: 80,
    log: "Verifying layer constraints and static code quality..."
  },
  {
    step: 6,
    stageName: "FEATURE_VALIDATION",
    label: "Build & Self-Healing Check",
    detail: "Executing local build checks and auto-repairing edge case errors...",
    color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    badge: "STAGE 6/7",
    progress: 90,
    log: "Executing compilation checks and self-healing validation loop..."
  },
  {
    step: 7,
    stageName: "MEMORY_PERSISTENCE",
    label: "Finalizing & Memory Sync",
    detail: "Persisting architectural decisions and finalizing agent changeset...",
    color: "text-teal-400 border-teal-500/30 bg-teal-500/10",
    badge: "STAGE 7/7",
    progress: 96,
    log: "Finalizing agent changeset and persisting project memory..."
  }
];

const CHAT_LOADING_TEXTS = [
  "Thinking...",
  "Analyzing context...",
  "Searching codebase knowledge...",
  "Formulating detailed response..."
];

const DEV_TIPS = [
  "⚡ Anka OS enforces strict 4-layer isolation (Controller, Service, Repository, Schema).",
  "🛡️ Self-healing repair loop runs up to 5 automated build retries to fix type errors.",
  "🚀 Diffs are generated full-file without placeholders for 100% compilation safety.",
  "🧠 Memory persistence records architectural decisions for future agent prompts.",
];

export function AgentLoadingState({
  mode = "agent",
  currentBatchTaskTitle,
  activeStage,
  terminalLogs = [],
}: AgentLoadingStateProps) {
  const [tipIndex, setTipIndex] = useState(0);
  const [simulatedStageIndex, setSimulatedStageIndex] = useState(0);
  const [chatTextIndex, setChatTextIndex] = useState(0);

  // Rotate developer tips
  useEffect(() => {
    const tipInterval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % DEV_TIPS.length);
    }, 4500);
    return () => clearInterval(tipInterval);
  }, []);

  // Rotate chat loading text
  useEffect(() => {
    if (mode !== "chat") return;
    const chatInterval = setInterval(() => {
      setChatTextIndex((prev) => (prev + 1) % CHAT_LOADING_TEXTS.length);
    }, 2500);
    return () => clearInterval(chatInterval);
  }, [mode]);

  // Fallback simulated progress timer when real SSE events are pending/absent
  useEffect(() => {
    if (activeStage) return; // Use real stage if available
    const simInterval = setInterval(() => {
      setSimulatedStageIndex((prev) => (prev < SIMULATED_STAGES.length - 1 ? prev + 1 : prev));
    }, 2800);
    return () => clearInterval(simInterval);
  }, [activeStage]);

  // Determine current effective stage & terminal log feed
  const currentSimulated = SIMULATED_STAGES[simulatedStageIndex];
  const stage = activeStage || currentSimulated;

  const StageIcon = STAGE_ICONS[stage.step] || Zap;
  const stageColor = stage.color || "text-cyan-400 border-cyan-500/30 bg-cyan-500/10";
  const stageBadge = stage.badge || `STAGE ${stage.step}/7`;
  const stageProgress = stage.progress ?? Math.round((stage.step / 7) * 100);

  // Build terminal logs fallback list
  const effectiveLogs = terminalLogs.length > 0 
    ? terminalLogs 
    : SIMULATED_STAGES.slice(0, Math.max(1, simulatedStageIndex + 1)).map(s => s.log!);

  if (mode === "chat") {
    return (
      <div className="flex gap-3 my-3">
        <div className="relative">
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-violet-600 to-cyan-400 opacity-60 blur-sm animate-pulse" />
          <Avatar className="relative h-8 w-8 ring-2 ring-violet-500/50">
            <AvatarFallback className="bg-slate-950 text-cyan-400">
              <Bot className="h-4 w-4 animate-bounce" />
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-violet-500/30 bg-slate-950/80 px-4 py-2.5 text-sm text-slate-100 shadow-md backdrop-blur-md">
          <div className="flex gap-1.5">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce" />
            <span className="h-2 w-2 rounded-full bg-violet-400 animate-bounce [animation-delay:0.2s]" />
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]" />
          </div>
          <span className="text-xs font-mono text-cyan-300 font-semibold transition-all duration-300">
            {CHAT_LOADING_TEXTS[chatTextIndex]}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="my-4 relative overflow-hidden rounded-xl border border-violet-500/30 bg-slate-950/90 p-4.5 text-slate-100 shadow-xl shadow-violet-950/30 backdrop-blur-md transition-all duration-300">
      {/* Animated glowing laser scanner header line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />

      {/* Main Header Row */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            {/* Spinning gradient ring */}
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-violet-600 via-cyan-400 to-indigo-500 opacity-75 blur-sm animate-spin" />
            <Avatar className="relative h-9 w-9 ring-2 ring-violet-500/50">
              <AvatarFallback className="bg-slate-900 text-cyan-400">
                <Zap className="h-4 w-4 animate-bounce" />
              </AvatarFallback>
            </Avatar>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
                <span>Anka AI Coding Agent</span>
                <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
              </h4>
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-mono ${stageColor}`}>
                {stageBadge}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 font-mono truncate max-w-[280px]">
              {currentBatchTaskTitle ? `Task: ${currentBatchTaskTitle}` : "Autonomous Multi-Stage Pipeline Active"}
            </p>
          </div>
        </div>

        {/* Live Activity Pill & Progress */}
        <div className="flex items-center gap-2">
          <div className="text-[11px] font-mono text-cyan-400 font-bold">
            {stageProgress}%
          </div>
          <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-full border border-violet-500/20">
            <Activity className="h-3 w-3 text-cyan-400 animate-pulse" />
            <span className="text-xs font-mono text-cyan-300 font-bold">Active</span>
          </div>
        </div>
      </div>

      {/* 7-Step Stepper Bar */}
      <div className="flex items-center justify-between gap-1 mb-3 px-1">
        {SIMULATED_STAGES.map((st) => {
          const isDone = stage.step > st.step;
          const isCurrent = stage.step === st.step;
          return (
            <div key={st.step} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`h-1.5 w-full rounded-full transition-all duration-500 ${
                  isDone
                    ? "bg-emerald-400 shadow-sm shadow-emerald-400/50"
                    : isCurrent
                    ? "bg-cyan-400 animate-pulse shadow-md shadow-cyan-400/80"
                    : "bg-slate-800"
                }`}
              />
              <span
                className={`text-[9px] font-mono ${
                  isDone
                    ? "text-emerald-400 font-bold"
                    : isCurrent
                    ? "text-cyan-300 font-bold"
                    : "text-slate-600"
                }`}
              >
                S{st.step}
              </span>
            </div>
          );
        })}
      </div>

      {/* Real Progress Bar */}
      <div className="w-full h-1 bg-slate-800 rounded-full mb-3 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400 transition-all duration-500 ease-out" 
          style={{ width: `${stageProgress}%` }}
        />
      </div>

      {/* Execution Contract Panel — live from Stage 1 */}
      {stage.executionContract ? (
        <div className="mb-3 rounded-lg border border-violet-800/40 bg-violet-950/20 overflow-hidden">
          {/* Contract Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-violet-800/30 bg-violet-950/40">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-mono font-bold text-violet-300 uppercase tracking-widest">Execution Contract</span>
              {stage.executionContract.pipeline && (
                <Badge className={`text-[9px] font-mono px-1.5 py-0 border ${
                  stage.executionContract.pipeline === "STANDALONE"
                    ? "bg-cyan-950 text-cyan-300 border-cyan-700/60 font-bold"
                    : "bg-purple-950 text-purple-300 border-purple-700/50"
                }`}>
                  {stage.executionContract.pipeline}
                </Badge>
              )}
              {stage.executionContract.environment && (
                <Badge className="bg-slate-900 text-amber-300 border border-amber-700/50 text-[9px] font-mono px-1.5 py-0">
                  {stage.executionContract.environment}
                </Badge>
              )}
              <Badge className={`text-[9px] font-mono px-1.5 py-0 border ${
                stage.risk === "HIGH" || stage.risk === "CRITICAL"
                  ? "bg-rose-950/80 text-rose-300 border-rose-700/50"
                  : stage.risk === "MEDIUM"
                  ? "bg-amber-950/80 text-amber-300 border-amber-700/50"
                  : "bg-emerald-950/80 text-emerald-300 border-emerald-700/50"
              }`}>
                {stage.risk || "MEDIUM"}
              </Badge>
            </div>
            <span className="text-[10px] font-mono text-amber-400 font-bold shrink-0 ml-2">
              max {stage.executionContract.maxFiles} files
            </span>
          </div>

          <div className="px-3 py-2 space-y-2">
            {/* Goal */}
            <p className="text-[11px] text-slate-300 font-sans leading-relaxed line-clamp-2">
              {stage.executionContract.goal}
            </p>

            {/* Target Paths */}
            {stage.executionContract.targetPaths.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-mono text-slate-500">scope:</span>
                {stage.executionContract.targetPaths.slice(0, 3).map((p, i) => (
                  <span key={i} className="text-[10px] font-mono bg-slate-800 text-cyan-400 px-1.5 py-0.5 rounded border border-slate-700">
                    {p}
                  </span>
                ))}
              </div>
            )}

            {/* Allowed / Forbidden actions */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-[9px] font-mono text-emerald-500 uppercase tracking-wider mb-1">✓ Allowed</div>
                <div className="flex flex-col gap-0.5">
                  {stage.executionContract.allowedActions.slice(0, 3).map((a, i) => (
                    <span key={i} className="text-[10px] font-mono text-emerald-300 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-900/50 truncate">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[9px] font-mono text-rose-500 uppercase tracking-wider mb-1">✗ Forbidden</div>
                <div className="flex flex-col gap-0.5">
                  {stage.executionContract.forbiddenActions.slice(0, 3).map((a, i) => (
                    <span key={i} className="text-[10px] font-mono text-rose-300 bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-900/50 truncate">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Diff Critic status */}
            <div className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${stage.executionContract.diffCriticEnabled ? "bg-amber-400" : "bg-slate-600"}`} />
              <span className="text-[10px] font-mono text-slate-400">
                Diff Critic: {stage.executionContract.diffCriticEnabled ? "Active" : "Off"}
              </span>
            </div>
          </div>
        </div>
      ) : stage.taskType ? (
        /* Fallback: simple badge row when no contract yet */
        <div className="flex flex-wrap items-center gap-1.5 mb-3 px-0.5">
          <Badge className="bg-violet-950/80 text-violet-300 border border-violet-700/50 text-[10px] font-mono px-2 py-0.5">
            Task: {stage.taskType}
          </Badge>
          {stage.risk && (
            <Badge className={`text-[10px] font-mono px-2 py-0.5 border ${
              stage.risk === "HIGH" || stage.risk === "CRITICAL"
                ? "bg-rose-950/80 text-rose-300 border-rose-700/50"
                : stage.risk === "MEDIUM"
                ? "bg-amber-950/80 text-amber-300 border-amber-700/50"
                : "bg-emerald-950/80 text-emerald-300 border-emerald-700/50"
            }`}>
              Risk: {stage.risk}
            </Badge>
          )}
          {stage.estimatedComplexity && (
            <Badge className="bg-slate-900 text-cyan-300 border border-slate-700 text-[10px] font-mono px-2 py-0.5">
              Complexity: {stage.estimatedComplexity}
            </Badge>
          )}
        </div>
      ) : null}

      {/* Active Stage Box */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 mb-3 transition-all duration-300">
        <div className="flex items-start gap-2.5">
          <div className={`p-1.5 rounded-md border ${stageColor} shrink-0 mt-0.5`}>
            <StageIcon className="h-4 w-4 animate-spin-slow" />
          </div>
          <div className="space-y-0.5 min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">{stage.label}</span>
              <span className="text-[10px] font-mono text-cyan-400">Live Stage {stage.step}/7</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">{stage.detail}</p>
          </div>
        </div>
      </div>

      {/* Mini Cyber-Terminal Feed */}
      <div className="rounded-md border border-slate-800/80 bg-slate-950 p-2.5 font-mono text-[11px] space-y-1">
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-1 mb-1.5">
          <span className="text-[10px] text-cyan-400/90 font-bold flex items-center gap-1">
            <Terminal className="h-3 w-3" /> AGENT REAL-TIME LOG STREAM
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
        </div>
        {effectiveLogs.length === 0 ? (
          <div className="text-slate-500 italic text-[10px]">Connecting agent stream...</div>
        ) : (
          effectiveLogs.slice(-5).map((log, idx) => (
            <div key={idx} className="text-slate-400 truncate flex items-center gap-1.5">
              <span className="text-violet-400 font-bold">&gt;</span>
              <span className={idx === effectiveLogs.slice(-5).length - 1 ? "text-slate-200 font-medium" : "text-slate-500"}>
                {log}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Floating Developer Tip Footer */}
      <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1 border-t border-slate-800/50">
        <span className="truncate italic">{DEV_TIPS[tipIndex]}</span>
        <span className="shrink-0 text-[10px] text-violet-400 font-mono">ANKA AI v2.4</span>
      </div>
    </div>
  );
}
