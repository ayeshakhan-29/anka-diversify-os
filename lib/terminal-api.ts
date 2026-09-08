const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

function getHeaders(contentType: string = "application/json"): Record<string, string> {
  if (typeof window === "undefined") {
    return { "Content-Type": contentType, "X-User-ID": "demo-user-id" };
  }
  const token = localStorage.getItem("authToken");
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  return {
    "Content-Type": contentType,
    "X-User-ID": user?.id || "demo-user-id",
    "X-User-Name": user?.name || "Demo User",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface TerminalSessionData {
  sessionId: string;
  projectId: string;
  repositoryId: string;
  repositoryName: string;
  cwd: string;
  status: "idle" | "running" | "closed";
}

export interface TerminalEventHandlers {
  onStarted?: (data: { command: string; cwd: string }) => void;
  onStdout?: (data: { text: string }) => void;
  onStderr?: (data: { text: string }) => void;
  onExit?: (data: { exitCode: number | null; signal: string | null; cwd: string; durationMs: number }) => void;
  onError?: (data: { message: string }) => void;
}

/**
 * Standard ANSI escape control sequence pattern (SGR, CSI, OSC, RIS, character modes).
 * Matches sequences emitted by Jest, TypeScript, npm, Vite, Next.js.
 */
export const ANSI_REGEX =
  /\x1B(?:\[[0-?]*[ -/]*[@-~]|\([a-zA-Z0-9]|\][^\x07\x1b]*(?:\x07|\x1b\\)|[@-Z\\-_c])/g;

/**
 * Pattern matching an incomplete ANSI escape sequence at the tail of a streaming chunk.
 */
export const INCOMPLETE_ANSI_TAIL_REGEX =
  /\x1B(?:\[[0-?]*[ -/]*|\([a-zA-Z0-9]?|\][^\x07\x1b]*)?$/;

/**
 * Strips all ANSI SGR and control sequences from a string.
 */
export function stripAnsi(text: string): string {
  if (!text) return "";
  return text.replace(ANSI_REGEX, "");
}

export interface AnsiSanitizer {
  sanitize(chunk: string): string;
  flush(): string;
}

/**
 * Creates a stateful ANSI sanitizer that correctly handles ANSI escape sequences
 * split across streaming SSE chunk boundaries without leaking broken characters.
 */
export function createAnsiSanitizer(): AnsiSanitizer {
  let remainder = "";

  return {
    sanitize(chunk: string): string {
      const combined = remainder + chunk;
      const match = combined.match(INCOMPLETE_ANSI_TAIL_REGEX);
      if (match && match.index !== undefined) {
        remainder = match[0];
        const completePart = combined.slice(0, match.index);
        return stripAnsi(completePart);
      } else {
        remainder = "";
        return stripAnsi(combined);
      }
    },
    flush(): string {
      const leftover = remainder.replace(/\x1B.*/g, "");
      remainder = "";
      return leftover;
    },
  };
}

/**
 * Identifies synthetic ANKA terminal and security containment errors.
 */
export function isSyntheticTerminalError(text: string): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  return (
    trimmed.startsWith("Access denied:") ||
    trimmed.startsWith("Command rejected by security policy") ||
    trimmed.startsWith("cd: no such file or directory") ||
    trimmed.startsWith("[Terminal Error]") ||
    trimmed.startsWith("[Command Failed]") ||
    trimmed.startsWith("[Error]")
  );
}

export interface TerminalEntryStyleInput {
  type: "command" | "stdout" | "stderr" | "system";
  text: string;
  isError?: boolean;
  isSuccess?: boolean;
}

/**
 * Determines terminal log entry styling.
 * Preserves neutral styling for normal streamed stderr (e.g. Jest output),
 * reserving error-styling for explicit process failures and containment errors.
 */
export function getTerminalEntryStyle(entry: TerminalEntryStyleInput): string {
  if (entry.isError || isSyntheticTerminalError(entry.text)) {
    return "text-rose-400";
  }
  if (entry.isSuccess) {
    return "text-emerald-400";
  }
  switch (entry.type) {
    case "command":
      return "text-cyan-400 font-semibold";
    case "system":
      return "text-violet-400 italic";
    case "stderr":
    case "stdout":
    default:
      return "text-[#e6edf3]";
  }
}

/**
 * Parses raw SSE text frames into structured terminal events.
 */
export function parseSSEFrames(rawText: string, handlers: TerminalEventHandlers): void {
  const lines = rawText.split("\n");
  let currentEvent = "";
  let currentData = "";

  const dispatch = () => {
    if (currentEvent && currentData) {
      try {
        const parsed = JSON.parse(currentData);
        if (currentEvent === "started") handlers.onStarted?.(parsed);
        else if (currentEvent === "stdout") handlers.onStdout?.(parsed);
        else if (currentEvent === "stderr") handlers.onStderr?.(parsed);
        else if (currentEvent === "exit") handlers.onExit?.(parsed);
        else if (currentEvent === "error") handlers.onError?.(parsed);
      } catch {}
    }
    currentEvent = "";
    currentData = "";
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("event:")) {
      currentEvent = trimmed.slice(6).trim();
    } else if (trimmed.startsWith("data:")) {
      currentData = trimmed.slice(5).trim();
    } else if (trimmed === "") {
      dispatch();
    }
  }

  // Dispatch any trailing frame without a trailing newline
  dispatch();
}

export const terminalApi = {
  async createSession(projectId: string, repositoryId?: string): Promise<TerminalSessionData> {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/terminal/sessions`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ repositoryId }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Failed to create terminal session");
    }
    return json.data;
  },

  async runCommand(
    projectId: string,
    sessionId: string,
    command: string,
    handlers: TerminalEventHandlers,
    signal?: AbortSignal
  ): Promise<void> {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/terminal/sessions/${sessionId}/command`, {
      method: "POST",
      headers: {
        ...getHeaders(),
        Accept: "text/event-stream",
      },
      body: JSON.stringify({ command }),
      signal,
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.error || `HTTP error ${res.status}`);
    }

    if (!res.body) {
      throw new Error("No response stream available");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let currentEvent = "";
    let currentData = "";

    const dispatch = () => {
      if (currentEvent && currentData) {
        try {
          const parsed = JSON.parse(currentData);
          if (currentEvent === "started") handlers.onStarted?.(parsed);
          else if (currentEvent === "stdout") handlers.onStdout?.(parsed);
          else if (currentEvent === "stderr") handlers.onStderr?.(parsed);
          else if (currentEvent === "exit") handlers.onExit?.(parsed);
          else if (currentEvent === "error") handlers.onError?.(parsed);
        } catch {}
      }
      currentEvent = "";
      currentData = "";
    };

    const processLine = (line: string) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("event:")) {
        currentEvent = trimmed.slice(6).trim();
      } else if (trimmed.startsWith("data:")) {
        currentData = trimmed.slice(5).trim();
      } else if (trimmed === "") {
        dispatch();
      }
    };

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete tail in buffer

        for (const line of lines) {
          processLine(line);
        }
      }

      // Process any trailing buffered data at EOF
      buffer += decoder.decode();
      if (buffer.length > 0) {
        const remainingLines = buffer.split("\n");
        for (const line of remainingLines) {
          processLine(line);
        }
      }
      dispatch();
    } finally {
      reader.releaseLock();
    }
  },

  async interruptSession(projectId: string, sessionId: string): Promise<boolean> {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/terminal/sessions/${sessionId}/interrupt`, {
      method: "POST",
      headers: getHeaders(),
    });
    const json = await res.json().catch(() => ({}));
    return Boolean(json.data?.interrupted);
  },

  async closeSession(projectId: string, sessionId: string): Promise<boolean> {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/terminal/sessions/${sessionId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    const json = await res.json().catch(() => ({}));
    return Boolean(json.data?.closed);
  },
};
