"use client";

import React, { useState } from "react";
import { FileCode, FilePlus, FileEdit, FileX, ChevronDown, ChevronRight, Link2, CheckCircle2 } from "lucide-react";

export interface FileDeclarationUI {
  path: string;
  action: "create" | "modify" | "delete";
  dependencies: string[];
  description: string;
  estimatedLines?: number;
}

export interface FileManifestUI {
  files: FileDeclarationUI[];
  totalFiles: number;
  manifestVersion: string;
}

interface ManifestTreeViewProps {
  manifest: FileManifestUI;
  className?: string;
}

export function ManifestTreeView({ manifest, className = "" }: ManifestTreeViewProps) {
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>({});

  const toggleExpand = (path: string) => {
    setExpandedFiles((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const getActionBadge = (action: "create" | "modify" | "delete") => {
    switch (action) {
      case "create":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <FilePlus className="w-3 h-3" /> CREATE
          </span>
        );
      case "modify":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <FileEdit className="w-3 h-3" /> MODIFY
          </span>
        );
      case "delete":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <FileX className="w-3 h-3" /> DELETE
          </span>
        );
    }
  };

  return (
    <div className={`rounded-xl border border-slate-800 bg-slate-900/90 p-4 backdrop-blur-md ${className}`}>
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2">
          <FileCode className="w-5 h-5 text-cyan-400" />
          <h3 className="font-semibold text-sm text-slate-100">File Manifest Blueprint</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            v{manifest.manifestVersion}
          </span>
        </div>
        <span className="text-xs text-slate-400">
          Total Files: <strong className="text-cyan-400">{manifest.totalFiles}</strong>
        </span>
      </div>

      <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
        {manifest.files.map((file, idx) => {
          const isExpanded = expandedFiles[file.path] ?? true;
          return (
            <div key={file.path || idx} className="rounded-lg border border-slate-800/80 bg-slate-950/60 overflow-hidden">
              <div
                onClick={() => toggleExpand(file.path)}
                className="flex items-center justify-between p-2.5 cursor-pointer hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <button className="text-slate-400 hover:text-slate-200">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  <span className="font-mono text-xs text-slate-200 truncate">{file.path}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {file.estimatedLines && (
                    <span className="text-[11px] text-slate-400 font-mono">~{file.estimatedLines} loc</span>
                  )}
                  {getActionBadge(file.action)}
                </div>
              </div>

              {isExpanded && (
                <div className="px-3 pb-3 pt-1 border-t border-slate-800/50 bg-slate-900/40 space-y-2 text-xs">
                  <p className="text-slate-300 italic">{file.description}</p>
                  {file.dependencies && file.dependencies.length > 0 ? (
                    <div>
                      <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1 mb-1">
                        <Link2 className="w-3 h-3 text-cyan-400" /> Dependencies ({file.dependencies.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {file.dependencies.map((dep, dIdx) => (
                          <span
                            key={dIdx}
                            className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60"
                          >
                            {dep}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400">No external or local file dependencies</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
