export interface ChatRequest {
  message: string;
  sessionId?: string;
  context?: Record<string, any>;
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

export interface ChatResponse {
  message: string;
  sessionId: string;
  proposedTasks?: ProposedTask[];
  proposedEpic?: EpicProposal;
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
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
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

  // Coding Agent
  async runAgent(projectId: string, message: string, sessionId?: string): Promise<{
    explanation: string;
    changes: { path: string; content: string; description: string }[];
    commitMessage: string;
    sessionId: string;
  }> {
    const res = await this.request<{ success: boolean; data: any }>(`/projects/${projectId}/agent/run`, {
      method: "POST",
      body: JSON.stringify({ message, sessionId }),
    });
    return res.data;
  }

  async pushAgentChanges(projectId: string, changes: { path: string; content: string }[], commitMessage: string): Promise<{ sha: string; url: string }> {
    const res = await this.request<{ success: boolean; data: any }>(`/projects/${projectId}/agent/push`, {
      method: "POST",
      body: JSON.stringify({ changes, commitMessage }),
    });
    return res.data;
  }
}

export const aiClient = new AIClient();
export default AIClient;
