"use client";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Send,
  Zap,
  Square,
  ListTodo,
  CalendarClock,
  ArrowUpDown,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Project } from "@/lib/types";

interface ChatInputProps {
  input: string;
  mode: "chat" | "agent";
  isLoading: boolean;
  project: Project;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onQuickAction: (prompt: string) => void;
}

export function ChatInput({
  input,
  mode,
  isLoading,
  project,
  onInputChange,
  onSend,
  onStop,
  onKeyDown,
  onQuickAction,
}: ChatInputProps) {
  return (
    <div className="border-t p-3 shrink-0">
      <div className="flex gap-2">
        <Textarea
          placeholder={
            mode === "agent"
              ? `Tell the agent what to code in ${project.name}...`
              : `Ask about ${project.name}...`
          }
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={onKeyDown}
          className="min-h-15 resize-none"
          disabled={isLoading}
        />
        {isLoading ? (
          <Button
            variant="outline"
            className="shrink-0 border-red-500/50 text-red-400 hover:bg-red-500/10"
            onClick={onStop}
          >
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            className={cn("shrink-0", mode === "agent" && "bg-violet-600 hover:bg-violet-700")}
            onClick={onSend}
            disabled={!input.trim()}
          >
            {mode === "agent" ? <Zap className="h-4 w-4" /> : <Send className="h-4 w-4" />}
          </Button>
        )}
      </div>
      {mode === "chat" && (
        <div className="flex gap-1.5 mt-2 flex-wrap">
          <button
            onClick={() =>
              onQuickAction(
                "Extract all actionable tasks from our discussion and propose them as Kanban tasks with priorities.",
              )
            }
            disabled={isLoading}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary/50 hover:bg-secondary text-xs text-muted-foreground transition-colors disabled:opacity-50"
          >
            <ListTodo className="h-3 w-3" />Extract Tasks
          </button>
          <button
            onClick={() =>
              onQuickAction(
                "Give me a quick standup summary: what tasks are done, what's in progress, and what might be blocked?",
              )
            }
            disabled={isLoading}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary/50 hover:bg-secondary text-xs text-muted-foreground transition-colors disabled:opacity-50"
          >
            <CalendarClock className="h-3 w-3" />Standup
          </button>
          <button
            onClick={() =>
              onQuickAction(
                "Based on the project goals and current tasks, which 3 tasks should we focus on first this week and why?",
              )
            }
            disabled={isLoading}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary/50 hover:bg-secondary text-xs text-muted-foreground transition-colors disabled:opacity-50"
          >
            <ArrowUpDown className="h-3 w-3" />Prioritize
          </button>
          <button
            onClick={() =>
              onQuickAction(
                "Generate a full epic breakdown for the next major feature we should build based on the project context and current tasks.",
              )
            }
            disabled={isLoading}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-blue-500/10 hover:bg-blue-500/20 text-xs text-blue-400 transition-colors disabled:opacity-50"
          >
            <Sparkles className="h-3 w-3" />Generate Epic
          </button>
        </div>
      )}
      {mode === "agent" && (
        <p className="text-xs text-muted-foreground mt-1.5">
          Agent will propose file changes — you review and confirm before pushing.
        </p>
      )}
    </div>
  );
}
