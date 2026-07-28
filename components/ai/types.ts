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
  intent?: "BUG_FIX" | "FEATURE_ADD" | "REFACTOR" | "DOCS" | "OPTIMIZATION";
  confidence?: number;
  roadmap?: { phase: number; title: string; layer?: string; targetFiles: string[]; description: string }[];
  securityPass?: boolean;
  critiqueScore?: number;
  buildVerified?: boolean;
  buildErrors?: string;
}
