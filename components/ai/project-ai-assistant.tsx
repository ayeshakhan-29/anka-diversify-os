"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Bot,
  Send,
  RotateCcw,
  Sparkles,
  Code,
  Bug,
  FileText,
  Lightbulb,
  Copy,
  Check,
  Github,
  RefreshCw,
  FolderOpen,
  Zap,
  MessageSquare,
  GitCommit,
  ExternalLink,
  X,
  Loader2,
  ListTodo,
  CalendarClock,
  ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AIService, type ProposedTask } from "@/lib/ai-service";
import { projectApi } from "@/lib/project-api";
import { aiClient } from "@/lib/ai-client";
import type { Project } from "@/lib/types";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AgentResult {
  explanation: string;
  changes: { path: string; content: string; description: string }[];
  commitMessage: string;
  sessionId: string;
}

type Mode = "chat" | "agent";

const chatPrompts = [
  "Summarize the current project status",
  "What tasks are high priority?",
  "Suggest improvements for the architecture",
  "Generate a progress report",
];

const agentPrompts = [
  "Add error handling to all API calls",
  "Add loading states to the main page",
  "Fix TypeScript errors in the codebase",
  "Add input validation to forms",
];

interface ProjectAIAssistantProps {
  project: Project;
  onAgentChanges?: (changes: { path: string; content: string; description: string }[]) => void;
}

export function ProjectAIAssistant({ project, onAgentChanges }: ProjectAIAssistantProps) {
  const contextId = `project-${project.id}`;

  const getInitialMessages = (): Message[] => [
    {
      id: "1",
      role: "assistant",
      content: `Hi! I'm the AI assistant for **${project.name}**. I have context about this project including its tasks and current phase (${project.phase}).\n\nSwitch to **Agent mode** to have me edit files directly in the Code editor — review the changes, then save & push.`,
      timestamp: new Date(),
    },
  ];

  const AGENT_STORAGE_KEY = `agent-pending-${project.id}`;

  const [mode, setMode] = useState<Mode>("chat");
  const [messages, setMessages] = useState<Message[]>(getInitialMessages);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // GitHub repo state
  const [githubUrl, setGithubUrl] = useState(project.githubUrl || "");
  const [repoSnapshot, setRepoSnapshot] = useState<{ repoName: string; fileTree: string[]; lastSyncedAt: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Agent state
  const [agentResult, setAgentResult] = useState<AgentResult | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [commitMessage, setCommitMessage] = useState("");
  const [isPushing, setIsPushing] = useState(false);
  const [pushResult, setPushResult] = useState<{ sha: string; url: string } | null>(null);
  const [pushError, setPushError] = useState<string | null>(null);
  const [expandedFile, setExpandedFile] = useState<string | null>(null);
  const [isApplyingLocal, setIsApplyingLocal] = useState(false);
  const [applyLocalSuccess, setApplyLocalSuccess] = useState(false);

  // Task proposal state
  const [proposedTasks, setProposedTasks] = useState<ProposedTask[] | null>(null);
  const [selectedProposedTasks, setSelectedProposedTasks] = useState<Set<number>>(new Set());
  const [isAddingTasks, setIsAddingTasks] = useState(false);

  // Load chat history from backend on mount
  useEffect(() => {
    setHistoryLoading(true);
    aiClient.getProjectSessions(project.id)
      .then(({ sessions }) => {
        if (!sessions.length) return null;
        return aiClient.getProjectSessionMessages(project.id, sessions[0].id);
      })
      .then((data) => {
        if (!data?.messages.length) return;
        setMessages([
          getInitialMessages()[0],
          ...data.messages.map((m) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.content,
            timestamp: new Date(m.createdAt),
          })),
        ]);
      })
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, [project.id]);

  // Load pending agent changes from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(AGENT_STORAGE_KEY);
      if (saved) {
        const parsed: AgentResult = JSON.parse(saved);
        setAgentResult(parsed);
        setCommitMessage(parsed.commitMessage);
        setSelectedFiles(new Set(parsed.changes.map((c) => c.path)));
      }
    } catch {}
  }, [AGENT_STORAGE_KEY]);

  // Persist agent result to localStorage whenever it changes
  useEffect(() => {
    if (agentResult) {
      localStorage.setItem(AGENT_STORAGE_KEY, JSON.stringify(agentResult));
    } else {
      localStorage.removeItem(AGENT_STORAGE_KEY);
    }
  }, [agentResult, AGENT_STORAGE_KEY]);

  useEffect(() => {
    projectApi.getRepoSnapshot(project.id).then((snap) => {
      if (snap) setRepoSnapshot(snap);
    });
  }, [project.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, agentResult]);

  const handleSync = async () => {
    if (!githubUrl.trim()) return;
    setIsSyncing(true);
    setSyncError(null);
    try {
      await projectApi.syncGithub(project.id, githubUrl.trim());
      if (githubUrl.trim() !== project.githubUrl) {
        await projectApi.update(project.id, { githubUrl: githubUrl.trim() });
      }
      const snap = await projectApi.getRepoSnapshot(project.id);
      if (snap) setRepoSnapshot(snap);
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const text = input.trim();
    setInput("");
    setIsLoading(true);
    setAgentResult(null);
    setPushResult(null);
    setPushError(null);

    if (mode === "chat") {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: text,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      try {
        const response = await AIService.sendMessage(text, contextId, "project", project.id, project.name);
        setMessages((prev) => [
          ...prev,
          { id: (Date.now() + 1).toString(), role: "assistant", content: response.content, timestamp: new Date() },
        ]);
        if (response.proposedTasks?.length) {
          setProposedTasks(response.proposedTasks);
          setSelectedProposedTasks(new Set(response.proposedTasks.map((_, i) => i)));
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      // Agent mode
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: `[Agent] ${text}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      try {
        const result = await aiClient.runAgent(project.id, text, contextId);

        if (result.changes.length > 0) {
          // Always show diff panel — user picks Apply Locally or Push to GitHub
          setAgentResult(result);
          setCommitMessage(result.commitMessage);
          setSelectedFiles(new Set(result.changes.map((c) => c.path)));
          setApplyLocalSuccess(false);
          // Also route to IDE editor if callback provided
          if (onAgentChanges) onAgentChanges(result.changes);
        }
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: `Agent error: ${err instanceof Error ? err.message : "Unknown error"}`,
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handlePush = async () => {
    if (!agentResult || selectedFiles.size === 0) return;
    setIsPushing(true);
    setPushError(null);
    try {
      const changes = agentResult.changes.filter((c) => selectedFiles.has(c.path));
      const result = await aiClient.pushAgentChanges(project.id, changes, commitMessage);
      setPushResult(result);
      setAgentResult(null);
    } catch (err) {
      setPushError(err instanceof Error ? err.message : "Push failed");
    } finally {
      setIsPushing(false);
    }
  };

  const handleApplyLocal = async () => {
    if (!agentResult || selectedFiles.size === 0) return;
    setIsApplyingLocal(true);
    try {
      const changes = agentResult.changes
        .filter((c) => selectedFiles.has(c.path))
        .map(({ path, content }) => ({ path, content }));
      await projectApi.applyLocalChanges(project.id, changes);
      setApplyLocalSuccess(true);
    } catch (err) {
      setPushError(err instanceof Error ? err.message : "Failed to apply locally");
    } finally {
      setIsApplyingLocal(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    AIService.clearChatContext(contextId);
    setMessages(getInitialMessages());
    setAgentResult(null);
    setPushResult(null);
    setProposedTasks(null);
    setSelectedProposedTasks(new Set());
  };

  const toggleProposedTask = (i: number) => {
    setSelectedProposedTasks((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const handleAddTasksToKanban = async () => {
    if (!proposedTasks || selectedProposedTasks.size === 0) return;
    setIsAddingTasks(true);
    const tasksToAdd = proposedTasks.filter((_, i) => selectedProposedTasks.has(i));
    try {
      await Promise.all(
        tasksToAdd.map((task) =>
          projectApi.createTask(project.id, {
            title: task.title,
            description: task.description,
            priority: task.priority,
            phase: task.phase || project.phase || undefined,
            status: "todo",
          })
        )
      );
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: `Added **${tasksToAdd.length} task${tasksToAdd.length !== 1 ? "s" : ""}** to the Kanban board. Switch to the Kanban tab to see them.`,
          timestamp: new Date(),
        },
      ]);
      setProposedTasks(null);
      setSelectedProposedTasks(new Set());
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: `Failed to add tasks: ${err instanceof Error ? err.message : "Unknown error"}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsAddingTasks(false);
    }
  };

  const handleQuickAction = async (prompt: string) => {
    if (isLoading) return;
    setIsLoading(true);
    setProposedTasks(null);
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "user", content: prompt, timestamp: new Date() },
    ]);
    try {
      const response = await AIService.sendMessage(prompt, contextId, "project", project.id, project.name);
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", content: response.content, timestamp: new Date() },
      ]);
      if (response.proposedTasks?.length) {
        setProposedTasks(response.proposedTasks);
        setSelectedProposedTasks(new Set(response.proposedTasks.map((_, i) => i)));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleFile = (path: string) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const suggestions = mode === "chat" ? chatPrompts : agentPrompts;

  return (
    <div className="flex gap-4 p-4 h-[calc(100vh-320px)]">
      {/* Main chat / agent panel */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="border-b shrink-0 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", mode === "agent" ? "bg-violet-600" : "bg-primary")}>
                {mode === "agent" ? <Zap className="h-5 w-5 text-white" /> : <Bot className="h-5 w-5 text-primary-foreground" />}
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">
                  {project.name} — {mode === "agent" ? "Coding Agent" : "AI Assistant"}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {mode === "agent" ? "Reads & edits your codebase" : "Project-scoped context"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Mode toggle */}
              <div className="flex rounded-md border overflow-hidden text-xs">
                <button
                  onClick={() => setMode("chat")}
                  className={cn("flex items-center gap-1 px-2.5 py-1.5 transition-colors", mode === "chat" ? "bg-primary text-primary-foreground" : "hover:bg-secondary")}
                >
                  <MessageSquare className="h-3 w-3" />
                  Chat
                </button>
                <button
                  onClick={() => setMode("agent")}
                  className={cn("flex items-center gap-1 px-2.5 py-1.5 transition-colors", mode === "agent" ? "bg-violet-600 text-white" : "hover:bg-secondary")}
                >
                  <Zap className="h-3 w-3" />
                  Agent
                </button>
              </div>
              <Badge variant="outline" className="text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                GPT-4
              </Badge>
              <Button variant="outline" size="sm" onClick={handleClear}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
          {/* History loading */}
          {historyLoading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading conversation history...
            </div>
          )}
          {/* Chat messages */}
          {messages.map((message) => (
            <div key={message.id} className={cn("flex gap-3", message.role === "user" && "flex-row-reverse")}>
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className={cn(message.role === "assistant" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground")}>
                  {message.role === "assistant" ? <Bot className="h-4 w-4" /> : "ME"}
                </AvatarFallback>
              </Avatar>
              <div className={cn("flex-1 max-w-[80%] space-y-1", message.role === "user" && "flex flex-col items-end")}>
                <div className={cn("rounded-lg p-3 text-sm", message.role === "assistant" ? "bg-secondary/50" : "bg-primary text-primary-foreground")}>
                  {message.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-pre:p-0 prose-pre:bg-transparent">
                      <ReactMarkdown
                        components={{
                          code({ node, className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || "");
                            const isInline = !match;
                            if (isInline) {
                              return <code className="bg-black/20 rounded px-1 py-0.5 text-xs font-mono" {...props}>{children}</code>;
                            }
                            const codeStr = String(children).replace(/\n$/, "");
                            return (
                              <div className="relative group my-2">
                                <button
                                  onClick={() => copyToClipboard(codeStr, `code-${codeStr.slice(0, 20)}`)}
                                  className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-secondary rounded p-1"
                                >
                                  {copiedId === `code-${codeStr.slice(0, 20)}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                </button>
                                <SyntaxHighlighter
                                  style={oneDark}
                                  language={match[1]}
                                  PreTag="div"
                                  customStyle={{ margin: 0, borderRadius: "0.375rem", fontSize: "0.75rem" }}
                                >
                                  {codeStr}
                                </SyntaxHighlighter>
                              </div>
                            );
                          },
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  {message.role === "assistant" && (
                    <button onClick={() => copyToClipboard(message.content, message.id)} className="text-muted-foreground hover:text-foreground transition-colors">
                      {copiedId === message.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Loading */}
          {isLoading && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className={cn(mode === "agent" ? "bg-violet-600" : "bg-primary", "text-white")}>
                  {mode === "agent" ? <Zap className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-2 rounded-lg bg-secondary/50 p-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-primary animate-bounce" />
                  <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
                  <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:0.4s]" />
                </div>
                {mode === "agent" && <span className="text-xs text-muted-foreground ml-1">Analyzing codebase...</span>}
              </div>
            </div>
          )}

          {/* Agent result — diff review panel */}
          {agentResult && (
            <div className="border border-violet-500/30 rounded-lg overflow-hidden bg-violet-500/5">
              <div className="flex items-center justify-between px-4 py-3 bg-violet-500/10 border-b border-violet-500/20">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-violet-400" />
                  <span className="text-sm font-medium">Agent proposed {agentResult.changes.length} file{agentResult.changes.length !== 1 ? "s" : ""}</span>
                </div>
                <button onClick={() => setAgentResult(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-4 space-y-3">
                <p className="text-sm text-muted-foreground">{agentResult.explanation}</p>

                {/* File list with checkboxes */}
                <div className="space-y-1.5">
                  {agentResult.changes.map((change) => (
                    <div key={change.path} className="rounded-md border bg-background overflow-hidden">
                      <div
                        className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-secondary/30"
                        onClick={() => setExpandedFile(expandedFile === change.path ? null : change.path)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedFiles.has(change.path)}
                          onChange={() => toggleFile(change.path)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-3.5 w-3.5 accent-violet-500"
                        />
                        <Code className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                        <span className="text-xs font-mono flex-1 truncate">{change.path}</span>
                        <span className="text-xs text-muted-foreground truncate max-w-48">{change.description}</span>
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

                {/* Commit message + push */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-2">
                    <GitCommit className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <Input
                      value={commitMessage}
                      onChange={(e) => setCommitMessage(e.target.value)}
                      placeholder="Commit message..."
                      className="h-7 text-xs font-mono"
                    />
                  </div>
                  {pushError && <p className="text-xs text-destructive">{pushError}</p>}
                  {applyLocalSuccess && (
                    <p className="text-xs text-green-500 flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" /> Files written to local project — run it in the terminal to preview.
                    </p>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    {project.localPath && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-green-500/40 text-green-400 hover:bg-green-500/10 text-xs h-8"
                        onClick={handleApplyLocal}
                        disabled={isApplyingLocal || selectedFiles.size === 0}
                      >
                        {isApplyingLocal ? (
                          <><RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" />Applying...</>
                        ) : (
                          <><FolderOpen className="h-3.5 w-3.5 mr-1" />Apply Locally</>
                        )}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      className="flex-1 bg-violet-600 hover:bg-violet-700 text-white text-xs h-8"
                      onClick={handlePush}
                      disabled={isPushing || selectedFiles.size === 0 || !commitMessage.trim()}
                    >
                      {isPushing ? (
                        <><RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" />Pushing...</>
                      ) : (
                        <><Github className="h-3.5 w-3.5 mr-1" />Push to GitHub</>
                      )}
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setAgentResult(null)}>
                      Discard
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Task proposal card */}
          {proposedTasks && proposedTasks.length > 0 && (
            <div className="border border-green-500/30 rounded-lg overflow-hidden bg-green-500/5">
              <div className="flex items-center justify-between px-4 py-3 bg-green-500/10 border-b border-green-500/20">
                <div className="flex items-center gap-2">
                  <ListTodo className="h-4 w-4 text-green-400" />
                  <span className="text-sm font-medium">AI proposed {proposedTasks.length} task{proposedTasks.length !== 1 ? "s" : ""}</span>
                  <span className="text-xs text-muted-foreground hidden sm:inline">— select which to add to Kanban</span>
                </div>
                <button onClick={() => { setProposedTasks(null); setSelectedProposedTasks(new Set()); }} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-4 space-y-2">
                {proposedTasks.map((task, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-md border bg-background p-3 cursor-pointer hover:bg-secondary/20"
                    onClick={() => toggleProposedTask(i)}>
                    <input
                      type="checkbox"
                      checked={selectedProposedTasks.has(i)}
                      onChange={() => toggleProposedTask(i)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-3.5 w-3.5 mt-0.5 accent-green-500 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{task.title}</span>
                        <Badge variant="outline" className={cn("text-xs shrink-0",
                          task.priority === "high" ? "border-red-500/40 text-red-400" :
                          task.priority === "medium" ? "border-yellow-500/40 text-yellow-400" :
                          "border-green-500/40 text-green-400"
                        )}>{task.priority}</Badge>
                        {task.phase && <span className="text-xs text-muted-foreground">{task.phase}</span>}
                      </div>
                      {task.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{task.description}</p>}
                    </div>
                  </div>
                ))}
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs h-8"
                    onClick={handleAddTasksToKanban}
                    disabled={isAddingTasks || selectedProposedTasks.size === 0}
                  >
                    {isAddingTasks
                      ? <><RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" />Adding...</>
                      : <><Check className="h-3.5 w-3.5 mr-1" />Add {selectedProposedTasks.size} to Kanban</>}
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-xs"
                    onClick={() => { setProposedTasks(null); setSelectedProposedTasks(new Set()); }}>
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Push success */}
          {pushResult && (
            <div className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/5 p-3">
              <Check className="h-5 w-5 text-green-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-500">Pushed successfully</p>
                <p className="text-xs text-muted-foreground font-mono truncate">{pushResult.sha.slice(0, 7)}</p>
              </div>
              <a href={pushResult.url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          )}
        </div>

        <div className="border-t p-3 shrink-0">
          <div className="flex gap-2">
            <Textarea
              placeholder={mode === "agent" ? `Tell the agent what to code in ${project.name}...` : `Ask about ${project.name}...`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-15 resize-none"
              disabled={isLoading}
            />
            <Button
              className={cn("shrink-0", mode === "agent" && "bg-violet-600 hover:bg-violet-700")}
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
            >
              {mode === "agent" ? <Zap className="h-4 w-4" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          {mode === "chat" && (
            <div className="flex gap-1.5 mt-2 flex-wrap">
              <button
                onClick={() => handleQuickAction("Extract all actionable tasks from our discussion and propose them as Kanban tasks with priorities.")}
                disabled={isLoading}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary/50 hover:bg-secondary text-xs text-muted-foreground transition-colors disabled:opacity-50"
              >
                <ListTodo className="h-3 w-3" />Extract Tasks
              </button>
              <button
                onClick={() => handleQuickAction("Give me a quick standup summary: what tasks are done, what's in progress, and what might be blocked?")}
                disabled={isLoading}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary/50 hover:bg-secondary text-xs text-muted-foreground transition-colors disabled:opacity-50"
              >
                <CalendarClock className="h-3 w-3" />Standup
              </button>
              <button
                onClick={() => handleQuickAction("Based on the project goals and current tasks, which 3 tasks should we focus on first this week and why?")}
                disabled={isLoading}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary/50 hover:bg-secondary text-xs text-muted-foreground transition-colors disabled:opacity-50"
              >
                <ArrowUpDown className="h-3 w-3" />Prioritize
              </button>
            </div>
          )}
          {mode === "agent" && (
            <p className="text-xs text-muted-foreground mt-1.5">
              Agent will propose file changes — you review and confirm before pushing.
            </p>
          )}
        </div>
      </Card>

      {/* Sidebar */}
      <div className="w-64 space-y-3 shrink-0 hidden lg:flex lg:flex-col overflow-y-auto">
        {/* GitHub Repository */}
        <Card>
          <CardHeader className="pb-2 pt-3 px-3">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Github className="h-3 w-3" />
              Repository
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 space-y-2">
            {repoSnapshot ? (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-green-500">
                  <FolderOpen className="h-3.5 w-3.5 shrink-0" />
                  <span className="font-medium truncate">{repoSnapshot.repoName}</span>
                </div>
                <p className="text-xs text-muted-foreground">{repoSnapshot.fileTree.length} files indexed</p>
                <p className="text-xs text-muted-foreground">Synced {new Date(repoSnapshot.lastSyncedAt).toLocaleDateString()}</p>
                <div className="flex gap-1.5">
                  <Input value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="github.com/owner/repo" className="h-7 text-xs" />
                  <Button size="sm" variant="outline" className="h-7 px-2 shrink-0" onClick={handleSync} disabled={isSyncing}>
                    <RefreshCw className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")} />
                  </Button>
                </div>
                {syncError && <p className="text-xs text-destructive">{syncError}</p>}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Connect a GitHub repo to give the AI access to your codebase.</p>
                <Input value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/owner/repo" className="h-7 text-xs" />
                <Button size="sm" className="w-full h-7 text-xs" onClick={handleSync} disabled={isSyncing || !githubUrl.trim()}>
                  {isSyncing ? <><RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" />Syncing...</> : <><Github className="h-3.5 w-3.5 mr-1" />Connect & Sync</>}
                </Button>
                {syncError && <p className="text-xs text-destructive">{syncError}</p>}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Project context */}
        <Card>
          <CardHeader className="pb-2 pt-3 px-3">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Project Context</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phase</span>
              <Badge variant="outline" className="text-xs">{project.phase}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tasks</span>
              <span>{project.tasks.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Progress</span>
              <span>{project.progress}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Suggested prompts */}
        <Card>
          <CardHeader className="pb-2 pt-3 px-3">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Lightbulb className="h-3 w-3" />
              {mode === "agent" ? "Agent Tasks" : "Suggestions"}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 space-y-1">
            {suggestions.map((prompt, i) => (
              <button
                key={i}
                onClick={() => setInput(prompt)}
                className="w-full text-left p-2 rounded-md bg-secondary/50 hover:bg-secondary text-xs text-foreground transition-colors"
              >
                {prompt}
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Capabilities */}
        <Card>
          <CardHeader className="pb-2 pt-3 px-3">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {mode === "agent" ? "Agent can" : "Capabilities"}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 space-y-2">
            {mode === "agent" ? [
              { icon: Code, label: "Edit existing files" },
              { icon: FileText, label: "Create new files" },
              { icon: Bug, label: "Fix bugs in code" },
              { icon: Github, label: "Push to GitHub" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-xs text-muted-foreground">
                <Icon className="h-3.5 w-3.5 text-violet-400" />
                {label}
              </div>
            )) : [
              { icon: Code, label: "Code help" },
              { icon: Bug, label: "Debug issues" },
              { icon: FileText, label: "Documentation" },
              { icon: Lightbulb, label: "Suggestions" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-xs text-muted-foreground">
                <Icon className="h-3.5 w-3.5 text-primary" />
                {label}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
