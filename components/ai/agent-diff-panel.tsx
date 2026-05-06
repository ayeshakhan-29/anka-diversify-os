"use client";

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
  return (
    <div className="border border-violet-500/30 rounded-lg overflow-hidden bg-violet-500/5">
      <div className="flex items-center justify-between px-4 py-3 bg-violet-500/10 border-b border-violet-500/20">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-violet-400" />
          <span className="text-sm font-medium">
            Agent proposed {agentResult.changes.length} file
            {agentResult.changes.length !== 1 ? "s" : ""}
          </span>
        </div>
        <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-4 space-y-3">
        <p className="text-sm text-muted-foreground">{agentResult.explanation}</p>

        <div className="space-y-1.5">
          {agentResult.changes.map((change) => (
            <div key={change.path} className="rounded-md border bg-background overflow-hidden">
              <div
                className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-secondary/30"
                onClick={() =>
                  onExpandFile(expandedFile === change.path ? null : change.path)
                }
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
              onClick={onPush}
              disabled={isPushing || selectedFiles.size === 0 || !commitMessage.trim()}
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
