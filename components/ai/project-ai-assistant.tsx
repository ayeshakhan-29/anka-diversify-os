"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bot,
  Send,
  RotateCcw,
  Sparkles,
  Code,
  Bug,
  FileText,
  Lightbulb,
  Copy,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AIService } from "@/lib/ai-service";
import type { Project } from "@/lib/types";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const projectSuggestedPrompts = [
  "Summarize the current project status",
  "What tasks are high priority?",
  "Help me write code for this project",
  "Suggest improvements for the architecture",
  "Generate a progress report",
];

interface ProjectAIAssistantProps {
  project: Project;
}

export function ProjectAIAssistant({ project }: ProjectAIAssistantProps) {
  const contextId = `project-${project.id}`;

  const getInitialMessages = (): Message[] => [
    {
      id: "1",
      role: "assistant",
      content: `Hi! I'm the AI assistant for **${project.name}**.\n\nI have context about this project including its tasks, team members, and current phase (${project.phase}). How can I help you?`,
      timestamp: new Date(),
    },
  ];

  const [messages, setMessages] = useState<Message[]>(getInitialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const history = AIService.getChatHistory(contextId);
    if (history.length > 0) {
      setMessages(
        history.map((msg, i) => ({
          id: i.toString(),
          role: msg.role as "user" | "assistant",
          content: msg.content,
          timestamp: msg.timestamp || new Date(),
        })),
      );
    }
  }, [contextId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await AIService.sendMessage(
        userMessage.content,
        contextId,
        "project",
        project.id,
        project.name,
      );

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: response.content,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    AIService.clearChatContext(contextId);
    setMessages(getInitialMessages());
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex gap-4 p-4 h-[calc(100vh-320px)]">
      {/* Chat */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="border-b shrink-0 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Bot className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">
                  {project.name} — AI Assistant
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Project-scoped context
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                GPT-4
              </Badge>
              <Button variant="outline" size="sm" onClick={handleClear}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </CardHeader>

        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === "user" && "flex-row-reverse",
                )}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback
                    className={cn(
                      message.role === "assistant"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-foreground",
                    )}
                  >
                    {message.role === "assistant" ? (
                      <Bot className="h-4 w-4" />
                    ) : (
                      "ME"
                    )}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={cn(
                    "flex-1 max-w-[80%] space-y-1",
                    message.role === "user" && "flex flex-col items-end",
                  )}
                >
                  <div
                    className={cn(
                      "rounded-lg p-3 text-sm",
                      message.role === "assistant"
                        ? "bg-secondary/50"
                        : "bg-primary text-primary-foreground",
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {message.role === "assistant" && (
                      <button
                        onClick={() => copyToClipboard(message.content, message.id)}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {copiedId === message.id ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-2 rounded-lg bg-secondary/50 p-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-primary animate-bounce" />
                    <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
                    <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t p-3 shrink-0">
          <div className="flex gap-2">
            <Textarea
              placeholder={`Ask about ${project.name}...`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[60px] resize-none"
              disabled={isLoading}
            />
            <Button
              className="shrink-0"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Sidebar */}
      <div className="w-64 space-y-3 shrink-0 hidden lg:flex lg:flex-col">
        {/* Project context */}
        <Card>
          <CardHeader className="pb-2 pt-3 px-3">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Project Context
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phase</span>
              <Badge variant="outline" className="text-xs">
                {project.phase}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tasks</span>
              <span>{project.tasks.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Progress</span>
              <span>{project.progress}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Team</span>
              <span>{project.team.length} members</span>
            </div>
          </CardContent>
        </Card>

        {/* Suggested prompts */}
        <Card>
          <CardHeader className="pb-2 pt-3 px-3">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Lightbulb className="h-3 w-3" />
              Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 space-y-1">
            {projectSuggestedPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => setInput(prompt)}
                className="w-full text-left p-2 rounded-md bg-secondary/50 hover:bg-secondary text-xs text-foreground transition-colors"
              >
                {prompt}
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Capabilities */}
        <Card>
          <CardHeader className="pb-2 pt-3 px-3">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Capabilities
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 space-y-2">
            {[
              { icon: Code, label: "Code help" },
              { icon: Bug, label: "Debug issues" },
              { icon: FileText, label: "Documentation" },
              { icon: Lightbulb, label: "Suggestions" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-xs text-muted-foreground">
                <Icon className="h-3.5 w-3.5 text-primary" />
                {label}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
