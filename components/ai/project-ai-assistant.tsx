"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, RotateCcw, Sparkles, Zap, MessageSquare, Loader2, Check, ExternalLink, FileText, X, ListChecks, HelpCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { AIService, type ProposedTask, type EpicProposal, type ProjectHealth, type AttachedFile } from "@/lib/ai-service";
import { projectApi } from "@/lib/project-api";
import { aiClient, type PullRequest, type PRReview } from "@/lib/ai-client";
import type { Project, Task } from "@/lib/types";

import type { Message, AgentResult } from "./types";
import { ChatMessage } from "./chat-message";
import { AgentDiffPanel } from "./agent-diff-panel";
import { TaskProposalCard } from "./task-proposal-card";
import { EpicProposalCard } from "./epic-proposal-card";
import { SprintProposalCard, type SprintProposal } from "./sprint-proposal-card";
import { PRReviewPanel } from "./pr-review-panel";
import { AISidebar } from "./ai-sidebar";
import { ChatInput } from "./chat-input";

type Mode = "chat" | "agent";

interface RunTaskRequest {
  taskId: string;
  title: string;
  description?: string;
}

interface QaTurn {
  question: string;
  answer: string;
}

// Orders not-done tasks so each task's blockers (blockedByIds) come before it.
// Tasks that become ready in the same wave (no dependency relationship between
// them) have no inherent order — rather than guessing from array order, the AI
// sequences each wave logically (foundational work before polish/testing).
// Tasks with unresolvable/circular blockers are appended at the end.
async function computeReadyOrder(
  tasks: Task[],
  suggestOrder: (wave: Task[]) => Promise<string[]>,
): Promise<Task[]> {
  const doneIds = new Set(tasks.filter((t) => t.status === "done").map((t) => t.id));
  const remaining = new Map(tasks.filter((t) => t.status !== "done").map((t) => [t.id, t]));
  const order: Task[] = [];

  while (remaining.size > 0) {
    const wave = Array.from(remaining.values()).filter((task) => {
      const blockers = task.blockedByIds || [];
      return blockers.every((id) => doneIds.has(id) || !remaining.has(id));
    });
    if (wave.length === 0) break; // circular/unresolvable — leftovers appended below

    let waveOrdered = wave;
    if (wave.length > 1) {
      try {
        const ids = await suggestOrder(wave);
        const byId = new Map(wave.map((t) => [t.id, t]));
        waveOrdered = ids.map((id) => byId.get(id)).filter((t): t is Task => !!t);
        for (const t of wave) if (!waveOrdered.includes(t)) waveOrdered.push(t);
      } catch {
        // fall back to array order for this wave
      }
    }

    for (const t of waveOrdered) {
      order.push(t);
      doneIds.add(t.id);
      remaining.delete(t.id);
    }
  }
  order.push(...remaining.values());
  return order;
}

function taskPrompt(task: { title: string; description?: string }): string {
  return `Implement this task:\n\nTitle: ${task.title}${task.description ? `\nDescription: ${task.description}` : ""}`;
}

interface ProjectAIAssistantProps {
  project: Project;
  tasks?: Task[];
  onAgentChanges?: (changes: { path: string; content: string; description: string }[]) => void;
  runTaskRequest?: RunTaskRequest | null;
  onRunTaskConsumed?: () => void;
  onTaskCompleted?: (taskId: string) => void;
}

export function ProjectAIAssistant({ project, tasks = [], onAgentChanges, runTaskRequest, onRunTaskConsumed, onTaskCompleted }: ProjectAIAssistantProps) {
  const contextId = `project-${project.id}`;
  const AGENT_STORAGE_KEY = `agent-pending-${project.id}`;

  const getInitialMessages = (): Message[] => [
    {
      id: "1",
      role: "assistant",
      content: `Hi! I'm the AI Agent for **${project.name}**. Ask me to implement features, fix bugs, or refactor code — I analyze project context, create multi-phase roadmaps, and generate complete code changes for your review before saving & pushing.`,
      timestamp: new Date(),
    },
  ];

  // Core state
  // Core state
  const [mode, setMode] = useState<Mode>("agent");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>(getInitialMessages);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [input, setInput] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
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

  // Batch task runner
  const [batchQueue, setBatchQueue] = useState<Task[]>([]);
  const [batchActive, setBatchActive] = useState(false);
  const [activeAgentTaskId, setActiveAgentTaskId] = useState<string | null>(null);
  const [clarification, setClarification] = useState<{ question: string; options?: string[] } | null>(null);
  const [clarificationAnswer, setClarificationAnswer] = useState("");
  const pendingAgentContextRef = useRef<{ baseText: string; qaHistory: QaTurn[]; taskDriven: boolean } | null>(null);
  const [batchTotal, setBatchTotal] = useState(0);
  const [currentBatchTaskTitle, setCurrentBatchTaskTitle] = useState<string | null>(null);

  // Task proposals
  const [proposedTasks, setProposedTasks] = useState<ProposedTask[] | null>(null);
  const [selectedProposedTasks, setSelectedProposedTasks] = useState<Set<number>>(new Set());
  const [isAddingTasks, setIsAddingTasks] = useState(false);

  // Epic proposals
  const [proposedEpic, setProposedEpic] = useState<EpicProposal | null>(null);
  const [selectedEpicTasks, setSelectedEpicTasks] = useState<Set<number>>(new Set());
  const [isAddingEpic, setIsAddingEpic] = useState(false);

  // Meeting notes
  const [meetingNotesOpen, setMeetingNotesOpen] = useState(false);
  const [meetingNotesText, setMeetingNotesText] = useState("");

  // Sprint proposal
  const [sprintProposal, setSprintProposal] = useState<SprintProposal | null>(null);
  const [selectedSprintTasks, setSelectedSprintTasks] = useState<Set<string>>(new Set());
  const [isCreatingSprint, setIsCreatingSprint] = useState(false);

  // Health + PRs
  const [health, setHealth] = useState<ProjectHealth | null>(null);
  const [pullRequests, setPullRequests] = useState<PullRequest[] | null>(null);
  const [prsLoading, setPrsLoading] = useState(false);
  const [reviewingPR, setReviewingPR] = useState<number | null>(null);
  const [prReviews, setPrReviews] = useState<Record<number, PRReview>>({});
  const [activePrReview, setActivePrReview] = useState<number | null>(null);
  const [prDescriptions, setPrDescriptions] = useState<Record<number, { title: string; description: string }>>({});
  const [generatingDescription, setGeneratingDescription] = useState<number | null>(null);

  // Load chat history and restore active session
  useEffect(() => {
    setHistoryLoading(true);
    aiClient
      .getProjectSessions(project.id)
      .then(async ({ sessions }) => {
        if (!sessions.length) return null;
        const activeSess = sessions[0];
        setSessionId(activeSess.id);
        const data = await aiClient.getProjectSessionMessages(project.id, activeSess.id);
        return data;
      })
      .then((data) => {
        if (!data?.messages?.length) return;
        setMessages([
          getInitialMessages()[0],
          ...data.messages.map((m: any) => ({
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

  // Batch runner state must survive this component unmounting — switching to
  // another tab (Kanban, Workflow, etc.) unmounts inactive TabsContent by
  // default, which would otherwise silently kill an in-progress batch after
  // just one task, leaving only the last diff (already persisted above) with
  // nothing to continue it.
  const BATCH_STORAGE_KEY = `agent-batch-${project.id}`;
  const batchRestoredRef = useRef(false);

  useEffect(() => {
    if (batchRestoredRef.current || tasks.length === 0) return;
    batchRestoredRef.current = true;
    try {
      const saved = localStorage.getItem(BATCH_STORAGE_KEY);
      if (!saved) return;
      const parsed: {
        batchActive: boolean;
        queueIds: string[];
        activeAgentTaskId: string | null;
        batchTotal: number;
        clarification: { question: string; options?: string[] } | null;
        pendingContext: { baseText: string; qaHistory: QaTurn[]; taskDriven: boolean } | null;
      } = JSON.parse(saved);
      if (!parsed.batchActive) return;

      const byId = new Map(tasks.map((t) => [t.id, t]));
      const restoredQueue = parsed.queueIds
        .map((id) => byId.get(id))
        .filter((t): t is Task => !!t && t.status !== "done");
      const activeTask = parsed.activeAgentTaskId ? byId.get(parsed.activeAgentTaskId) : undefined;

      setMode("agent");
      setBatchActive(true);
      setBatchQueue(restoredQueue);
      setBatchTotal(parsed.batchTotal || restoredQueue.length + 1);
      setActiveAgentTaskId(parsed.activeAgentTaskId);
      setCurrentBatchTaskTitle(activeTask?.title || null);

      // A pending clarification question takes priority — restore it as-is
      // and wait for the answer rather than silently re-running the task
      // (which was corrupting batch progress: the old run's answer would
      // still land on a fresh, unrelated re-run of the same task).
      if (parsed.clarification && parsed.pendingContext) {
        setClarification(parsed.clarification);
        pendingAgentContextRef.current = parsed.pendingContext;
        return;
      }

      // Otherwise, if a run was genuinely in flight (no diff, no question)
      // when this unmounted, that task's result was lost — re-run it rather
      // than leaving the batch stuck with nothing happening.
      const hasPendingDiff = !!localStorage.getItem(AGENT_STORAGE_KEY);
      if (activeTask && !hasPendingDiff) {
        runBatchTask(activeTask);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks]);

  // Persist in-progress batch so it survives switching tabs
  useEffect(() => {
    if (batchActive) {
      localStorage.setItem(BATCH_STORAGE_KEY, JSON.stringify({
        batchActive: true,
        queueIds: batchQueue.map((t) => t.id),
        activeAgentTaskId,
        batchTotal,
        clarification,
        pendingContext: pendingAgentContextRef.current,
      }));
    } else {
      localStorage.removeItem(BATCH_STORAGE_KEY);
    }
  }, [batchActive, batchQueue, activeAgentTaskId, batchTotal, clarification, BATCH_STORAGE_KEY]);

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

  // Runs one agent turn. qaHistory carries any clarification Q&A already
  // resolved for this task, appended to the prompt so the agent can continue
  // instead of re-asking. Only the very first turn (empty qaHistory) posts a
  // "[Agent] ..." user bubble — resumed turns just show the user's answer.
  // taskDriven runs (single "Run Agent on this task" or batch) stay entirely
  // in this AI tab for review/push — they skip the old auto-jump-to-Code-tab
  // behavior, which is only useful for freeform typed agent requests and
  // actively breaks the batch flow (it unmounts this panel and pushes via a
  // separate, untracked path in the Code tab).
  const runAgentTurn = async (text: string, qaHistory: QaTurn[] = [], taskDriven = false) => {
    setIsLoading(true);
    setAgentResult(null);
    setPushResult(null);
    setPushError(null);
    setClarification(null);

    if (qaHistory.length === 0) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "user", content: `[Agent] ${text}`, timestamp: new Date() },
      ]);
    }

    const augmentedText = qaHistory.length
      ? `${text}\n\nCLARIFICATION SO FAR:\n${qaHistory.map((qa) => `Q: ${qa.question}\nA: ${qa.answer}`).join("\n")}`
      : text;

    try {
      const result = await aiClient.runAgent(project.id, augmentedText, sessionId || undefined);
      if (result.sessionId) setSessionId(result.sessionId);

      if (result.needsClarification && result.question) {
        pendingAgentContextRef.current = { baseText: text, qaHistory, taskDriven };
        setClarification({ question: result.question, options: result.options });
        setMessages((prev) => [
          ...prev,
          { id: (Date.now() + 1).toString(), role: "assistant", content: `❓ ${result.question}`, timestamp: new Date() },
        ]);
        return;
      }

      if (result.changes.length > 0) {
        setAgentResult(result);
        setCommitMessage(result.commitMessage);
        setSelectedFiles(new Set(result.changes.map((c) => c.path)));
        setApplyLocalSuccess(false);

        // Append assistant chat message detailing what was accomplished
        const summaryMsg = `✨ **AI Agent Execution Complete**\n\n**Intent:** \`${result.intent || "FEATURE_ADD"}\` (Confidence: ${Math.round((result.confidence || 0.95) * 100)}%)\n\n**Summary:** ${result.explanation}\n\n**Build Status:** ${
          result.buildVerified ? "✅ Verified Clean (0 build errors)" : "❌ Build Failed / Flagged"
        }\n\n**Files Modified / Created (${result.changes.length}):**\n${result.changes
          .map((c) => `- \`${c.path}\`: ${c.description}`)
          .join("\n")}\n\n*Review the proposed diffs below to apply locally or authorize & push to GitHub.*`;

        setMessages((prev) => [
          ...prev,
          { id: (Date.now() + 1).toString(), role: "assistant", content: summaryMsg, timestamp: new Date() },
        ]);

        if (onAgentChanges && !taskDriven) onAgentChanges(result.changes);
      } else {
        setMessages((prev) => [
          ...prev,
          { id: (Date.now() + 1).toString(), role: "assistant", content: result.explanation || "No changes were needed.", timestamp: new Date() },
        ]);
        advanceBatch();
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", content: `Agent error: ${err instanceof Error ? err.message : "Unknown error"}`, timestamp: new Date() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerClarification = (answer: string) => {
    if (!clarification || !pendingAgentContextRef.current) return;
    const qa: QaTurn = { question: clarification.question, answer };
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "user", content: answer, timestamp: new Date() },
    ]);
    setClarificationAnswer("");
    const { baseText, qaHistory, taskDriven } = pendingAgentContextRef.current;
    runAgentTurn(baseText, [...qaHistory, qa], taskDriven);
  };

  const runBatchTask = (task: Task) => {
    setActiveAgentTaskId(task.id);
    setCurrentBatchTaskTitle(task.title);
    runAgentTurn(taskPrompt(task), [], true);
  };

  const startBatch = async () => {
    const notDone = tasks.filter((t) => t.status !== "done");
    if (notDone.length === 0) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "assistant", content: "No pending tasks to run — everything is done.", timestamp: new Date() },
      ]);
      return;
    }
    setMode("agent");
    setIsLoading(true);
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "assistant", content: "📋 Planning task order for the batch run...", timestamp: new Date() },
    ]);
    const order = await computeReadyOrder(tasks, (wave) =>
      aiClient.suggestTaskOrder(project.id, wave.map((t) => ({ id: t.id, title: t.title, description: t.description }))),
    );
    setIsLoading(false);
    if (order.length === 0) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "assistant", content: "No ready tasks — remaining tasks are blocked by unfinished dependencies.", timestamp: new Date() },
      ]);
      return;
    }
    setBatchActive(true);
    setBatchTotal(order.length);
    const [first, ...rest] = order;
    setBatchQueue(rest);
    runBatchTask(first);
  };

  // Called after a task's changes are pushed, or when the agent decides a
  // task needs no changes. Marks the task done, re-syncs the repo snapshot so
  // the next task's agent call sees what was just pushed instead of a stale
  // pre-push file tree (which was causing it to reinvent files it couldn't
  // see), then — if a batch is running — moves on to the next ready task.
  const completeActiveTask = async () => {
    if (activeAgentTaskId) {
      onTaskCompleted?.(activeAgentTaskId);
      setActiveAgentTaskId(null);
    }
    if (!batchActive) return;

    if (project.githubUrl) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "assistant", content: "🔄 Syncing repo before the next task...", timestamp: new Date() },
      ]);
      try {
        await projectApi.syncGithub(project.id, project.githubUrl);
        const snap = await projectApi.getRepoSnapshot(project.id);
        if (snap) setRepoSnapshot(snap);
      } catch {
        // proceed anyway — better to continue with a stale snapshot than block the batch
      }
    }

    if (batchQueue.length === 0) {
      setBatchActive(false);
      setCurrentBatchTaskTitle(null);
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "assistant", content: "✅ Batch complete — no more ready tasks.", timestamp: new Date() },
      ]);
      return;
    }
    const [next, ...rest] = batchQueue;
    setBatchQueue(rest);
    runBatchTask(next);
  };

  const advanceBatch = () => {
    if (!batchActive && !activeAgentTaskId) return;
    completeActiveTask();
  };

  const handleSend = async () => {
    if ((!input.trim() && !attachedFiles.length) || isLoading) return;
    const text = input.trim();
    const files = attachedFiles;
    setInput("");
    setAttachedFiles([]);
    setProposedTasks(null);
    setProposedEpic(null);

    if (mode === "chat") {
      setIsLoading(true);
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "user", content: text, timestamp: new Date() },
      ]);
      const controller = new AbortController();
      abortControllerRef.current = controller;
      try {
        const response = await AIService.sendMessage(text, contextId, "project", project.id, project.name, undefined, controller.signal, files);
        appendAIResponse(response);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Freeform agent message typed by the user — not tied to a specific task.
      setActiveAgentTaskId(null);
      setCurrentBatchTaskTitle(null);
      await runAgentTurn(text);
    }
  };

  // "Run Agent" clicked on a Kanban task card — switch to Agent mode and
  // immediately run it with the task's full title + description, so the
  // agent isn't limited to the bare title it'd otherwise see in its context.
  useEffect(() => {
    if (!runTaskRequest) return;
    setMode("agent");
    setActiveAgentTaskId(runTaskRequest.taskId);
    setCurrentBatchTaskTitle(runTaskRequest.title);
    runAgentTurn(taskPrompt(runTaskRequest), [], true).finally(() => onRunTaskConsumed?.());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runTaskRequest]);

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
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: `🚀 **Changes Authorized & Pushed to GitHub!**\n\n- **Commit Message:** \`${commitMessage}\`\n- **Files Pushed:** ${changes.length}\n- **Repository:** [View Commit on GitHub](${result.url})`,
          timestamp: new Date(),
        },
      ]);
      completeActiveTask();
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
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: `📁 **Applied to Local Workspace!**\n\nSuccessfully wrote ${changes.length} file change${changes.length !== 1 ? "s" : ""} to disk.`,
          timestamp: new Date(),
        },
      ]);
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

  const handleGeneratePRDescription = async (prNumber: number) => {
    if (prDescriptions[prNumber]) return;
    setGeneratingDescription(prNumber);
    try {
      const result = await aiClient.generatePRDescription(project.id, prNumber);
      setPrDescriptions((prev) => ({ ...prev, [prNumber]: result }));
    } catch {
      // silent
    } finally {
      setGeneratingDescription(null);
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

  const handleGenerateSprint = async (prompt: string) => {
    if (isLoading) return;
    setIsLoading(true);
    setSprintProposal(null);
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "user", content: prompt, timestamp: new Date() },
    ]);
    try {
      const proposal = await aiClient.generateSprint(project.id, prompt);
      setSprintProposal(proposal);
      setSelectedSprintTasks(new Set(proposal.suggestedTasks.map((t) => t.taskId)));
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Here's a sprint plan: **${proposal.name}** (${proposal.startDate} → ${proposal.endDate}).\n\n${proposal.goal}\n\nI've selected ${proposal.suggestedTasks.length} tasks — review and confirm below.`,
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", content: `Failed to generate sprint: ${err instanceof Error ? err.message : "Unknown error"}`, timestamp: new Date() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSprint = async () => {
    if (!sprintProposal) return;
    setIsCreatingSprint(true);
    try {
      const sprint = await projectApi.createSprint(project.id, {
        name: sprintProposal.name,
        goal: sprintProposal.goal,
        startDate: sprintProposal.startDate,
        endDate: sprintProposal.endDate,
      });
      const tasksToAdd = sprintProposal.suggestedTasks.filter((t) => selectedSprintTasks.has(t.taskId));
      await Promise.all(tasksToAdd.map((t) => projectApi.addTaskToSprint(project.id, sprint.id, t.taskId)));
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: `Sprint **${sprint.name}** created with ${tasksToAdd.length} task${tasksToAdd.length !== 1 ? "s" : ""}. Head to the Sprints tab to see it.`,
          timestamp: new Date(),
        },
      ]);
      setSprintProposal(null);
      setSelectedSprintTasks(new Set());
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "assistant", content: `Failed to create sprint: ${err instanceof Error ? err.message : "Unknown error"}`, timestamp: new Date() },
      ]);
    } finally {
      setIsCreatingSprint(false);
    }
  };

  const toggleSprintTask = (taskId: string) => {
    setSelectedSprintTasks((prev) => {
      const next = new Set(prev);
      next.has(taskId) ? next.delete(taskId) : next.add(taskId);
      return next;
    });
  };

  const handleMeetingNotes = async () => {
    if (!meetingNotesText.trim() || isLoading) return;
    const notes = meetingNotesText.trim();
    setMeetingNotesOpen(false);
    setMeetingNotesText("");
    const prompt = `Extract all decisions, action items, and tasks from these meeting notes and propose them as Kanban tasks:\n\n${notes}`;
    await handleQuickAction(prompt);
  };

  const handleClear = () => {
    AIService.clearChatContext(contextId);
    setSessionId(null);
    setMessages(getInitialMessages());
    setAgentResult(null);
    setPushResult(null);
    setProposedTasks(null);
    setSelectedProposedTasks(new Set());
    setBatchActive(false);
    setBatchQueue([]);
    setBatchTotal(0);
    setCurrentBatchTaskTitle(null);
    setActiveAgentTaskId(null);
    setClarification(null);
    pendingAgentContextRef.current = null;
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
    <div className="flex gap-4 p-4 h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] overflow-hidden">
      {/* Main chat panel */}
      <Card className="flex-1 flex flex-col overflow-hidden border border-violet-500/25 bg-background/60 backdrop-blur-xl shadow-lg shadow-violet-500/5">
        {/* Header */}
        <CardHeader className="border-b shrink-0 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">
                  {project.name} — AI Agent
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Multi-stage agentic workflow (Reads & edits codebase)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Sparkles className="h-3 w-3 mr-1" />GPT-4o
              </Badge>
              {batchActive ? (
                <Badge variant="outline" className="text-xs gap-1 border-violet-500 text-violet-600 dark:text-violet-400">
                  <ListChecks className="h-3 w-3" />
                  Task {Math.min(batchTotal, Math.max(1, batchTotal - batchQueue.length))} of {batchTotal}
                </Badge>
              ) : (
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={startBatch} disabled={isLoading}>
                  <ListChecks className="h-3.5 w-3.5" />
                  Run Batch
                </Button>
              )}
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
                  <span className="text-xs text-muted-foreground ml-1">
                    {currentBatchTaskTitle ? `Working on: ${currentBatchTaskTitle}` : "Analyzing codebase..."}
                  </span>
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

          {clarification && (
            <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-4 space-y-3">
              <div className="flex items-start gap-2">
                <HelpCircle className="h-4 w-4 text-violet-500 mt-0.5 shrink-0" />
                <p className="text-sm font-medium">{clarification.question}</p>
              </div>
              {clarification.options && clarification.options.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {clarification.options.map((opt) => (
                    <Button
                      key={opt}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => handleAnswerClarification(opt)}
                      disabled={isLoading}
                    >
                      {opt}
                    </Button>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Input
                  value={clarificationAnswer}
                  onChange={(e) => setClarificationAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && clarificationAnswer.trim()) {
                      handleAnswerClarification(clarificationAnswer.trim());
                    }
                  }}
                  placeholder="Or type your own answer..."
                  className="text-sm"
                  disabled={isLoading}
                />
                <Button
                  size="sm"
                  onClick={() => clarificationAnswer.trim() && handleAnswerClarification(clarificationAnswer.trim())}
                  disabled={isLoading || !clarificationAnswer.trim()}
                >
                  Reply
                </Button>
              </div>
            </div>
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

          {sprintProposal && (
            <SprintProposalCard
              proposal={sprintProposal}
              selectedTasks={selectedSprintTasks}
              isCreating={isCreatingSprint}
              onToggle={toggleSprintTask}
              onCreate={handleCreateSprint}
              onDismiss={() => { setSprintProposal(null); setSelectedSprintTasks(new Set()); }}
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
          attachedFiles={attachedFiles}
          onAttachedFilesChange={setAttachedFiles}
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
          onPasteMeetingNotes={() => setMeetingNotesOpen(true)}
          onGenerateSprint={handleGenerateSprint}
        />
      </Card>

      <Dialog open={meetingNotesOpen} onOpenChange={setMeetingNotesOpen}>
        <DialogContent className="sm:max-w-125">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Extract Tasks from Meeting Notes
            </DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Paste your meeting notes here..."
            value={meetingNotesText}
            onChange={(e) => setMeetingNotesText(e.target.value)}
            className="min-h-48 resize-none"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setMeetingNotesOpen(false); setMeetingNotesText(""); }}>
              <X className="h-4 w-4 mr-1" />Cancel
            </Button>
            <Button onClick={handleMeetingNotes} disabled={!meetingNotesText.trim()}>
              <Sparkles className="h-4 w-4 mr-1" />Extract Tasks
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
        prDescriptions={prDescriptions}
        generatingDescription={generatingDescription}
        onGeneratePRDescription={handleGeneratePRDescription}
        onQuickAction={handleQuickAction}
        onSetInput={setInput}
      />
    </div>
  );
}
