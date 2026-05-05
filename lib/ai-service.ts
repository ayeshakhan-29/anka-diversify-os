import { aiClient, type ProposedTask, type EpicProposal, type ProjectHealth } from "./ai-client";

export type { ProposedTask, EpicProposal, ProjectHealth };

export interface ChatMessage {
  role: "user" | "assistant";
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
  sessionId?: string;
  proposedTasks?: ProposedTask[];
  proposedEpic?: EpicProposal;
}

// In-memory store for within-session history (lost on page refresh — backend is source of truth)
const chatContexts = new Map<string, ChatContext>();

export class AIService {
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

  static clearChatContext(contextId: string): void {
    const context = chatContexts.get(contextId);
    if (context) {
      context.messages = [];
      context.lastUpdated = new Date();
    }
  }

  static getChatHistory(contextId: string): ChatMessage[] {
    return chatContexts.get(contextId)?.messages ?? [];
  }

  static async sendMessage(
    userMessage: string,
    contextId: string,
    type: "global" | "project",
    projectId?: string,
    projectName?: string,
    mode?: "chat" | "code",
  ): Promise<AIResponse> {
    const context = this.getChatContext(contextId, type, projectId, projectName);

    context.messages.push({ role: "user", content: userMessage, timestamp: new Date() });

    try {
      let responseText: string;
      let sessionId: string;

      let proposedTasks: ProposedTask[] | undefined;
      let proposedEpic: EpicProposal | undefined;

      if (type === "project" && projectId) {
        const res = await aiClient.sendProjectMessage(projectId, {
          message: userMessage,
          sessionId: contextId,
          context: mode ? { mode } : undefined,
        });
        responseText = res.message;
        sessionId = res.sessionId;
        proposedTasks = res.proposedTasks;
        proposedEpic = res.proposedEpic;
      } else {
        const res = await aiClient.sendGeneralMessage({
          message: userMessage,
          sessionId: contextId,
        });
        responseText = res.message;
        sessionId = res.sessionId;
      }

      context.messages.push({ role: "assistant", content: responseText, timestamp: new Date() });
      context.lastUpdated = new Date();

      return { content: responseText, sessionId, proposedTasks, proposedEpic };
    } catch (error) {
      console.error("AIService.sendMessage error:", error);
      // Roll back the user message on failure
      context.messages.pop();
      return {
        content: "I encountered an error while processing your request. Please try again.",
      };
    }
  }
}
