export interface ChatRequest {
  message: string;
  sessionId?: string;
  context?: Record<string, any>;
}

export type TaskType =
  | "DELETE_FOLDER"
  | "DELETE_FILE"
  | "NEW_FEATURE"
  | "BUG_FIX"
  | "REFACTOR"
  | "FILE_CREATION"
  | "CONFIG_CHANGE"
  | "DOCS"
  | "OPTIMIZATION";

export type TaskRisk = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type TaskComplexity = "SMALL" | "MEDIUM" | "LARGE" | "COMPLEX";

export interface AgentProgressEvent {
  step: number;
  stageName: string;
  label: string;
  detail: string;
  color: string;
  badge: string;
  progress: number;
  log?: string;
  taskType?: TaskType;
  risk?: TaskRisk;
  estimatedComplexity?: TaskComplexity;
  targetPath?: string;
  /** Full Execution Contract emitted in Stage 1 for frontend display */
  executionContract?: ExecutionContract;
}

export type PipelineMode =
  | "REPOSITORY"
  | "STANDALONE"
  | "DOCUMENTATION"
  | "DIRECT_ANSWER";

export type TargetEnvironment =
  | "HTML_CSS_JS"
  | "REACT_TS"
  | "NODE_JS"
  | "PYTHON"
  | "MARKDOWN"
  | "GENERIC";

export type ValidationType =
  | "TYPESCRIPT_BUILD"
  | "BROWSER_HTML"
  | "PYTHON_SYNTAX"
  | "NONE";

/** Mirrors backend ExecutionContract — drives all pipeline stages */
export interface ExecutionContract {
  goal: string;
  taskType: TaskType;
  risk: TaskRisk;
  estimatedComplexity: TaskComplexity;
  pipeline: PipelineMode;
  environment: TargetEnvironment;
  repositoryRequired: boolean;
  expectedFiles: string[];
  validationType: ValidationType;
  targetPaths: string[];
  allowedActions: string[];
  forbiddenActions: string[];
  maxFiles: number;
  searchScope: string[];
  contextScope: string[];
  diffCriticEnabled: boolean;
}


export interface ProposedTask {
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  phase?: string;
  userStory?: string;
}

export interface EpicProposal {
  title: string;
  description: string;
  tasks: ProposedTask[];
}

export interface ProjectHealth {
  score: number;
  status: "healthy" | "warning" | "critical";
  flags: string[];
  recommendations: string[];
  stats: {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    inProgressTasks: number;
    completionRate: number;
  };
}

export interface PullRequest {
  number: number;
  title: string;
  author: string;
  state: "open" | "closed" | "merged";
  createdAt: string;
  updatedAt: string;
  additions: number;
  deletions: number;
  changedFiles: number;
  url: string;
  draft: boolean;
  body?: string;
  labels: string[];
  baseBranch: string;
  headBranch: string;
}

export interface PRReview {
  summary: string;
  risks: string[];
  suggestions: string[];
  verdict: "approve" | "request_changes" | "needs_discussion";
  qualityScore: number;
}

export interface AIAction {
  type: 'project_created' | 'document_proposed' | 'document_saved';
  data: Record<string, unknown>;
}

export interface ChatResponse {
  message: string;
  sessionId: string;
  proposedTasks?: ProposedTask[];
  proposedEpic?: EpicProposal;
  actions?: AIAction[];
  contextMeta?: {
    projectContext?: any;
    generalContext?: any;
    messageCount: number;
    lastUpdated: string;
  };
}

export interface Session {
  id: string;
  title?: string;
  type: 'general' | 'project';
  projectId?: string;
  projectName?: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessage?: string;
}

export interface SessionListResponse {
  sessions: Session[];
}

export interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface MessageListResponse {
  messages: Message[];
  session: {
    id: string;
    title?: string;
    type: 'general' | 'project';
    projectId?: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface ProjectContext {
  project: {
    id: string;
    name: string;
    description?: string;
    phase?: string;
    progress: number;
    teamSize: number;
  };
  summary?: {
    id: string;
    projectId: string;
    summary: string;
    lastUpdated: string;
    version: number;
  };
  recentMessages: Message[];
  recentDecisions: Array<{
    id: string;
    projectId: string;
    title: string;
    description: string;
    impact?: string;
    madeAt: string;
    madeBy?: string;
  }>;
  rules: Array<{
    id: string;
    projectId: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    createdAt: string;
  }>;
  activeTasks: Array<{
    id: string;
    projectId: string;
    title: string;
    description?: string;
    status: 'todo' | 'in_progress' | 'done';
    priority: 'low' | 'medium' | 'high';
    dueDate?: string;
    createdAt: string;
    updatedAt: string;
  }>;
}

export function extractErrorMessage(errorData: any, status?: number, statusText?: string): string {
  if (typeof errorData?.error === "string" && errorData.error.trim().length > 0) {
    return errorData.error.trim();
  }
  if (typeof errorData?.message === "string" && errorData.message.trim().length > 0) {
    return errorData.message.trim();
  }
  if (status !== undefined) {
    return `HTTP ${status}: ${statusText || "Request failed"}`;
  }
  return "Unknown error";
}

class AIClient {
  private baseUrl: string;

  constructor() {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    this.baseUrl = `${apiBase}/ai`;
  }

  private getHeaders(): Record<string, string> {
    if (typeof window === 'undefined') {
      return { 'Content-Type': 'application/json', 'X-User-ID': 'demo-user-id' };
    }
    const token = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    return {
      'Content-Type': 'application/json',
      'X-User-ID': user?.id || 'demo-user-id',
      'X-User-Name': user?.name || 'Demo User',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}, signal?: AbortSignal): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      ...this.getHeaders(),
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(extractErrorMessage(errorData, response.status, response.statusText));
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") throw error;
      console.error(`AI Client Error (${endpoint}):`, error);
      throw error;
    }
  }

  // General Assistant Methods
  async sendGeneralMessage(request: ChatRequest, signal?: AbortSignal): Promise<ChatResponse> {
    return this.request<ChatResponse>('/general/chat', {
      method: 'POST',
      body: JSON.stringify(request),
    }, signal);
  }

  async getGeneralSessions(): Promise<SessionListResponse> {
    return this.request<SessionListResponse>('/general/sessions');
  }

  async getGeneralSessionMessages(sessionId: string): Promise<MessageListResponse> {
    return this.request<MessageListResponse>(`/general/sessions/${sessionId}/messages`);
  }

  // Project Assistant Methods
  async sendProjectMessage(projectId: string, request: ChatRequest, signal?: AbortSignal): Promise<ChatResponse> {
    return this.request<ChatResponse>(`/projects/${projectId}/chat`, {
      method: 'POST',
      body: JSON.stringify(request),
    }, signal);
  }

  async getProjectSessions(projectId: string): Promise<SessionListResponse> {
    return this.request<SessionListResponse>(`/projects/${projectId}/sessions`);
  }

  async getProjectSessionMessages(projectId: string, sessionId: string): Promise<MessageListResponse> {
    return this.request<MessageListResponse>(`/projects/${projectId}/sessions/${sessionId}/messages`);
  }

  async getProjectContext(projectId: string): Promise<ProjectContext> {
    return this.request<ProjectContext>(`/projects/${projectId}/context`);
  }

  async getProjectHealth(projectId: string): Promise<ProjectHealth> {
    return this.request<ProjectHealth>(`/projects/${projectId}/health`);
  }

  async listPullRequests(projectId: string): Promise<{ pullRequests: PullRequest[] }> {
    return this.request(`/projects/${projectId}/prs`);
  }

  async reviewPullRequest(projectId: string, prNumber: number): Promise<PRReview> {
    return this.request(`/projects/${projectId}/prs/${prNumber}/review`, { method: "POST" });
  }

  async generatePRDescription(projectId: string, prNumber: number): Promise<{ title: string; description: string }> {
    const res = await this.request<{ success: boolean; data: { title: string; description: string } }>(
      `/projects/${projectId}/prs/${prNumber}/describe`,
      { method: "POST" },
    );
    return res.data;
  }

  // Coding Agent
  async runAgent(projectId: string, message: string, sessionId?: string): Promise<{
    explanation: string;
    changes: { path: string; content: string; description: string }[];
    commitMessage: string;
    sessionId: string;
    needsClarification?: boolean;
    question?: string;
    options?: string[];
    intent?: "BUG_FIX" | "FEATURE_ADD" | "REFACTOR" | "DOCS" | "OPTIMIZATION" | "DELETE_FOLDER" | "DELETE_FILE" | "NEW_FEATURE";
    taskType?: TaskType;
    risk?: TaskRisk;
    estimatedComplexity?: TaskComplexity;
    targetPath?: string;
    confidence?: number;
    roadmap?: { phase: number; title: string; layer?: string; targetFiles: string[]; description: string }[];
    securityPass?: boolean;
    critiqueScore?: number;
    buildVerified?: boolean;
    repaired?: boolean;
    buildErrors?: string;
  }> {
    const res = await this.request<{ success: boolean; data: any }>(`/projects/${projectId}/agent/run`, {
      method: "POST",
      body: JSON.stringify({ message, sessionId }),
    });
    return res.data;
  }

  private async streamSse(
    url: string,
    body: any,
    onProgress?: (event: AgentProgressEvent) => void,
  ): Promise<any> {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        ...this.getHeaders(),
        Accept: "text/event-stream",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      let errMessage = `Agent stream request failed with status ${response.status}`;
      try {
        const errJson = await response.json();
        errMessage = errJson.message || errJson.error || errMessage;
      } catch {}
      throw new Error(errMessage);
    }

    if (!response.body) {
      throw new Error("No response body available from agent stream");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let finalResult: any = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split("\n\n");
      buffer = chunks.pop() || "";

      for (const chunk of chunks) {
        const lines = chunk.split("\n");
        let eventName = "";
        let dataStr = "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventName = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            dataStr = line.slice(6).trim();
          }
        }

        if (dataStr) {
          try {
            const parsed = JSON.parse(dataStr);
            if (eventName === "progress" && onProgress) {
              if (parsed.stageName || parsed.step) {
                onProgress(parsed);
              } else if (parsed.type || parsed.message) {
                const label = parsed.repositoryName
                  ? `[${parsed.repositoryName}] ${parsed.message || parsed.type}`
                  : parsed.message || parsed.type || "Multi-repo coordinating";
                onProgress({
                  step: parsed.type === "MULTI_REPO_COMPLETE" ? 6 : 1,
                  stageName: parsed.type || "MULTI_REPO",
                  label,
                  detail: parsed.message || label,
                  color: parsed.type?.includes("FAILED") ? "rose" : "violet",
                  badge: parsed.repositoryName || "Multi-Repo",
                  progress: parsed.type === "MULTI_REPO_COMPLETE" ? 100 : 50,
                  log: parsed.message,
                });
              }
            } else if (eventName === "complete") {
              finalResult = parsed;
            } else if (eventName === "error") {
              throw new Error(parsed.message || parsed.error || "Streaming error");
            }
          } catch (e) {
            if (eventName === "error" || (e instanceof Error && e.message.startsWith("Agent stream request failed"))) {
              throw e;
            }
            console.warn("[ai-client] Non-fatal SSE parse warning:", e);
          }
        }
      }
    }

    if (finalResult) return finalResult;
    throw new Error("Agent stream completed without emitting final result");
  }

  async runAgentStream(
    projectId: string,
    message: string,
    sessionId?: string,
    onProgress?: (event: AgentProgressEvent) => void,
  ): Promise<{
    explanation: string;
    changes: { path: string; content: string; description: string; repositoryId?: string }[];
    commitMessage: string;
    sessionId: string;
    needsClarification?: boolean;
    question?: string;
    options?: string[];
    intent?: "BUG_FIX" | "FEATURE_ADD" | "REFACTOR" | "DOCS" | "OPTIMIZATION" | "DELETE_FOLDER" | "DELETE_FILE" | "NEW_FEATURE";
    taskType?: TaskType;
    risk?: TaskRisk;
    estimatedComplexity?: TaskComplexity;
    targetPath?: string;
    confidence?: number;
    roadmap?: { phase: number; title: string; layer?: string; targetFiles: string[]; description: string }[];
    securityPass?: boolean;
    critiqueScore?: number;
    buildVerified?: boolean;
    repaired?: boolean;
    buildErrors?: string;
  }> {
    const url = `${this.baseUrl}/projects/${projectId}/agent/stream`;
    return this.streamSse(url, { message, sessionId }, onProgress);
  }

  async runMultiRepoAgentStream(
    projectId: string,
    message: string,
    repositoryIds?: string[],
    sessionId?: string,
    conversationHistory?: any[],
    onProgress?: (event: AgentProgressEvent) => void,
  ): Promise<{
    explanation: string;
    changes: { path: string; content: string; description: string; repositoryId?: string }[];
    commitMessage: string;
    sessionId: string;
    needsClarification?: boolean;
    question?: string;
    options?: string[];
    intent?: "BUG_FIX" | "FEATURE_ADD" | "REFACTOR" | "DOCS" | "OPTIMIZATION" | "DELETE_FOLDER" | "DELETE_FILE" | "NEW_FEATURE";
    taskType?: TaskType;
    risk?: TaskRisk;
    estimatedComplexity?: TaskComplexity;
    targetPath?: string;
    confidence?: number;
    roadmap?: { phase: number; title: string; layer?: string; targetFiles: string[]; description: string }[];
    securityPass?: boolean;
    critiqueScore?: number;
    buildVerified?: boolean;
    repaired?: boolean;
    buildErrors?: string;
    multiRepo?: boolean;
    multiRepoResult?: any;
  }> {
    const url = `${this.baseUrl}/projects/${projectId}/agent/multi-repo/run`;
    const raw = await this.streamSse(
      url,
      { message, repositoryIds, sessionId, conversationHistory },
      onProgress,
    );

    if (raw.results || raw.overallStatus) {
      const results: any[] = raw.results || [];
      const repoSummaries = results.map(
        (r) => `• ${r.repositoryName || r.repositoryId}: ${r.status} (${(r.changes || []).length} file(s) changed, build verified: ${r.buildVerified ? "yes" : "no"})`
      );
      const explanation = `Multi-repository coordination completed with status: ${raw.overallStatus}.\n\nParticipating repositories:\n${repoSummaries.join("\n")}`;

      const changes = (raw.changes || []).map((c: any) => ({
        path: c.path,
        content: c.content,
        description: c.description || `Changes for ${c.repositoryId || "repo"}`,
        repositoryId: c.repositoryId,
      }));

      const allBuildVerified = raw.overallStatus === "SUCCESS" && results.every((r) => r.buildVerified !== false);
      const firstFailed = results.find((r) => r.validationErrors);

      return {
        explanation,
        changes,
        commitMessage: `Multi-repo update: ${message.slice(0, 50)}`,
        sessionId: raw.planId || sessionId || `multi-repo-${Date.now()}`,
        taskType: "NEW_FEATURE",
        risk: "MEDIUM",
        estimatedComplexity: "COMPLEX",
        confidence: 0.95,
        securityPass: true,
        buildVerified: allBuildVerified,
        buildErrors: firstFailed?.validationErrors,
        multiRepo: true,
        multiRepoResult: raw,
      };
    }

    return raw;
  }

  async suggestTaskOrder(
    projectId: string,
    tasks: { id: string; title: string; description?: string }[],
  ): Promise<string[]> {
    const res = await this.request<{ success: boolean; data: { order: string[] } }>(
      `/projects/${projectId}/tasks/suggest-order`,
      { method: "POST", body: JSON.stringify({ tasks }) },
    );
    return res.data.order;
  }

  async generateSprint(
    projectId: string,
    prompt: string,
  ): Promise<{
    name: string;
    goal: string;
    startDate: string;
    endDate: string;
    suggestedTasks: { taskId: string; title: string; reason: string; priority: string }[];
  }> {
    const res = await this.request<{ success: boolean; data: any }>(`/projects/${projectId}/sprints/generate`, {
      method: "POST",
      body: JSON.stringify({ prompt }),
    });
    return res.data;
  }

  async suggestSprintTasks(
    projectId: string,
    sprintId: string,
    capacity = 10,
  ): Promise<{ taskId: string; title: string; reason: string; priority: string }[]> {
    const res = await this.request<{ suggestions: any[] }>(
      `/projects/${projectId}/sprints/${sprintId}/suggest?capacity=${capacity}`,
    );
    return res.suggestions;
  }

  async pushAgentChanges(
    projectId: string,
    changes: { path: string; content: string; repositoryId?: string }[],
    commitMessage: string,
  ): Promise<{ sha: string; url: string; pushes?: any[] }> {
    const res = await this.request<{ success: boolean; data: any }>(`/projects/${projectId}/agent/push`, {
      method: "POST",
      body: JSON.stringify({ changes, commitMessage }),
    });
    return res.data;
  }

}

export const aiClient = new AIClient();
export default AIClient;
