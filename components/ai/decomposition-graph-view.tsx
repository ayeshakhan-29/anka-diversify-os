"use client";

import React from "react";
import { GitCommit, CheckCircle, AlertCircle, Loader2, ArrowDown, Layers } from "lucide-react";

export interface SubTaskUI {
  id: string;
  category: string;
  description: string;
  targetFiles: string[];
  dependencies: string[];
  estimatedComplexity: "SMALL" | "MEDIUM";
  status?: "pending" | "in_progress" | "completed" | "failed";
}

export interface DependencyExecutionGraphUI {
  nodes: SubTaskUI[];
  executionOrder: string[];
  graphVersion: string;
}

interface DecompositionGraphViewProps {
  graph: DependencyExecutionGraphUI;
  className?: string;
}

export function DecompositionGraphView({ graph, className = "" }: DecompositionGraphViewProps) {
  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />;
      case "in_progress":
        return <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />;
      default:
        return <GitCommit className="w-4 h-4 text-slate-500 shrink-0" />;
    }
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      types_and_interfaces: "bg-purple-500/10 text-purple-400 border-purple-500/30",
      mock_data: "bg-slate-500/10 text-slate-400 border-slate-500/30",
      leaf_components: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
      container_components: "bg-blue-500/10 text-blue-400 border-blue-500/30",
      routing_and_navigation: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      api_integration: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      state_management: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
    };

    return (
      <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${colors[category] || colors.container_components}`}>
        {category.replace(/_/g, " ")}
      </span>
    );
  };

  const orderedNodes = graph.executionOrder
    .map((id) => graph.nodes.find((n) => n.id === id))
    .filter(Boolean) as SubTaskUI[];

  return (
    <div className={`rounded-xl border border-slate-800 bg-slate-900/90 p-4 backdrop-blur-md ${className}`}>
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-purple-400" />
          <h3 className="font-semibold text-sm text-slate-100">Task Decomposition DAG Graph</h3>
        </div>
        <span className="text-xs text-slate-400">
          Sub-tasks: <strong className="text-purple-400">{graph.nodes.length}</strong>
        </span>
      </div>

      <div className="space-y-3">
        {orderedNodes.map((node, idx) => (
          <React.Fragment key={node.id}>
            <div
              className={`p-3 rounded-lg border transition-all ${
                node.status === "in_progress"
                  ? "bg-cyan-950/30 border-cyan-500/50 shadow-lg shadow-cyan-500/10"
                  : node.status === "completed"
                  ? "bg-slate-950/60 border-emerald-500/30"
                  : node.status === "failed"
                  ? "bg-rose-950/30 border-rose-500/40"
                  : "bg-slate-950/40 border-slate-800/60"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  {getStatusIcon(node.status)}
                  <span className="font-mono font-semibold text-xs text-slate-200">{node.id}</span>
                  {getCategoryBadge(node.category)}
                </div>
                <span className="text-[11px] font-mono text-slate-400">{node.estimatedComplexity}</span>
              </div>

              <p className="text-xs text-slate-300 mb-2">{node.description}</p>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/40">
                <span>Targets: <strong className="text-slate-300 font-mono">{node.targetFiles.join(", ")}</strong></span>
                {node.dependencies.length > 0 && (
                  <span>Depends on: <strong className="text-purple-300 font-mono">{node.dependencies.join(", ")}</strong></span>
                )}
              </div>
            </div>

            {idx < orderedNodes.length - 1 && (
              <div className="flex justify-center py-0.5 text-slate-600">
                <ArrowDown className="w-4 h-4" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
