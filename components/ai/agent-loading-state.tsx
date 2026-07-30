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
  Activity
} from "lucide-react";

interface AgentLoadingStateProps {
  mode?: "chat" | "agent";
  currentBatchTaskTitle?: string | null;
}

const AGENT_STAGES = [
  {
    step: 1,
    icon: Zap,
    label: "Task",
    detail: "Initializing workspace & ingesting request task...",
    color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    badge: "STAGE 1/7",
    progress: 12,
  },
  {
    step: 2,
    icon: Cpu,
    label: "Understand Goal",
    detail: "Analyzing request intent & building Repository Knowledge Graph...",
    color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
    badge: "STAGE 2/7",
    progress: 28,
  },
  {
    step: 3,
    icon: FileCode2,
    label: "Determine Completion",
    detail: "Defining 12-point technical criteria & execution roadmap...",
    color: "text-blue-400 border-blue-500/30 bg-blue-500/10",
    badge: "STAGE 3/7",
    progress: 42,
  },
  {
    step: 4,
    icon: Code2,
    label: "Generate Files",
    detail: "Generating complete 100% production code files without placeholders...",
    color: "text-violet-400 border-violet-500/30 bg-violet-500/10",
    badge: "STAGE 4/7",
    progress: 58,
  },
  {
    step: 5,
    icon: Sparkles,
    label: "Wire Everything",
    detail: "Wiring imports, exports, routing, and JSX parent render sites...",
    color: "text-indigo-400 border-indigo-500/30 bg-indigo-500/10",
    badge: "STAGE 5/7",
    progress: 74,
  },
  {
    step: 6,
    icon: Terminal,
    label: "Run App & Self-Healing",
    detail: "Executing local tsc & build checks with auto-repair loop...",
    color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    badge: "STAGE 6/7",
    progress: 88,
  },
  {
    step: 7,
    icon: ShieldCheck,
    label: "Verify & Done",
    detail: "Verifying localhost rendering, interactivity, and ✓ checklist criteria...",
    color: "text-purple-400 border-purple-500/30 bg-purple-500/10",
    badge: "STAGE 7/7",
    progress: 98,
  },
];

const DEV_TIPS = [
  "⚡ Anka OS enforces strict 4-layer isolation (Controller, Service, Repository, Schema).",
  "🛡️ Self-healing repair loop runs up to 5 automated build retries to fix type errors.",
  "🚀 Diffs are generated full-file without placeholders for 100% compilation safety.",
  "🧠 Memory persistence records architectural decisions for future agent prompts.",
];

export function AgentLoadingState({ mode = "agent", currentBatchTaskTitle }: AgentLoadingStateProps) {
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    // Stage cycle timer
    const stageInterval = setInterval(() => {
      setActiveStageIndex((prev) => (prev + 1) % AGENT_STAGES.length);
    }, 2800);

    // Tip cycle timer
    const tipInterval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % DEV_TIPS.length);
    }, 4500);

    return () => {
      clearInterval(stageInterval);
      clearInterval(tipInterval);
    };
  }, []);

  const currentStage = AGENT_STAGES[activeStageIndex];
  const StageIcon = currentStage.icon;

  useEffect(() => {
    const timestamp = new Date().toLocaleTimeString().split(" ")[0];
    const newLog = `[${timestamp}] ${currentStage.label}: ${currentStage.detail.slice(0, 45)}...`;
    setTerminalLogs((prev) => [...prev.slice(-3), newLog]);
  }, [activeStageIndex]);

  if (mode === "chat") {
    return (
      <div className="flex gap-3 my-2">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        <div className="flex items-center gap-2 rounded-lg bg-secondary/50 p-3 text-sm">
          <div className="flex gap-1">
            <span className="h-2 w-2 rounded-full bg-primary animate-bounce" />
            <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
            <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:0.4s]" />
          </div>
          <span className="text-xs text-muted-foreground ml-1 font-medium">Formulating response...</span>
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
                <span>Anka Coding Agent</span>
                <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
              </h4>
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-mono ${currentStage.color}`}>
                {currentStage.badge}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 font-mono truncate max-w-[280px]">
              {currentBatchTaskTitle ? `Task: ${currentBatchTaskTitle}` : "Autonomous Multi-Stage Pipeline Active"}
            </p>
          </div>
        </div>

        {/* Live Activity Pill */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-full border border-violet-500/20">
          <Activity className="h-3 w-3 text-cyan-400 animate-pulse" />
          <span className="text-xs font-mono text-cyan-300 font-bold">Active</span>
        </div>
      </div>

      {/* Active Stage Box */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 mb-3 transition-all duration-300">
        <div className="flex items-start gap-2.5">
          <div className={`p-1.5 rounded-md border ${currentStage.color} shrink-0 mt-0.5`}>
            <StageIcon className="h-4 w-4 animate-spin-slow" />
          </div>
          <div className="space-y-0.5 min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">{currentStage.label}</span>
              <span className="text-[10px] font-mono text-slate-400">Processing...</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">{currentStage.detail}</p>
          </div>
        </div>
      </div>

      {/* Mini Cyber-Terminal Feed */}
      <div className="rounded-md border border-slate-800/80 bg-slate-950 p-2.5 font-mono text-[11px] space-y-1">
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-1 mb-1.5">
          <span className="text-[10px] text-cyan-400/90 font-bold flex items-center gap-1">
            <Terminal className="h-3 w-3" /> AGENT TERMINAL STREAM
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
        </div>
        {terminalLogs.map((log, idx) => (
          <div key={idx} className="text-slate-400 truncate flex items-center gap-1.5">
            <span className="text-violet-400 font-bold">&gt;</span>
            <span className={idx === terminalLogs.length - 1 ? "text-slate-200 font-medium" : "text-slate-500"}>
              {log}
            </span>
          </div>
        ))}
      </div>

      {/* Floating Developer Tip Footer */}
      <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1 border-t border-slate-800/50">
        <span className="truncate italic">{DEV_TIPS[tipIndex]}</span>
        <span className="shrink-0 text-[10px] text-violet-400 font-mono">ANKA AI v2.4</span>
      </div>
    </div>
  );
}
