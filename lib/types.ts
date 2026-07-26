// Project Phase Engine Types
export type ProjectPhase =
  | "product-modeling"
  | "development"
  | "marketing"
  | "completed";

export interface Project {
  id: string;
  name: string;
  description: string;
  phase: ProjectPhase;
  progress: number;
  team: TeamMember[];
  members: ProjectMember[];
  startDate: string;
  dueDate: string;
  tasks: Task[];
  priority: "low" | "medium" | "high" | "critical";
  status: "active" | "on-hold" | "completed";
  githubUrl?: string;
  localPath?: string;
  lastCommit?: {
    message: string;
    author: string;
    timestamp: string;
  };
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: "backlog" | "todo" | "in-progress" | "review" | "done";
  priority: "low" | "medium" | "high" | "critical";
  assignee?: TeamMember;
  projectId: string;
  phase: ProjectPhase;
  dueDate: string;
  createdAt: string;
  tags: string[];
  blockingIds?: string[];
  blockedByIds?: string[];
  commentCount?: number;
}

export interface ChecklistItem {
  id: string;
  taskId: string;
  projectId: string;
  text: string;
  checked: boolean;
  position: number;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  department: string;
  status: "online" | "away" | "offline";
}

export interface Sprint {
  id: string;
  name: string;
  projectId: string;
  startDate: string;
  endDate: string;
  status: "planning" | "active" | "completed";
  tasks: Task[];
  velocity: number;
}

export interface Document {
  id: string;
  title: string;
  type: "doc" | "spreadsheet" | "presentation" | "design" | "code";
  projectId?: string;
  author: TeamMember;
  lastModified: string;
  size: string;
}

export interface GitCommit {
  id: string;
  hash: string;
  message: string;
  author: TeamMember;
  branch: string;
  timestamp: string;
  additions: number;
  deletions: number;
}

export interface GitBranch {
  name: string;
  isDefault: boolean;
  lastCommit: string;
  author: TeamMember;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: TeamMember | "ai";
  timestamp: string;
  type: "text" | "code" | "file";
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  timestamp: string;
  link?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "developer" | "designer" | "viewer";
  department: string;
  avatar: string;
  status: "active" | "inactive" | "suspended";
  lastActive: string;
  createdAt: string;
}

export interface Rule {
  id: string;
  name: string;
  description: string;
  category: "security" | "workflow" | "access" | "notification";
  enabled: boolean;
  conditions: string[];
  actions: string[];
  createdBy: string;
  createdAt: string;
}

export interface ProjectFile {
  id: string;
  projectId: string;
  name: string;
  type: "doc" | "image" | "spreadsheet" | "design" | "code" | "other";
  phase: string;
  url?: string;
  size?: string;
  uploadedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  id: string;
  name?: string;
  email: string;
  role: string;
  department?: string;
  status: string;
  joinedAt: string;
}

export interface Activity {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId?: string;
  entityName?: string;
  meta?: Record<string, any>;
  createdAt: string;
}

export interface ProjectChatMessage {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  taskId: string;
  projectId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  head: TeamMember;
  members: TeamMember[];
  projects: Project[];
}

export interface GitCommitItem {
  sha: string;
  shortSha: string;
  message: string;
  authorName: string;
  authorLogin: string;
  authorAvatar: string;
  timestamp: string;
  url: string;
  branch: string;
}

export interface GitBranchItem {
  name: string;
  isDefault: boolean;
  commitSha: string;
  url: string;
  protected: boolean;
}

export interface GitPullItem {
  number: number;
  title: string;
  author: string;
  state: "open" | "closed" | "merged";
  createdAt: string;
  updatedAt: string;
  mergedAt?: string;
  additions: number;
  deletions: number;
  changedFiles: number;
  url: string;
  draft: boolean;
  labels: string[];
  baseBranch: string;
  headBranch: string;
}

// ── Phased workflow (Documentation → Architecture → Implementation → Testing) ──
// Distinct from ProjectPhase above, which is the coarse product-modeling/development/
// marketing category. This is the fine-grained lifecycle within a project.

export type WorkflowPhase =
  | "requirements"
  | "documentation"
  | "architecture"
  | "implementation"
  | "testing"
  | "review";

export const WORKFLOW_PHASES: WorkflowPhase[] = [
  "requirements",
  "documentation",
  "architecture",
  "implementation",
  "testing",
  "review",
];

export type WorkflowPhaseStatus =
  | "not_started"
  | "in_progress"
  | "awaiting_approval"
  | "approved"
  | "completed";

export interface ProjectPhaseState {
  id: string;
  projectId: string;
  phase: WorkflowPhase;
  status: WorkflowPhaseStatus;
  startedAt?: string;
  completedAt?: string;
  approvedById?: string;
  approvedAt?: string;
  notes?: string;
}

export interface PhaseArtifact {
  id: string;
  projectId: string;
  phase: WorkflowPhase;
  type: string;
  title: string;
  content: string;
  version: number;
  createdBy: string;
  createdAt: string;
  approved: boolean;
}

export interface PhaseApproval {
  id: string;
  projectId: string;
  phase: WorkflowPhase;
  approvedById: string;
  approvedAt: string;
  decision: "approved" | "changes_requested" | "rejected";
  comments?: string;
}

export interface WorkflowRun {
  id: string;
  projectId: string;
  triggerType: string;
  currentPhase: WorkflowPhase;
  status: "running" | "completed" | "failed" | "cancelled";
  startedAt: string;
  completedAt?: string;
  modelUsage?: { model: string; prompt_tokens: number; completion_tokens: number };
  costUSD?: number;
}
