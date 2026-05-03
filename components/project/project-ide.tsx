"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { projectApi } from "@/lib/project-api";
import type { Project } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  ChevronRight,
  ChevronDown,
  FileText,
  FolderOpen,
  Folder,
  Save,
  RefreshCw,
  X,
  ExternalLink,
  Check,
  AlertCircle,
  Github,
  Loader2,
  Terminal,
  Globe,
  GitCommit,
} from "lucide-react";
import { TerminalPanel } from "./terminal-panel";
import { BrowserPanel } from "./browser-panel";

const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <EditorSkeleton />,
});

function EditorSkeleton() {
  return (
    <div className="flex-1 flex items-center justify-center bg-[#1e1e1e]">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

// ─── File tree ────────────────────────────────────────────────────────────────

interface TreeNode {
  name: string;
  path: string;
  type: "file" | "dir";
  children: TreeNode[];
}

function buildTree(paths: string[]): TreeNode[] {
  const root: TreeNode[] = [];
  for (const path of paths) {
    const parts = path.split("/");
    let nodes = root;
    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      const isLast = i === parts.length - 1;
      let node = nodes.find((n) => n.name === name);
      if (!node) {
        node = { name, path: parts.slice(0, i + 1).join("/"), type: isLast ? "file" : "dir", children: [] };
        nodes.push(node);
        nodes.sort((a, b) => {
          if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
          return a.name.localeCompare(b.name);
        });
      }
      nodes = node.children;
    }
  }
  return root;
}

function langFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    ts: "typescript", tsx: "typescript", js: "javascript", jsx: "javascript",
    json: "json", md: "markdown", css: "css", html: "html",
    py: "python", go: "go", rs: "rust", sh: "shell",
    yml: "yaml", yaml: "yaml", prisma: "prisma", sql: "sql",
  };
  return map[ext] || "plaintext";
}

function fileColor(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    ts: "text-blue-400", tsx: "text-blue-400", js: "text-yellow-400", jsx: "text-yellow-400",
    json: "text-yellow-300", md: "text-gray-400", css: "text-pink-400", html: "text-orange-400",
    py: "text-green-400", go: "text-cyan-400", rs: "text-orange-500", prisma: "text-indigo-400",
  };
  return map[ext] || "text-muted-foreground";
}

function TreeItem({ node, depth, selectedPath, openDirs, onToggleDir, onSelectFile, modifiedPaths }: {
  node: TreeNode; depth: number; selectedPath: string | null;
  openDirs: Set<string>; onToggleDir: (p: string) => void;
  onSelectFile: (p: string) => void; modifiedPaths: Set<string>;
}) {
  const isOpen = openDirs.has(node.path);
  const isSelected = node.path === selectedPath;

  if (node.type === "dir") {
    return (
      <div>
        <button onClick={() => onToggleDir(node.path)} style={{ paddingLeft: `${8 + depth * 12}px` }}
          className="flex items-center w-full gap-1 py-0.5 pr-2 hover:bg-white/5 text-xs rounded">
          {isOpen ? <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />}
          {isOpen ? <FolderOpen className="h-3.5 w-3.5 shrink-0 text-yellow-400" /> : <Folder className="h-3.5 w-3.5 shrink-0 text-yellow-400" />}
          <span className="truncate text-foreground/80">{node.name}</span>
        </button>
        {isOpen && node.children.map((c) => (
          <TreeItem key={c.path} node={c} depth={depth + 1} selectedPath={selectedPath}
            openDirs={openDirs} onToggleDir={onToggleDir} onSelectFile={onSelectFile} modifiedPaths={modifiedPaths} />
        ))}
      </div>
    );
  }

  return (
    <button onClick={() => onSelectFile(node.path)} style={{ paddingLeft: `${8 + depth * 12}px`, paddingRight: "8px" }}
      className={cn("flex items-center w-full gap-1.5 py-0.5 hover:bg-white/5 text-xs rounded", isSelected && "bg-primary/15 text-primary")}>
      <FileText className={cn("h-3.5 w-3.5 shrink-0", fileColor(node.name))} />
      <span className="truncate flex-1">{node.name}</span>
      {modifiedPaths.has(node.path) && <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 shrink-0" />}
    </button>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OpenFile {
  path: string;
  content: string;
  savedContent: string;
  loading: boolean;
  error: string | null;
}

export interface AgentFileChange {
  path: string;
  content: string;
  description: string;
}

interface ProjectIDEProps {
  project: Project;
  pendingChanges?: AgentFileChange[] | null;
  onChangesApplied?: () => void;
}


// ─── Main component ───────────────────────────────────────────────────────────

export function ProjectIDE({ project, pendingChanges, onChangesApplied }: ProjectIDEProps) {
  const [snapshot, setSnapshot] = useState<{ repoName: string; fileTree: string[]; lastSyncedAt: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [githubUrl, setGithubUrl] = useState(project.githubUrl || "");
  const [syncError, setSyncError] = useState<string | null>(null);
  const [treeNodes, setTreeNodes] = useState<TreeNode[]>([]);
  const [openDirs, setOpenDirs] = useState<Set<string>>(new Set());

  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ sha: string; url: string } | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [commitMessage, setCommitMessage] = useState("");

  const [bottomHeight, setBottomHeight] = useState(220);
  const [showBottom, setShowBottom] = useState(true);
  const [showBrowser, setShowBrowser] = useState(false);
  const [agentBanner, setAgentBanner] = useState<string | null>(null);

  const dragRef = useRef<{ startY: number; startH: number } | null>(null);

  // Load snapshot
  useEffect(() => {
    projectApi.getRepoSnapshot(project.id).then((snap) => {
      if (snap) { setSnapshot(snap); setTreeNodes(buildTree(snap.fileTree)); }
    });
  }, [project.id]);

  // Apply pending agent changes to editor
  useEffect(() => {
    if (!pendingChanges?.length) return;

    setAgentBanner(`Agent applied ${pendingChanges.length} file${pendingChanges.length !== 1 ? "s" : ""}. Review & save.`);
    setTimeout(() => setAgentBanner(null), 6000);

    setOpenFiles((prev) => {
      let next = [...prev];
      for (const change of pendingChanges) {
        const existing = next.find((f) => f.path === change.path);
        if (existing) {
          // Update existing open file — mark as modified
          next = next.map((f) => f.path === change.path ? { ...f, content: change.content } : f);
        } else {
          // Open as new file with agent's content
          next = [...next, { path: change.path, content: change.content, savedContent: "", loading: false, error: null }];
        }
      }
      return next;
    });

    // Switch active tab to first changed file
    setActiveTab(pendingChanges[0].path);
    onChangesApplied?.();
  }, [pendingChanges]);

  const handleSync = async () => {
    if (!githubUrl.trim()) return;
    setIsSyncing(true); setSyncError(null);
    try {
      await projectApi.syncGithub(project.id, githubUrl.trim());
      if (githubUrl.trim() !== project.githubUrl) await projectApi.update(project.id, { githubUrl: githubUrl.trim() });
      const snap = await projectApi.getRepoSnapshot(project.id);
      if (snap) { setSnapshot(snap); setTreeNodes(buildTree(snap.fileTree)); }
    } catch (err) { setSyncError(err instanceof Error ? err.message : "Sync failed"); }
    finally { setIsSyncing(false); }
  };

  const handleToggleDir = (path: string) => {
    setOpenDirs((prev) => { const n = new Set(prev); n.has(path) ? n.delete(path) : n.add(path); return n; });
  };

  const handleSelectFile = async (path: string) => {
    if (openFiles.find((f) => f.path === path)) { setActiveTab(path); return; }
    setOpenFiles((prev) => [...prev, { path, content: "", savedContent: "", loading: true, error: null }]);
    setActiveTab(path);
    const file = await projectApi.getRepoFile(project.id, path);
    setOpenFiles((prev) => prev.map((f) => f.path === path
      ? file ? { path, content: file.content, savedContent: file.content, loading: false, error: null }
             : { ...f, loading: false, error: "Failed to load file" }
      : f));
  };

  const handleCloseTab = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenFiles((prev) => {
      const next = prev.filter((f) => f.path !== path);
      if (activeTab === path) setActiveTab(next.length > 0 ? next[next.length - 1].path : null);
      return next;
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value === undefined || !activeTab) return;
    setOpenFiles((prev) => prev.map((f) => f.path === activeTab ? { ...f, content: value } : f));
    setSaveResult(null); setSaveError(null);
  };

  const handleSave = useCallback(async () => {
    const file = openFiles.find((f) => f.path === activeTab);
    if (!file || file.content === file.savedContent) return;
    setIsSaving(true); setSaveResult(null); setSaveError(null);
    const msg = commitMessage.trim() || `edit: update ${file.path}`;
    try {
      const result = await projectApi.saveRepoFile(project.id, file.path, file.content, msg);
      setSaveResult(result);
      setCommitMessage("");
      setOpenFiles((prev) => prev.map((f) => f.path === activeTab ? { ...f, savedContent: f.content } : f));
    } catch (err) { setSaveError(err instanceof Error ? err.message : "Save failed"); }
    finally { setIsSaving(false); }
  }, [openFiles, activeTab, commitMessage, project.id]);

  // ⌘S / Ctrl+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); handleSave(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSave]);

  // Drag-to-resize bottom panel
  const onDragStart = (e: React.MouseEvent) => {
    dragRef.current = { startY: e.clientY, startH: bottomHeight };
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const delta = dragRef.current.startY - ev.clientY;
      setBottomHeight(Math.max(120, Math.min(500, dragRef.current.startH + delta)));
    };
    const onUp = () => { dragRef.current = null; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const activeFile = openFiles.find((f) => f.path === activeTab) ?? null;
  const modifiedPaths = new Set(openFiles.filter((f) => f.content !== f.savedContent).map((f) => f.path));
  const isModified = activeFile ? activeFile.content !== activeFile.savedContent : false;

  // No repo connected
  if (!snapshot) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-320px)] gap-4 text-center p-8">
        <Github className="h-10 w-10 text-muted-foreground" />
        <div>
          <p className="font-medium">No repository connected</p>
          <p className="text-sm text-muted-foreground mt-1">Connect a GitHub repo to browse and edit files</p>
        </div>
        <div className="flex gap-2 w-full max-w-sm">
          <Input value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/owner/repo" className="h-8 text-sm" />
          <Button size="sm" onClick={handleSync} disabled={isSyncing || !githubUrl.trim()}>
            {isSyncing ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Connect"}
          </Button>
        </div>
        {syncError && <p className="text-xs text-destructive">{syncError}</p>}
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-280px)] overflow-hidden rounded-lg border bg-background">
      {/* File tree */}
      <div className="w-52 shrink-0 border-r flex flex-col bg-[#1e1e1e] overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 shrink-0">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
            {snapshot.repoName.split("/")[1]}
          </span>
          <button onClick={handleSync} disabled={isSyncing} className="text-muted-foreground hover:text-foreground">
            <RefreshCw className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {treeNodes.map((node) => (
            <TreeItem key={node.path} node={node} depth={0} selectedPath={activeTab}
              openDirs={openDirs} onToggleDir={handleToggleDir}
              onSelectFile={handleSelectFile} modifiedPaths={modifiedPaths} />
          ))}
        </div>
      </div>

      {/* Editor + terminal */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#1e1e1e] min-w-0">
        {/* Agent banner */}
        {agentBanner && (
          <div className="flex items-center justify-between gap-2 px-4 py-2 bg-violet-600/20 border-b border-violet-500/30 shrink-0">
            <span className="text-xs text-violet-300">{agentBanner}</span>
            <button onClick={() => setAgentBanner(null)} className="text-violet-400 hover:text-violet-200"><X className="h-3.5 w-3.5" /></button>
          </div>
        )}

        {/* File tabs */}
        {openFiles.length > 0 && (
          <div className="flex items-center border-b border-white/10 overflow-x-auto shrink-0 bg-[#252526]">
            {openFiles.map((file) => {
              const isActive = file.path === activeTab;
              const modified = file.content !== file.savedContent;
              return (
                <button key={file.path} onClick={() => setActiveTab(file.path)}
                  className={cn("flex items-center gap-1.5 px-3 py-2 text-xs whitespace-nowrap border-r border-white/10 hover:bg-white/5 max-w-48 shrink-0 group",
                    isActive ? "bg-[#1e1e1e] text-foreground border-t border-t-primary" : "text-muted-foreground")}>
                  <FileText className={cn("h-3 w-3 shrink-0", fileColor(file.path.split("/").pop() || ""))} />
                  <span className="truncate">{file.path.split("/").pop()}</span>
                  {modified && <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 shrink-0" />}
                  <X className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-60 hover:opacity-100"
                    onClick={(e) => handleCloseTab(file.path, e)} />
                </button>
              );
            })}
          </div>
        )}

        {/* Save bar */}
        {activeFile && (
          <div className="flex items-center gap-2 px-3 py-1.5 border-b border-white/10 bg-[#252526] shrink-0">
            <span className="text-xs text-muted-foreground font-mono flex-1 truncate">{activeFile.path}</span>
            {isModified && (
              <>
                <GitCommit className="h-3 w-3 text-muted-foreground shrink-0" />
                <Input value={commitMessage} onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder="Commit message..." className="h-6 text-xs w-60 bg-white/5 border-white/10"
                  onKeyDown={(e) => e.key === "Enter" && handleSave()} />
                <Button size="sm" className="h-6 text-xs px-2" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? <RefreshCw className="h-3 w-3 animate-spin" /> : <><Save className="h-3 w-3 mr-1" />Save & Push</>}
                </Button>
              </>
            )}
            {saveResult && (
              <a href={saveResult.url} target="_blank" rel="noreferrer"
                className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 shrink-0">
                <Check className="h-3 w-3" />{saveResult.sha.slice(0, 7)}<ExternalLink className="h-3 w-3" />
              </a>
            )}
            {saveError && <span className="flex items-center gap-1 text-xs text-destructive shrink-0"><AlertCircle className="h-3 w-3" />{saveError}</span>}
          </div>
        )}

        {/* Monaco editor */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {activeFile ? (
            activeFile.loading ? <EditorSkeleton /> :
            activeFile.error ? (
              <div className="flex-1 flex items-center justify-center text-sm text-destructive gap-2 h-full">
                <AlertCircle className="h-4 w-4" />{activeFile.error}
              </div>
            ) : (
              <Editor
                height="100%"
                language={langFromPath(activeFile.path)}
                value={activeFile.content}
                onChange={handleEditorChange}
                theme="vs-dark"
                options={{
                  fontSize: 13, lineHeight: 20,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  wordWrap: "on", tabSize: 2,
                  renderLineHighlight: "line",
                  smoothScrolling: true,
                  cursorSmoothCaretAnimation: "on",
                  padding: { top: 8 },
                }}
              />
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
              <FileText className="h-10 w-10 opacity-20" />
              <p className="text-sm">Select a file to edit</p>
              <p className="text-xs opacity-50">⌘S / Ctrl+S to save & push</p>
            </div>
          )}
        </div>

        {/* Drag handle */}
        {showBottom && (
          <div onMouseDown={onDragStart}
            className="h-1 bg-white/10 hover:bg-primary/50 cursor-row-resize shrink-0 transition-colors" />
        )}

        {/* Terminal panel */}
        <div className="shrink-0 border-t border-white/10 overflow-hidden bg-[#0d1117]"
          style={{ height: showBottom ? `${bottomHeight}px` : "32px" }}>
          <div className="flex items-center border-b border-white/10 bg-[#161b22] shrink-0 h-8">
            <span className="flex items-center gap-1.5 px-3 h-full text-xs text-foreground border-r border-white/10">
              <Terminal className="h-3.5 w-3.5" />Terminal
            </span>
            <button
              onClick={() => setShowBrowser((v) => !v)}
              className={cn("flex items-center gap-1.5 px-3 h-full text-xs border-r border-white/10 hover:bg-white/5",
                showBrowser ? "text-foreground bg-[#0d1117]" : "text-muted-foreground")}>
              <Globe className="h-3.5 w-3.5" />Browser
            </button>
            <button onClick={() => setShowBottom((v) => !v)}
              className="ml-auto px-3 h-full text-xs text-muted-foreground hover:text-foreground">
              {showBottom ? "▾" : "▴"}
            </button>
          </div>
          {/* Always keep TerminalPanel in DOM so history is preserved */}
          <div style={{ height: showBottom ? `${bottomHeight - 32}px` : "0px", overflow: "hidden" }}>
            <TerminalPanel projectId={project.id} />
          </div>
        </div>
      </div>

      {/* Browser panel — separate right panel */}
      {showBrowser && (
        <div className="w-120 shrink-0 border-l border-white/10 flex flex-col bg-[#0d1117] overflow-hidden">
          <div className="flex items-center justify-between px-3 h-8 border-b border-white/10 bg-[#161b22] shrink-0">
            <span className="flex items-center gap-1.5 text-xs text-foreground">
              <Globe className="h-3.5 w-3.5" />Browser
            </span>
            <button onClick={() => setShowBrowser(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <BrowserPanel />
          </div>
        </div>
      )}
    </div>
  );
}
