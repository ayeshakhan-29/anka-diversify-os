export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface AgentResult {
  explanation: string;
  changes: { path: string; content: string; description: string }[];
  commitMessage: string;
  sessionId: string;
}
