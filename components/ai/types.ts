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

export interface AgentFileChange {
  path: string;
  content: string;
  description: string;
  repositoryId?: string;
}

export type VisualVerificationStatus =
  | "NOT_APPLICABLE"
  | "PASSED"
  | "PASSED_WITH_WARNINGS"
  | "STARTUP_FAILED"
  | "RUNTIME_FAILED"
  | "BROWSER_UNAVAILABLE";

export interface VisualVerificationResult {
  status: VisualVerificationStatus;
  framework: "NEXT_JS" | "VITE_REACT" | "UNKNOWN";
  route: string;
  url?: string;
  httpStatus?: number;
  screenshotPath?: string;
  title?: string;
  viewport?: {
    width: number;
    height: number;
  };
  pageErrors: string[];
  consoleErrors: string[];
  failedRequests: string[];
  startupErrors?: string;
  durationMs: number;
}

export interface AgentResult {
  explanation: string;
  changes: AgentFileChange[];
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
  visualVerification?: VisualVerificationResult;
  gitApproval?: {
    approvalId: string;
    changedPaths: readonly string[];
    expiresAt: string;
  };
}

/**
 * Canonical frontend identity for a proposed change.
 * In multi-repo mode, relative paths can collide across repositories.
 * Returns `${repositoryId ?? "primary"}:${path}`.
 */
export function getChangeKey(change: { path: string; repositoryId?: string | null }): string {
  return `${change.repositoryId ?? "primary"}:${change.path}`;
}

/**
 * Finds a proposed change matching both repositoryId and path.
 */
export function findChangeByRepoAndPath<T extends { path: string; repositoryId?: string | null }>(
  changes: T[],
  path: string,
  repositoryId?: string | null
): T | undefined {
  const targetKey = `${repositoryId ?? "primary"}:${path}`;
  return changes.find((c) => getChangeKey(c) === targetKey);
}

/**
 * Creates a Map of proposed changes keyed by their canonical change key.
 */
export function createChangeMap<T extends { path: string; repositoryId?: string | null }>(
  changes: T[]
): Map<string, T> {
  const map = new Map<string, T>();
  for (const change of changes) {
    map.set(getChangeKey(change), change);
  }
  return map;
}

/**
 * Normalizes preserved selected files from legacy/plain path representations
 * to canonical repository-aware keys where unambiguous.
 * For duplicate relative paths occurring across multiple repositories (e.g. src/types/user.ts in both API and WEB),
 * the plain path entry is preserved so fallback matching keeps both selected without guessing.
 */
export function normalizePreservedSelection(
  rawSelected: string[] | Set<string>,
  changes: AgentFileChange[]
): Set<string> {
  const inputList = Array.from(rawSelected);
  const normalized = new Set<string>();

  for (const item of inputList) {
    if (changes.some((c) => getChangeKey(c) === item)) {
      normalized.add(item);
      continue;
    }

    const matchingChanges = changes.filter((c) => c.path === item);
    if (matchingChanges.length === 1) {
      normalized.add(getChangeKey(matchingChanges[0]));
    } else {
      normalized.add(item);
    }
  }

  return normalized;
}

/**
 * Toggles selection of a file change using canonical repository-aware keys.
 * If a legacy plain path entry was providing selection for duplicate relative paths across
 * different repositories, deselecting one repo's change will migrate the sibling changes to
 * canonical keys so the sibling repository changes are not accidentally deselected.
 */
export function toggleChangeSelection(
  prev: Set<string>,
  keyOrPath: string,
  changes: AgentFileChange[]
): Set<string> {
  const next = new Set(prev);
  const targetChange = changes.find((c) => getChangeKey(c) === keyOrPath || c.path === keyOrPath);
  const targetKey = targetChange ? getChangeKey(targetChange) : keyOrPath;
  const targetPath = targetChange ? targetChange.path : keyOrPath;

  const isCurrentlySelected = prev.has(targetKey) || prev.has(targetPath);

  if (isCurrentlySelected) {
    next.delete(targetKey);
    if (prev.has(targetPath)) {
      next.delete(targetPath);
      for (const c of changes) {
        if (c.path === targetPath && getChangeKey(c) !== targetKey) {
          next.add(getChangeKey(c));
        }
      }
    }
  } else {
    next.add(targetKey);
  }
  return next;
}


