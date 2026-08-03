"use client";

import React, { useState } from "react";
import { Check, X, AlertTriangle, Lightbulb, ShieldCheck, RefreshCw } from "lucide-react";
import { FileManifestUI, ManifestTreeView } from "./manifest-tree-view";

export interface ValidationErrorUI {
  type: "schema" | "import_resolution" | "file_limit" | "orphan" | "path_constraint";
  affectedFiles: string[];
  message: string;
  suggestion: string;
}

export interface ValidationResultUI {
  valid: boolean;
  errors: ValidationErrorUI[];
}

interface ManifestApprovalUIProps {
  manifestId?: string;
  manifest: FileManifestUI;
  validation: ValidationResultUI;
  onApprove: (manifestId?: string) => Promise<void> | void;
  onReject: (manifestId?: string) => Promise<void> | void;
  onRetry?: () => Promise<void> | void;
}

export function ManifestApprovalUI({
  manifestId,
  manifest,
  validation,
  onApprove,
  onReject,
  onRetry,
}: ManifestApprovalUIProps) {
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      await onApprove(manifestId);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      await onReject(manifestId);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <ManifestTreeView manifest={manifest} />

      {!validation.valid && validation.errors.length > 0 && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs space-y-3">
          <div className="flex items-center gap-2 text-rose-400 font-semibold">
            <AlertTriangle className="w-4 h-4" />
            <span>Manifest Validation Rejections ({validation.errors.length})</span>
          </div>

          <div className="space-y-2">
            {validation.errors.map((err, idx) => (
              <div key={idx} className="p-2.5 rounded-lg bg-slate-950/70 border border-rose-500/20 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-rose-300 font-medium">[{err.type.toUpperCase()}]</span>
                  {err.affectedFiles.length > 0 && (
                    <span className="text-[11px] text-slate-400 truncate max-w-[200px]">
                      Files: {err.affectedFiles.join(", ")}
                    </span>
                  )}
                </div>
                <p className="text-slate-200">{err.message}</p>
                {err.suggestion && (
                  <p className="text-amber-400/90 flex items-start gap-1 pt-1">
                    <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{err.suggestion}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/90 border border-slate-800">
        <div className="flex items-center gap-2 text-xs">
          {validation.valid ? (
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Manifest Pre-Validation Passed
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-rose-400 font-medium">
              <AlertTriangle className="w-4 h-4 text-rose-400" /> Validation Issues Required Resolution
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onRetry && !validation.valid && (
            <button
              onClick={() => onRetry()}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Regenerate
            </button>
          )}

          <button
            onClick={handleReject}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 disabled:opacity-50 transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Reject
          </button>

          <button
            onClick={handleApprove}
            disabled={loading || !validation.valid}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400 disabled:opacity-50 disabled:hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-500/20"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" /> Approve & Generate
          </button>
        </div>
      </div>
    </div>
  );
}
