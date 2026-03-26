export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
  timestamp?: Date;
}

export interface ChatContext {
  id: string;
  type: "global" | "project";
  projectId?: string;
  projectName?: string;
  messages: ChatMessage[];
  lastUpdated: Date;
}

export interface AIResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// In-memory storage for chat contexts (in production, use a database)
const chatContexts = new Map<string, ChatContext>();

export class AIService {
  // Get or create chat context
  static getChatContext(
    contextId: string,
    type: "global" | "project",
    projectId?: string,
    projectName?: string,
  ): ChatContext {
    let context = chatContexts.get(contextId);

    if (!context) {
      context = {
        id: contextId,
        type,
        projectId,
        projectName,
        messages: [],
        lastUpdated: new Date(),
      };
      chatContexts.set(contextId, context);
    }

    return context;
  }

  // Save chat context
  static saveChatContext(context: ChatContext): void {
    context.lastUpdated = new Date();
    chatContexts.set(context.id, context);
  }

  // Get all chat contexts
  static getAllChatContexts(): ChatContext[] {
    return Array.from(chatContexts.values());
  }

  // Clear chat context
  static clearChatContext(contextId: string): void {
    const context = chatContexts.get(contextId);
    if (context) {
      context.messages = [];
      context.lastUpdated = new Date();
      chatContexts.set(contextId, context);
    }
  }

  // Send message to AI with context via API
  static async sendMessage(
    userMessage: string,
    contextId: string,
    type: "global" | "project",
    projectId?: string,
    projectName?: string,
  ): Promise<AIResponse> {
    const context = this.getChatContext(
      contextId,
      type,
      projectId,
      projectName,
    );

    // Add user message to context
    const message: ChatMessage = {
      role: "user",
      content: userMessage,
      timestamp: new Date(),
    };
    context.messages.push(message);

    try {
      // Call the API endpoint
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: context.messages,
          contextType: type,
          projectId,
          projectName,
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Add AI response to context
      const aiMessage: ChatMessage = {
        role: "assistant",
        content: data.content,
        timestamp: new Date(),
      };
      context.messages.push(aiMessage);

      // Save context
      this.saveChatContext(context);

      return {
        content: data.content,
        usage: data.usage,
      };
    } catch (error) {
      console.error("AI Service Error:", error);

      // Remove the user message if the API call failed
      context.messages.pop();

      return {
        content:
          "I apologize, but I encountered an error while processing your request. Please try again later.",
      };
    }
  }

  // Get chat history
  static getChatHistory(contextId: string): ChatMessage[] {
    const context = chatContexts.get(contextId);
    return context ? context.messages : [];
  }

  // Get project-specific context summary
  static getProjectContextSummary(
    projectId: string,
    projectName: string,
  ): string {
    const projectContexts = Array.from(chatContexts.values()).filter(
      (ctx) => ctx.type === "project" && ctx.projectId === projectId,
    );

    if (projectContexts.length === 0) {
      return `No previous conversations found for project "${projectName}".`;
    }

    const totalMessages = projectContexts.reduce(
      (sum, ctx) => sum + ctx.messages.length,
      0,
    );
    const lastActivity = Math.max(
      ...projectContexts.map((ctx) => ctx.lastUpdated.getTime()),
    );

    return `Project "${projectName}" has ${totalMessages} messages across ${projectContexts.length} conversations. Last activity: ${new Date(lastActivity).toLocaleString()}`;
  }
}
