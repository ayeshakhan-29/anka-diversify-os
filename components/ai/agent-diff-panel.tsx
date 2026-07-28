"use client";

import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Zap,
  X,
  Code,
  GitCommit,
  RefreshCw,
  FolderOpen,
  Github,
  Check,
  ShieldCheck,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { AgentResult } from "./types";
import type { Project } from "@/lib/types";

interface AgentDiffPanelProps {
  agentResult: AgentResult;
  selectedFiles: Set<string>;
  commitMessage: string;
  isPushing: boolean;
  pushError: string | null;
  expandedFile: string | null;
  isApplyingLocal: boolean;
  applyLocalSuccess: boolean;
  project: Project;
  onToggleFile: (path: string) => void;
  onCommitMessageChange: (msg: string) => void;
  onPush: () => void;
  onApplyLocal: () => void;
  onDismiss: () => void;
  onExpandFile: (path: string | null) => void;
}

export function AgentDiffPanel({
  agentResult,
  selectedFiles,
  commitMessage,
  isPushing,
  pushError,
  expandedFile,
  isApplyingLocal,
  applyLocalSuccess,
  project,
  onToggleFile,
  onCommitMessageChange,
  onPush,
  onApplyLocal,
  onDismiss,
  onExpandFile,
}: AgentDiffPanelProps) {
  const [showBuildErrors, setShowBuildErrors] = useState(false);
  const [showPushConfirm, setShowPushConfirm] = useState(false);

  const handlePushClick = () => {
    setShowPushConfirm(true);
  };

  const handleConfirmPush = () => {
    setShowPushConfirm(false);
    onPush();
  };

  return (
    <div className="border border-violet-500/30 rounded-lg overflow-hidden bg-violet-500/5">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-violet-500/10 border-b border-violet-500/20">
        <div className="flex items-center gap-2 flex-wrap">
          <Zap className="h-4 w-4 text-violet-400" />
          <span className="text-sm font-medium">
            Agent proposed {agentResult.changes.length} file
            {agentResult.changes.length !== 1 ? "s" : ""}
          </span>
          {agentResult.intent && (
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
              {agentResult.intent}
            </span>
          )}
          {agentResult.buildVerified !== undefined && (
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded flex items-center gap-1 border ${
                agentResult.buildVerified
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                  : "bg-rose-500/15 text-rose-400 border-rose-500/30"
              }`}
            >
              {agentResult.buildVerified ? (
                <>
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Build Verified
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3 w-3 text-rose-400" /> Build Failed
                </>
              )}
            </span>
          )}
          {agentResult.securityPass !== undefined && (
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded flex items-center gap-1 border ${
                agentResult.securityPass
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                  : "bg-amber-500/15 text-amber-400 border-amber-500/30"
              }`}
            >
              <ShieldCheck className="h-3 w-3" />
              {agentResult.securityPass ? "Security Pass" : "Security Flagged"}
            </span>
          )}
        </div>
        <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-4 space-y-3">
        <p className="text-sm text-muted-foreground">{agentResult.explanation}</p>

        {/* Build Error Log Banner */}
        {agentResult.buildVerified === false && agentResult.buildErrors && (
          <div className="rounded-md border border-rose-500/40 bg-rose-500/10 overflow-hidden text-xs">
            <button
              onClick={() => setShowBuildErrors(!showBuildErrors)}
              className="w-full flex items-center justify-between p-2.5 font-medium text-rose-300 hover:bg-rose-500/20 transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                <span>Build Verification Errors Detected</span>
              </div>
              {showBuildErrors ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
            {showBuildErrors && (
              <div className="p-3 border-t border-rose-500/20 bg-black/40 font-mono text-[11px] text-rose-200 overflow-x-auto max-h-48 whitespace-pre-wrap">
                {agentResult.buildErrors}
              </div>
            )}
          </div>
        )}

        {/* Multi-Phase Roadmap */}
        {agentResult.roadmap && agentResult.roadmap.length > 0 && (
          <div className="p-3 rounded-md bg-background/50 border space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-400">
              <Layers className="h-3.5 w-3.5" />
              <span>Multi-Phase Implementation Roadmap</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
              {agentResult.roadmap.map((step) => (
                <div key={step.phase} className="p-2 rounded border bg-background/80 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="font-mono text-violet-300">Phase {step.phase}</span>
                    {step.layer && (
                      <span className="px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 text-[9px] font-mono">
                        {step.layer}
                      </span>
                    )}
                  </div>
                  <div className="font-medium text-foreground text-xs">{step.title}</div>
                  <p className="text-[10px] text-muted-foreground line-clamp-2">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* File Diffs List */}
        <div className="space-y-1.5">
          {agentResult.changes.map((change) => (
            <div key={change.path} className="rounded-md border bg-background overflow-hidden">
              <div
                className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-secondary/30"
                onClick={() => onExpandFile(expandedFile === change.path ? null : change.path)}
              >
                <input
                  type="checkbox"
                  checked={selectedFiles.has(change.path)}
                  onChange={() => onToggleFile(change.path)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-3.5 w-3.5 accent-violet-500"
                />
                <Code className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                <span className="text-xs font-mono flex-1 truncate">{change.path}</span>
                <span className="text-xs text-muted-foreground truncate max-w-48">
                  {change.description}
                </span>
              </div>
              {expandedFile === change.path && (
                <div className="border-t">
                  <SyntaxHighlighter
                    style={oneDark}
                    language={change.path.split(".").pop() || "text"}
                    PreTag="div"
                    customStyle={{ margin: 0, borderRadius: 0, fontSize: "0.7rem", maxHeight: "300px" }}
                  >
                    {change.content}
                  </SyntaxHighlighter>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Action Controls */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-2">
            <GitCommit className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <Input
              value={commitMessage}
              onChange={(e) => onCommitMessageChange(e.target.value)}
              placeholder="Commit message..."
              className="h-7 text-xs font-mono"
            />
          </div>
          {pushError && <p className="text-xs text-destructive">{pushError}</p>}
          {applyLocalSuccess && (
            <p className="text-xs text-green-500 flex items-center gap-1">
              <Check className="h-3.5 w-3.5" /> Files written to local project — run it in the
              terminal to preview.
            </p>
          )}

          {/* User Confirmation Banner before pushing */}
          {showPushConfirm && (
            <div className="p-3 rounded-md border border-violet-500/40 bg-violet-500/10 space-y-2 text-xs">
              <div className="font-semibold text-violet-300 flex items-center gap-1.5">
                <Github className="h-4 w-4 text-violet-400" />
                <span>Confirm Push to GitHub Repository?</span>
              </div>
              <p className="text-muted-foreground">
                You are about to push {selectedFiles.size} file change{selectedFiles.size !== 1 ? "s" : ""} to GitHub with commit message: &quot;{commitMessage}&quot;.
              </p>
              {agentResult.buildVerified === false && (
                <p className="text-rose-400 font-medium flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> Note: Build verification failed for these changes.
                </p>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowPushConfirm(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-xs bg-violet-600 hover:bg-violet-700 text-white"
                  onClick={handleConfirmPush}
                  disabled={isPushing}
                >
                  {isPushing ? "Pushing..." : "Yes, Authorize & Push"}
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            {project.localPath && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 border-green-500/40 text-green-400 hover:bg-green-500/10 text-xs h-8"
                onClick={onApplyLocal}
                disabled={isApplyingLocal || selectedFiles.size === 0}
              >
                {isApplyingLocal ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" />Applying...
                  </>
                ) : (
                  <>
                    <FolderOpen className="h-3.5 w-3.5 mr-1" />Apply Locally
                  </>
                )}
              </Button>
            )}
            <Button
              size="sm"
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white text-xs h-8"
              onClick={handlePushClick}
              disabled={isPushing || selectedFiles.size === 0 || !commitMessage.trim() || showPushConfirm}
            >
              {isPushing ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" />Pushing...
                </>
              ) : (
                <>
                  <Github className="h-3.5 w-3.5 mr-1" />Push to GitHub
                </>
              )}
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={onDismiss}>
              Discard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
