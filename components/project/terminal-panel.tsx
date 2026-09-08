"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Terminal,
  Play,
  RotateCcw,
  Square,
  Trash2,
  Folder,
  Layers,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { projectApi } from "@/lib/project-api";
import {
  terminalApi,
  type TerminalSessionData,
  createAnsiSanitizer,
  getTerminalEntryStyle,
  isSyntheticTerminalError,
} from "@/lib/terminal-api";
import type { ProjectRepository } from "@/lib/types";

interface TerminalLogEntry {
  id: string;
  type: "command" | "stdout" | "stderr" | "system";
  text: string;
  timestamp: Date;
  isError?: boolean;
  isSuccess?: boolean;
}

export function TerminalPanel({ projectId }: { height?: number; projectId?: string }) {
  const [repositories, setRepositories] = useState<ProjectRepository[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState<string | null>(null);
  const [session, setSession] = useState<TerminalSessionData | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [entries, setEntries] = useState<TerminalLogEntry[]>([]);
  const [inputCommand, setInputCommand] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const outputScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionRef = useRef<TerminalSessionData | null>(null);
  sessionRef.current = session;

  // Auto-scroll to bottom whenever entries update
  useEffect(() => {
    if (outputScrollRef.current) {
      outputScrollRef.current.scrollTop = outputScrollRef.current.scrollHeight;
    }
  }, [entries]);

  // Load project repositories
  useEffect(() => {
    if (!projectId) return;

    let mounted = true;
    projectApi
      .getRepositories(projectId)
      .then((repos) => {
        if (!mounted) return;
        setRepositories(repos);
        if (repos.length > 0) {
          const primary = repos.find((r) => r.isPrimary) || repos[0];
          setSelectedRepoId(primary.id);
        }
      })
      .catch((err) => {
        if (mounted) {
          setErrorMessage(err?.message || "Failed to load project repositories");
        }
      });

    return () => {
      mounted = false;
    };
  }, [projectId]);

  // Establish terminal session when selected repository changes
  const startSession = useCallback(
    async (repoId?: string) => {
      if (!projectId) return;

      setIsConnecting(true);
      setErrorMessage(null);

      // If a previous session exists, close it cleanly first
      if (sessionRef.current) {
        terminalApi.closeSession(projectId, sessionRef.current.sessionId).catch(() => {});
        setSession(null);
      }

      try {
        const newSession = await terminalApi.createSession(projectId, repoId);
        setSession(newSession);
        setEntries((prev) => [
          ...prev,
          {
            id: `sys-${Date.now()}`,
            type: "system",
            text: `[Terminal connected] Repository: ${newSession.repositoryName} | Root: ${newSession.cwd}`,
            timestamp: new Date(),
          },
        ]);
      } catch (err: any) {
        const msg = err?.message || "Failed to start terminal session";
        setErrorMessage(msg);
        setEntries((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            type: "stderr",
            text: `[Terminal Error] ${msg}`,
            isError: true,
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsConnecting(false);
      }
    },
    [projectId]
  );

  // Trigger session start on initial repository selection or switch
  useEffect(() => {
    if (selectedRepoId && projectId) {
      startSession(selectedRepoId);
    }

    return () => {
      if (sessionRef.current && projectId) {
        terminalApi.closeSession(projectId, sessionRef.current.sessionId).catch(() => {});
      }
    };
  }, [selectedRepoId, projectId, startSession]);

  const handleRepositoryChange = (newRepoId: string) => {
    if (newRepoId === selectedRepoId) return;
    setSelectedRepoId(newRepoId);
    setEntries((prev) => [
      ...prev,
      {
        id: `sys-switch-${Date.now()}`,
        type: "system",
        text: `--- Switched repository target ---`,
        timestamp: new Date(),
      },
    ]);
  };

  const executeCommand = async (cmdToRun: string) => {
    const trimmed = cmdToRun.trim();
    if (!trimmed || !session || !projectId || isRunning) return;

    // Record in history
    setCommandHistory((prev) => [trimmed, ...prev.filter((h) => h !== trimmed)].slice(0, 50));
    setHistoryIndex(-1);
    setInputCommand("");
    setIsRunning(true);
    setErrorMessage(null);

    // Display command entry
    setEntries((prev) => [
      ...prev,
      {
        id: `cmd-${Date.now()}`,
        type: "command",
        text: `$ ${trimmed}`,
        timestamp: new Date(),
      },
    ]);

    const stdoutSanitizer = createAnsiSanitizer();
    const stderrSanitizer = createAnsiSanitizer();
    const isClear = trimmed === "clear" || trimmed === "cls";

    try {
      await terminalApi.runCommand(projectId, session.sessionId, trimmed, {
        onStdout: (data) => {
          if (data.text.includes("\x1bc")) {
            setEntries([]);
          }
          const cleanText = stdoutSanitizer.sanitize(data.text);
          if (cleanText) {
            setEntries((prev) => [
              ...prev,
              {
                id: `out-${Date.now()}-${Math.random()}`,
                type: "stdout",
                text: cleanText,
                timestamp: new Date(),
              },
            ]);
          }
        },
        onStderr: (data) => {
          const cleanText = stderrSanitizer.sanitize(data.text);
          if (cleanText) {
            const isSynthError = isSyntheticTerminalError(cleanText);
            setEntries((prev) => [
              ...prev,
              {
                id: `err-${Date.now()}-${Math.random()}`,
                type: "stderr",
                text: cleanText,
                isError: isSynthError,
                timestamp: new Date(),
              },
            ]);
          }
        },
        onExit: (data) => {
          // Update session cwd if cd updated it
          if (data.cwd && session.cwd !== data.cwd) {
            setSession((s) => (s ? { ...s, cwd: data.cwd } : null));
          }
          if (data.exitCode !== null) {
            if (data.exitCode === 0) {
              if (!isClear) {
                setEntries((prev) => [
                  ...prev,
                  {
                    id: `exit-${Date.now()}`,
                    type: "system",
                    text: `[Process exited with code 0]`,
                    isSuccess: true,
                    timestamp: new Date(),
                  },
                ]);
              }
            } else {
              setEntries((prev) => [
                ...prev,
                {
                  id: `exit-${Date.now()}`,
                  type: "stderr",
                  text: `[Process exited with code ${data.exitCode}]`,
                  isError: true,
                  timestamp: new Date(),
                },
              ]);
            }
          }
        },
        onError: (data) => {
          setEntries((prev) => [
            ...prev,
            {
              id: `err-ev-${Date.now()}`,
              type: "stderr",
              text: `[Error] ${data.message}`,
              isError: true,
              timestamp: new Date(),
            },
          ]);
        },
      });

      // Flush any remaining buffered characters from sanitizers
      const flushOut = stdoutSanitizer.flush();
      if (flushOut) {
        setEntries((prev) => [
          ...prev,
          {
            id: `out-flush-${Date.now()}`,
            type: "stdout",
            text: flushOut,
            timestamp: new Date(),
          },
        ]);
      }
      const flushErr = stderrSanitizer.flush();
      if (flushErr) {
        setEntries((prev) => [
          ...prev,
          {
            id: `err-flush-${Date.now()}`,
            type: "stderr",
            text: flushErr,
            isError: isSyntheticTerminalError(flushErr),
            timestamp: new Date(),
          },
        ]);
      }
    } catch (err: any) {
      setEntries((prev) => [
        ...prev,
        {
          id: `cmd-err-${Date.now()}`,
          type: "stderr",
          text: `[Command Failed] ${err?.message || "Execution error"}`,
          isError: true,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsRunning(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleInterrupt = async () => {
    if (!session || !projectId || !isRunning) return;
    try {
      await terminalApi.interruptSession(projectId, session.sessionId);
      setEntries((prev) => [
        ...prev,
        {
          id: `int-${Date.now()}`,
          type: "system",
          text: "^C [Process interrupted]",
          timestamp: new Date(),
        },
      ]);
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to interrupt");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      executeCommand(inputCommand);
    } else if (e.key === "c" && e.ctrlKey) {
      if (isRunning) {
        e.preventDefault();
        handleInterrupt();
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const nextIdx = Math.min(historyIndex + 1, commandHistory.length - 1);
        setHistoryIndex(nextIdx);
        setInputCommand(commandHistory[nextIdx]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setInputCommand(commandHistory[nextIdx]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInputCommand("");
      }
    }
  };

  const clearOutput = () => {
    setEntries([]);
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-[#e6edf3] font-mono text-xs select-text overflow-hidden">
      {/* Terminal Control Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#161b22] border-b border-[#30363d] gap-2 shrink-0 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <Terminal className="h-3.5 w-3.5 text-violet-400 shrink-0" />

          {/* Multi-Repo Repository Selector */}
          {repositories.length > 1 ? (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Repo:</span>
              <Select value={selectedRepoId || ""} onValueChange={handleRepositoryChange}>
                <SelectTrigger className="h-6 text-[11px] font-mono bg-[#0d1117] border-[#30363d] w-36 text-foreground">
                  <SelectValue placeholder="Select repository" />
                </SelectTrigger>
                <SelectContent className="bg-[#161b22] border-[#30363d] text-foreground">
                  {repositories.map((r) => (
                    <SelectItem key={r.id} value={r.id} className="text-xs font-mono">
                      {r.name} {r.role ? `(${r.role})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : session ? (
            <Badge variant="outline" className="h-5 text-[10px] border-[#30363d] text-violet-300 font-mono">
              <Layers className="h-2.5 w-2.5 mr-1" />
              {session.repositoryName}
            </Badge>
          ) : null}

          {/* CWD Display */}
          {session && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground truncate max-w-sm" title={session.cwd}>
              <Folder className="h-3 w-3 text-cyan-400 shrink-0" />
              <span className="truncate text-cyan-300">{session.cwd}</span>
            </div>
          )}
        </div>

        {/* Status & Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isConnecting ? (
            <span className="text-[10px] text-amber-400 flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Connecting...
            </span>
          ) : session ? (
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Ready
            </span>
          ) : (
            <span className="text-[10px] text-rose-400 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> Disconnected
            </span>
          )}

          {isRunning && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleInterrupt}
              className="h-6 px-2 text-[10px] border-rose-500/40 text-rose-300 hover:bg-rose-500/10"
              title="Interrupt running command (Ctrl+C)"
            >
              <Square className="h-2.5 w-2.5 mr-1 fill-current" /> Stop
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={clearOutput}
            className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground"
            title="Clear output"
          >
            <Trash2 className="h-3 w-3" />
          </Button>

          {!session && !isConnecting && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => startSession(selectedRepoId || undefined)}
              className="h-6 px-2 text-[10px] border-[#30363d]"
            >
              <RotateCcw className="h-3 w-3 mr-1" /> Reconnect
            </Button>
          )}
        </div>
      </div>

      {/* Terminal Output Area */}
      <div
        ref={outputScrollRef}
        className="flex-1 p-3 overflow-y-auto space-y-1 select-text selection:bg-violet-500/30"
      >
        {entries.length === 0 && (
          <div className="text-muted-foreground italic text-xs">
            ANKA Interactive Terminal ready. Type commands below (e.g. `pwd`, `ls`, `npm test`, `git status`).
          </div>
        )}

        {entries.map((entry) => (
          <div
            key={entry.id}
            className={`whitespace-pre-wrap break-all leading-relaxed ${getTerminalEntryStyle(entry)}`}
          >
            {entry.text}
          </div>
        ))}

        {isRunning && (
          <div className="text-amber-400 flex items-center gap-1.5 pt-1 animate-pulse">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Executing...</span>
          </div>
        )}
      </div>

      {/* Error banner */}
      {errorMessage && (
        <div className="px-3 py-1 bg-rose-500/15 border-t border-rose-500/30 text-rose-300 text-[11px] flex items-center justify-between">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-rose-200">
            &times;
          </button>
        </div>
      )}

      {/* Terminal Input Bar */}
      <div className="flex items-center gap-2 p-2 bg-[#161b22] border-t border-[#30363d] shrink-0">
        <span className="text-violet-400 font-bold select-none pl-1">$</span>
        <Input
          ref={inputRef}
          value={inputCommand}
          onChange={(e) => setInputCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isRunning ? "Command running (press Stop or Ctrl+C)..." : "Type command and press Enter..."}
          disabled={!session || isRunning}
          className="h-7 text-xs font-mono bg-[#0d1117] border-[#30363d] text-foreground focus-visible:ring-violet-500 flex-1"
        />
        <Button
          size="sm"
          onClick={() => executeCommand(inputCommand)}
          disabled={!session || isRunning || !inputCommand.trim()}
          className="h-7 px-3 bg-violet-600 hover:bg-violet-700 text-white text-xs"
        >
          <Play className="h-3 w-3 mr-1" /> Run
        </Button>
      </div>
    </div>
  );
}
