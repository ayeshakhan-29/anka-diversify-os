"use client";

import { useRef } from "react";
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
  FileText,
  GitBranch,
  Paperclip,
  X,
  Image,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Project } from "@/lib/types";
import {
  type AttachedFile,
  ACCEPTED_FILE_TYPES,
  readAttachedFile,
  formatFileSize,
} from "@/lib/attachments";

interface ChatInputProps {
  input: string;
  mode: "chat" | "agent";
  isLoading: boolean;
  project: Project;
  attachedFiles?: AttachedFile[];
  onInputChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onQuickAction: (prompt: string) => void;
  onPasteMeetingNotes?: () => void;
  onGenerateSprint?: (prompt: string) => void;
  onAttachedFilesChange?: (files: AttachedFile[]) => void;
}

export function ChatInput({
  input,
  mode,
  isLoading,
  project,
  attachedFiles = [],
  onInputChange,
  onSend,
  onStop,
  onKeyDown,
  onQuickAction,
  onPasteMeetingNotes,
  onGenerateSprint,
  onAttachedFilesChange,
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const results = await Promise.all(files.map(readAttachedFile));
    const valid = results.filter(Boolean) as AttachedFile[];
    onAttachedFilesChange?.([...attachedFiles, ...valid]);
    e.target.value = "";
  };

  const removeFile = (name: string) => {
    onAttachedFilesChange?.(attachedFiles.filter((f) => f.name !== name));
  };

  return (
    <div className="border-t p-3 shrink-0">
      {/* Attached file chips */}
      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {attachedFiles.map((f) => (
            <div
              key={f.name}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary text-xs text-foreground max-w-48"
            >
              {f.kind === "image" ? (
                <Image className="h-3 w-3 shrink-0 text-blue-400" />
              ) : (
                <FileText className="h-3 w-3 shrink-0 text-muted-foreground" />
              )}
              <span className="truncate">{f.name}</span>
              <span className="text-muted-foreground shrink-0">({formatFileSize(f.size)})</span>
              <button
                onClick={() => removeFile(f.name)}
                className="ml-0.5 shrink-0 hover:text-destructive transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Textarea
            placeholder={
              mode === "agent"
                ? `Tell the agent what to code in ${project.name}...`
                : `Ask about ${project.name}...`
            }
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={onKeyDown}
            className="min-h-15 resize-none pr-10"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="absolute bottom-2 right-2 h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
          >
            <Paperclip className="h-4 w-4" />
          </button>
        </div>
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
            disabled={!input.trim() && !attachedFiles.length}
          >
            {mode === "agent" ? <Zap className="h-4 w-4" /> : <Send className="h-4 w-4" />}
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ACCEPTED_FILE_TYPES}
        className="hidden"
        onChange={handleFileChange}
      />

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
          <button
            onClick={onPasteMeetingNotes}
            disabled={isLoading}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary/50 hover:bg-secondary text-xs text-muted-foreground transition-colors disabled:opacity-50"
          >
            <FileText className="h-3 w-3" />Meeting Notes
          </button>
          <button
            onClick={() => onGenerateSprint?.(`Plan a 2-week sprint for ${project.name} based on current tasks and priorities.`)}
            disabled={isLoading}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-violet-500/10 hover:bg-violet-500/20 text-xs text-violet-400 transition-colors disabled:opacity-50"
          >
            <GitBranch className="h-3 w-3" />Plan Sprint
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
