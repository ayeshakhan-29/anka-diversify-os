import type { TaskType, TaskRisk, TaskComplexity } from "@/lib/ai-client";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface ChecklistItem {
  label: string;
  checked: boolean;
  category?: string;
}

export interface AgentResult {
  explanation: string;
  changes: { path: string; content: string; description: string }[];
  commitMessage: string;
  sessionId: string;
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
  verificationChecklist?: ChecklistItem[];
  lifecycleStage?: string;
}
