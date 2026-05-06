"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, RotateCcw, Sparkles, Zap, MessageSquare, Loader2, Check, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { AIService, type ProposedTask, type EpicProposal, type ProjectHealth } from "@/lib/ai-service";
import { projectApi } from "@/lib/project-api";
import { aiClient, type PullRequest, type PRReview } from "@/lib/ai-client";
import type { Project } from "@/lib/types";

import type { Message, AgentResult } from "./types";
import { ChatMessage } from "./chat-message";
import { AgentDiffPanel } from "./agent-diff-panel";
import { TaskProposalCard } from "./task-proposal-card";
import { EpicProposalCard } from "./epic-proposal-card";
import { PRReviewPanel } from "./pr-review-panel";
import { AISidebar } from "./ai-sidebar";
import { ChatInput } from "./chat-input";

type Mode = "chat" | "agent";

interface ProjectAIAssistantProps {
  project: Project;
  onAgentChanges?: (changes: { path: string; content: string; description: string }[]) => void;
}

export function ProjectAIAssistant({ project, onAgentChanges }: ProjectAIAssistantProps) {
  const contextId = `project-${project.id}`;
  const AGENT_STORAGE_KEY = `agent-pending-${project.id}`;

  const getInitialMessages = (): Message[] => [
    {
      id: "1",
      role: "assistant",
      content: `Hi! I'm the AI assistant for **${project.name}**. I have context about this project including its tasks and current phase (${project.phase}).\n\nSwitch to **Agent mode** to have me edit files directly in the Code editor — review the changes, then save & push.`,
      timestamp: new Date(),
    },
  ];

  // Core state
  const [mode, setMode] = useState<Mode>("chat");
  const [messages, setMessages] = useState<Message[]>(getInitialMessages);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // GitHub / repo
  const [githubUrl, setGithubUrl] = useState(project.githubUrl || "");
  const [repoSnapshot, setRepoSnapshot] = useState<{ repoName: string; fileTree: string[]; lastSyncedAt: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Agent
  const [agentResult, setAgentResult] = useState<AgentResult | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [commitMessage, setCommitMessage] = useState("");
  const [isPushing, setIsPushing] = useState(false);
  const [pushResult, setPushResult] = useState<{ sha: string; url: string } | null>(null);
  const [pushError, setPushError] = useState<string | null>(null);
  const [expandedFile, setExpandedFile] = useState<string | null>(null);
  const [isApplyingLocal, setIsApplyingLocal] = useState(false);
  const [applyLocalSuccess, setApplyLocalSuccess] = useState(false);

  // Task proposals
  const [proposedTasks, setProposedTasks] = useState<ProposedTask[] | null>(null);
  const [selectedProposedTasks, setSelectedProposedTasks] = useState<Set<number>>(new Set());
  const [isAddingTasks, setIsAddingTasks] = useState(false);

  // Epic proposals
  const [proposedEpic, setProposedEpic] = useState<EpicProposal | null>(null);
  const [selectedEpicTasks, setSelectedEpicTasks] = useState<Set<number>>(new Set());
  const [isAddingEpic, setIsAddingEpic] = useState(false);

  // Health + PRs
  const [health, setHealth] = useState<ProjectHealth | null>(null);
  const [pullRequests, setPullRequests] = useState<PullRequest[] | null>(null);
  const [prsLoading, setPrsLoading] = useState(false);
  const [reviewingPR, setReviewingPR] = useState<number | null>(null);
  const [prReviews, setPrReviews] = useState<Record<number, PRReview>>({});
  const [activePrReview, setActivePrReview] = useState<number | null>(null);

  // Load chat history
  useEffect(() => {
    setHistoryLoading(true);
    aiClient
      .getProjectSessions(project.id)
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

  // Restore pending agent changes from localStorage
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

  // Persist agent result to localStorage
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
    aiClient.getProjectHealth(project.id).then(setHealth).catch(() => {});
  }, [project.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, agentResult]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleStop = () => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
  };

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

  const appendAIResponse = (response: Awaited<ReturnType<typeof AIService.sendMessage>>) => {
    if (!response.content) return;
    setMessages((prev) => [
      ...prev,
      { id: (Date.now() + 1).toString(), role: "assistant", content: response.content, timestamp: new Date() },
    ]);
    if (response.proposedTasks?.length) {
      setProposedTasks(response.proposedTasks);
      setSelectedProposedTasks(new Set(response.proposedTasks.map((_, i) => i)));
    }
    if (response.proposedEpic) {
      setProposedEpic(response.proposedEpic);
      setSelectedEpicTasks(new Set(response.proposedEpic.tasks.map((_, i) => i)));
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
    setProposedTasks(null);
    setProposedEpic(null);

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: mode === "agent" ? `[Agent] ${text}` : text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);

    if (mode === "chat") {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      try {
        const response = await AIService.sendMessage(text, contextId, "project", project.id, project.name, undefined, controller.signal);
        appendAIResponse(response);
      } finally {
        setIsLoading(false);
      }
    } else {
      try {
        const result = await aiClient.runAgent(project.id, text, contextId);
        if (result.changes.length > 0) {
          setAgentResult(result);
          setCommitMessage(result.commitMessage);
          setSelectedFiles(new Set(result.changes.map((c) => c.path)));
          setApplyLocalSuccess(false);
          if (onAgentChanges) onAgentChanges(result.changes);
        }
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          { id: (Date.now() + 1).toString(), role: "assistant", content: `Agent error: ${err instanceof Error ? err.message : "Unknown error"}`, timestamp: new Date() },
        ]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleQuickAction = async (prompt: string) => {
    if (isLoading) return;
    setIsLoading(true);
    setProposedTasks(null);
    setProposedEpic(null);
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "user", content: prompt, timestamp: new Date() },
    ]);
    const controller = new AbortController();
    abortControllerRef.current = controller;
    try {
      const response = await AIService.sendMessage(prompt, contextId, "project", project.id, project.name, undefined, controller.signal);
      appendAIResponse(response);
    } finally {
      setIsLoading(false);
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
          }),
        ),
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
        { id: Date.now().toString(), role: "assistant", content: `Failed to add tasks: ${err instanceof Error ? err.message : "Unknown error"}`, timestamp: new Date() },
      ]);
    } finally {
      setIsAddingTasks(false);
    }
  };

  const handleAddEpicToKanban = async () => {
    if (!proposedEpic || selectedEpicTasks.size === 0) return;
    setIsAddingEpic(true);
    const tasksToAdd = proposedEpic.tasks.filter((_, i) => selectedEpicTasks.has(i));
    try {
      await Promise.all(
        tasksToAdd.map((task) =>
          projectApi.createTask(project.id, {
            title: task.title,
            description: [task.userStory, task.description].filter(Boolean).join("\n\n"),
            priority: task.priority,
            phase: task.phase || project.phase || undefined,
            status: "todo",
          }),
        ),
      );
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: `Added **${tasksToAdd.length} tasks** from the **${proposedEpic.title}** epic to the Kanban board.`,
          timestamp: new Date(),
        },
      ]);
      setProposedEpic(null);
      setSelectedEpicTasks(new Set());
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "assistant", content: `Failed to add epic tasks: ${err instanceof Error ? err.message : "Unknown error"}`, timestamp: new Date() },
      ]);
    } finally {
      setIsAddingEpic(false);
    }
  };

  const handleReviewPR = async (prNumber: number) => {
    if (prReviews[prNumber]) { setActivePrReview(prNumber); return; }
    setReviewingPR(prNumber);
    try {
      const review = await aiClient.reviewPullRequest(project.id, prNumber);
      setPrReviews((prev) => ({ ...prev, [prNumber]: review }));
      setActivePrReview(prNumber);
    } catch {
      setPrReviews((prev) => ({
        ...prev,
        [prNumber]: { summary: "Failed to load review.", risks: [], suggestions: [], verdict: "needs_discussion", qualityScore: 0 },
      }));
      setActivePrReview(prNumber);
    } finally {
      setReviewingPR(null);
    }
  };

  const loadPullRequests = async () => {
    setPrsLoading(true);
    try {
      const { pullRequests: prs } = await aiClient.listPullRequests(project.id);
      setPullRequests(prs);
    } catch {
      setPullRequests([]);
    } finally {
      setPrsLoading(false);
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

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleFile = (path: string) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  };

  const toggleProposedTask = (i: number) => {
    setSelectedProposedTasks((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const toggleEpicTask = (i: number) => {
    setSelectedEpicTasks((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex gap-4 p-4 h-[calc(100vh-320px)]">
      {/* Main chat panel */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <CardHeader className="border-b shrink-0 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg",
                  mode === "agent" ? "bg-violet-600" : "bg-primary",
                )}
              >
                {mode === "agent" ? (
                  <Zap className="h-5 w-5 text-white" />
                ) : (
                  <Bot className="h-5 w-5 text-primary-foreground" />
                )}
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
              <div className="flex rounded-md border overflow-hidden text-xs">
                <button
                  onClick={() => setMode("chat")}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1.5 transition-colors",
                    mode === "chat" ? "bg-primary text-primary-foreground" : "hover:bg-secondary",
                  )}
                >
                  <MessageSquare className="h-3 w-3" />Chat
                </button>
                <button
                  onClick={() => setMode("agent")}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1.5 transition-colors",
                    mode === "agent" ? "bg-violet-600 text-white" : "hover:bg-secondary",
                  )}
                >
                  <Zap className="h-3 w-3" />Agent
                </button>
              </div>
              <Badge variant="outline" className="text-xs">
                <Sparkles className="h-3 w-3 mr-1" />GPT-4
              </Badge>
              <Button variant="outline" size="sm" onClick={handleClear}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Messages */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
          {historyLoading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading conversation history...
            </div>
          )}

          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              copiedId={copiedId}
              onCopy={copyToClipboard}
            />
          ))}

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
                {mode === "agent" && (
                  <span className="text-xs text-muted-foreground ml-1">Analyzing codebase...</span>
                )}
              </div>
            </div>
          )}

          {agentResult && (
            <AgentDiffPanel
              agentResult={agentResult}
              selectedFiles={selectedFiles}
              commitMessage={commitMessage}
              isPushing={isPushing}
              pushError={pushError}
              expandedFile={expandedFile}
              isApplyingLocal={isApplyingLocal}
              applyLocalSuccess={applyLocalSuccess}
              project={project}
              onToggleFile={toggleFile}
              onCommitMessageChange={setCommitMessage}
              onPush={handlePush}
              onApplyLocal={handleApplyLocal}
              onDismiss={() => setAgentResult(null)}
              onExpandFile={setExpandedFile}
            />
          )}

          {proposedTasks && proposedTasks.length > 0 && (
            <TaskProposalCard
              proposedTasks={proposedTasks}
              selectedTasks={selectedProposedTasks}
              isAdding={isAddingTasks}
              onToggle={toggleProposedTask}
              onAdd={handleAddTasksToKanban}
              onDismiss={() => { setProposedTasks(null); setSelectedProposedTasks(new Set()); }}
            />
          )}

          {proposedEpic && (
            <EpicProposalCard
              proposedEpic={proposedEpic}
              selectedTasks={selectedEpicTasks}
              isAdding={isAddingEpic}
              onToggle={toggleEpicTask}
              onAdd={handleAddEpicToKanban}
              onDismiss={() => { setProposedEpic(null); setSelectedEpicTasks(new Set()); }}
            />
          )}

          {activePrReview !== null && prReviews[activePrReview] && (
            <PRReviewPanel
              review={prReviews[activePrReview]}
              prNumber={activePrReview}
              pr={pullRequests?.find((p) => p.number === activePrReview)}
              onClose={() => setActivePrReview(null)}
            />
          )}

          {pushResult && (
            <div className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/5 p-3">
              <Check className="h-5 w-5 text-green-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-500">Pushed successfully</p>
                <p className="text-xs text-muted-foreground font-mono truncate">
                  {pushResult.sha.slice(0, 7)}
                </p>
              </div>
              <a
                href={pushResult.url}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          )}
        </div>

        <ChatInput
          input={input}
          mode={mode}
          isLoading={isLoading}
          project={project}
          onInputChange={setInput}
          onSend={handleSend}
          onStop={handleStop}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          onQuickAction={handleQuickAction}
        />
      </Card>

      <AISidebar
        project={project}
        mode={mode}
        githubUrl={githubUrl}
        repoSnapshot={repoSnapshot}
        isSyncing={isSyncing}
        syncError={syncError}
        health={health}
        pullRequests={pullRequests}
        prsLoading={prsLoading}
        reviewingPR={reviewingPR}
        prReviews={prReviews}
        onGithubUrlChange={setGithubUrl}
        onSync={handleSync}
        onLoadPRs={loadPullRequests}
        onReviewPR={handleReviewPR}
        onQuickAction={handleQuickAction}
        onSetInput={setInput}
      />
    </div>
  );
}
