export interface ChatRequest {
  message: string;
  sessionId?: string;
  context?: Record<string, any>;
}

export interface ChatResponse {
  message: string;
  sessionId: string;
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
  private userId: string;

  constructor() {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    this.baseUrl = `${apiBase}/ai`;
    // In a real app, this would come from authentication
    this.userId = 'demo-user-id';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-User-ID': this.userId,
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`AI Client Error (${endpoint}):`, error);
      throw error;
    }
  }

  // General Assistant Methods
  async sendGeneralMessage(request: ChatRequest): Promise<ChatResponse> {
    return this.request<ChatResponse>('/general/chat', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getGeneralSessions(): Promise<SessionListResponse> {
    return this.request<SessionListResponse>('/general/sessions');
  }

  async getGeneralSessionMessages(sessionId: string): Promise<MessageListResponse> {
    return this.request<MessageListResponse>(`/general/sessions/${sessionId}/messages`);
  }

  // Project Assistant Methods
  async sendProjectMessage(projectId: string, request: ChatRequest): Promise<ChatResponse> {
    return this.request<ChatResponse>(`/projects/${projectId}/chat`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
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

  // Utility Methods
  setUserId(userId: string): void {
    this.userId = userId;
  }

  getUserId(): string {
    return this.userId;
  }
}

export const aiClient = new AIClient();
export default AIClient;
