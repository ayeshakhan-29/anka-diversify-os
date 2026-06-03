import { aiClient, type ProposedTask, type EpicProposal, type ProjectHealth, type AIAction } from "./ai-client";
import { buildMessageWithAttachments, type AttachedFile } from "./attachments";

export type { ProposedTask, EpicProposal, ProjectHealth, AIAction };
export type { AttachedFile };

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
  actions?: AIAction[];
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
    signal?: AbortSignal,
    attachments?: AttachedFile[],
  ): Promise<AIResponse> {
    const context = this.getChatContext(contextId, type, projectId, projectName);

    // Build message content: text files are appended inline; images/docs go via context
    const messageText = attachments?.length
      ? buildMessageWithAttachments(userMessage, attachments)
      : userMessage;

    context.messages.push({ role: "user", content: userMessage, timestamp: new Date() });

    try {
      let responseText: string;
      let sessionId: string;

      let proposedTasks: ProposedTask[] | undefined;
      let proposedEpic: EpicProposal | undefined;
      let actions: AIAction[] | undefined;

      const imageAttachments = attachments?.filter((f) => f.kind === "image") ?? [];
      const docAttachments   = attachments?.filter((f) => f.kind === "document") ?? [];

      if (type === "project" && projectId) {
        const ctx: Record<string, unknown> = {};
        if (mode) ctx.mode = mode;
        if (imageAttachments.length) ctx.images    = imageAttachments.map((f) => ({ name: f.name, dataUrl: f.content }));
        if (docAttachments.length)   ctx.documents = docAttachments.map((f) => ({ name: f.name, mimeType: f.mimeType, dataUrl: f.content }));
        const res = await aiClient.sendProjectMessage(
          projectId,
          { message: messageText, sessionId: contextId, context: Object.keys(ctx).length ? ctx : undefined },
          signal,
        );
        responseText = res.message;
        sessionId = res.sessionId;
        proposedTasks = res.proposedTasks;
        proposedEpic = res.proposedEpic;
      } else {
        const ctx: Record<string, unknown> = {};
        if (imageAttachments.length) ctx.images    = imageAttachments.map((f) => ({ name: f.name, dataUrl: f.content }));
        if (docAttachments.length)   ctx.documents = docAttachments.map((f) => ({ name: f.name, mimeType: f.mimeType, dataUrl: f.content }));
        const res = await aiClient.sendGeneralMessage(
          { message: messageText, sessionId: contextId, context: Object.keys(ctx).length ? ctx : undefined },
          signal,
        );
        responseText = res.message;
        sessionId = res.sessionId;
        actions = res.actions;
      }

      context.messages.push({ role: "assistant", content: responseText, timestamp: new Date() });
      context.lastUpdated = new Date();

      return { content: responseText, sessionId, proposedTasks, proposedEpic, actions };
    } catch (error) {
      context.messages.pop();
      if (error instanceof Error && error.name === "AbortError") {
        return { content: "" };
      }
      console.error("AIService.sendMessage error:", error);
      return {
        content: "I encountered an error while processing your request. Please try again.",
      };
    }
  }
}
