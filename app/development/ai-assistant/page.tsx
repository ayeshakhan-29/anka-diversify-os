"use client";

import { useState, useRef, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bot,
  Send,
  Paperclip,
  Code,
  FileText,
  Lightbulb,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  MessageSquare,
  Loader2,
  FolderOpen,
  ArrowRight,
  X,
  Image,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AIService, type AIAction } from "@/lib/ai-service";
import { aiClient } from "@/lib/ai-client";
import {
  type AttachedFile,
  ACCEPTED_FILE_TYPES,
  readAttachedFile,
  formatFileSize,
} from "@/lib/attachments";
import Link from "next/link";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  codeBlocks?: { language: string; code: string }[];
  actions?: AIAction[];
}

const suggestedPrompts = [
  "Help me write a React component for a data table",
  "Explain how to optimize database queries",
  "Generate API documentation for this endpoint",
  "Review this code for potential improvements",
  "How do I implement authentication in Next.js?",
];

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content:
      "Hello! I'm the Anka AI Assistant. I can help you with:\n\n- Writing and reviewing code\n- Generating documentation\n- Answering technical questions\n- Debugging issues\n- Best practices and recommendations\n\nHow can I assist you today?",
    timestamp: new Date(Date.now() - 60000),
  },
];

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [userInitials, setUserInitials] = useState("ME");
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const results = await Promise.all(files.map(readAttachedFile));
    const valid = results.filter(Boolean) as AttachedFile[];
    setAttachedFiles((prev) => [...prev, ...valid]);
    e.target.value = "";
  };

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      const name: string = user?.name || user?.email || "Me";
      setUserInitials(name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase());
    }
  }, []);

  // Load chat history from backend on mount
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const { sessions } = await aiClient.getGeneralSessions();
        const latest = sessions[0];
        if (!latest) return;
        setSessionId(latest.id);
        const { messages: msgs } = await aiClient.getGeneralSessionMessages(latest.id);
        if (msgs.length === 0) return;
        setMessages(
          msgs.map((m) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.content,
            timestamp: new Date(m.createdAt),
          })),
        );
      } catch {
        // backend unreachable — keep welcome message
      } finally {
        setIsLoadingHistory(false);
      }
    };
    loadChatHistory();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() && !attachedFiles.length || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    const files = attachedFiles;
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setAttachedFiles([]);
    setIsLoading(true);

    try {
      const response = await AIService.sendMessage(
        userMessage.content,
        sessionId ?? "global-chat",
        "global",
        undefined,
        undefined,
        undefined,
        undefined,
        files,
      );

      if (response.sessionId) setSessionId(response.sessionId);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.content,
        timestamp: new Date(),
        actions: response.actions,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("AI Service Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I apologize, but I encountered an error while processing your request. Please try again later.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    setSessionId(undefined);
    setMessages(initialMessages);
  };

  return (
    <MainLayout breadcrumb={["Development", "AI Assistant"]}>
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-6rem)]">
        {/* Main Chat */}
        <div className="flex-1 flex flex-col min-w-0">
          <Card className="h-full flex flex-col bg-card border-border overflow-hidden">
            <CardHeader className="border-b border-border shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                    <Bot className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-foreground">
                      AI Work Assistant
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      General workspace chat
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    <Sparkles className="h-3 w-3 mr-1" />
                    GPT-4
                  </Badge>
                  <Button variant="outline" size="sm" onClick={handleClearChat}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                </div>
              </div>
            </CardHeader>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
              <div className="space-y-6">
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
                            ? "bg-linear-to-br from-purple-500 to-blue-500 text-white"
                            : "bg-secondary text-foreground",
                        )}
                      >
                        {message.role === "assistant" ? (
                          <Bot className="h-4 w-4" />
                        ) : (
                          userInitials
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={cn(
                        "flex-1 max-w-[80%] space-y-2",
                        message.role === "user" && "flex flex-col items-end",
                      )}
                    >
                      <div
                        className={cn(
                          "rounded-lg p-4",
                          message.role === "assistant"
                            ? "bg-secondary/50"
                            : "bg-primary text-primary-foreground",
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap">
                          {message.content}
                        </p>
                      </div>

                      {/* Action Cards */}
                      {message.actions?.map((action, i) => (
                        <div
                          key={i}
                          className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 w-full"
                        >
                          {action.type === "project_created" && (
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-green-500/20">
                                  <FolderOpen className="h-4 w-4 text-green-600 dark:text-green-400" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-medium text-green-700 dark:text-green-300">Project created</p>
                                  <p className="text-sm font-semibold text-foreground truncate">{action.data.name as string}</p>
                                </div>
                              </div>
                              <Link
                                href={`/development/projects/${action.data.id}`}
                                className="flex shrink-0 items-center gap-1 text-xs text-green-700 dark:text-green-400 hover:underline"
                              >
                                Open <ArrowRight className="h-3 w-3" />
                              </Link>
                            </div>
                          )}
                          {action.type === "document_saved" && (
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-green-500/20">
                                  <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-medium text-green-700 dark:text-green-300">
                                    Document saved to <span className="font-semibold">{action.data.projectName as string}</span>
                                  </p>
                                  <p className="text-sm font-semibold text-foreground truncate">{action.data.title as string}</p>
                                </div>
                              </div>
                              <Link
                                href={`/development/projects/${action.data.projectId}`}
                                className="flex shrink-0 items-center gap-1 text-xs text-green-700 dark:text-green-400 hover:underline"
                              >
                                View <ArrowRight className="h-3 w-3" />
                              </Link>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Code Blocks */}
                      {message.codeBlocks?.map((block, i) => (
                        <div
                          key={i}
                          className="rounded-lg border border-border bg-[#0d1117] overflow-hidden w-full"
                        >
                          <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-border">
                            <div className="flex items-center gap-2">
                              <Code className="h-4 w-4 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {block.language}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() =>
                                copyToClipboard(
                                  block.code,
                                  `${message.id}-${i}`,
                                )
                              }
                            >
                              {copiedId === `${message.id}-${i}` ? (
                                <>
                                  <Check className="h-3 w-3 mr-1" />
                                  Copied
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3 mr-1" />
                                  Copy
                                </>
                              )}
                            </Button>
                          </div>
                          <pre className="p-4 overflow-x-auto">
                            <code className="text-sm font-mono text-foreground">
                              {block.code}
                            </code>
                          </pre>
                        </div>
                      ))}

                      <p className="text-xs text-muted-foreground">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="bg-linear-to-br from-purple-500 to-blue-500 text-white">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-2 rounded-lg bg-linear-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border border-purple-200/50 dark:border-purple-800/50 p-4 shadow-sm">
                      <Loader2 className="h-4 w-4 text-purple-600 dark:text-purple-400 animate-spin" />
                      <span className="text-sm text-muted-foreground">AI is thinking...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Input */}
            <div className="border-t border-border p-4 shrink-0">
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
                        onClick={() => setAttachedFiles((prev) => prev.filter((x) => x.name !== f.name))}
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
                    ref={textareaRef}
                    placeholder="Ask the AI assistant..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="min-h-15 sm:min-h-20 resize-none pr-10"
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
                <Button
                  className="shrink-0"
                  onClick={handleSend}
                  disabled={(!input.trim() && !attachedFiles.length) || isLoading}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ACCEPTED_FILE_TYPES}
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="w-80 space-y-4 shrink-0 hidden lg:block">
          {/* Suggested Prompts */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-warning" />
                Suggested Prompts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {suggestedPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => setInput(prompt)}
                  className="w-full text-left p-3 rounded-lg bg-secondary/50 hover:bg-secondary text-sm text-foreground transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Capabilities */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-foreground">
                Capabilities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <Code className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Code Generation
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Write, review, and refactor code
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Documentation
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Generate and improve docs
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MessageSquare className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Q&A</p>
                  <p className="text-xs text-muted-foreground">
                    Answer technical questions
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Online Team Members */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-foreground">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start text-sm"
                onClick={() => setInput("Help me understand the project structure")}
              >
                <FileText className="h-4 w-4 mr-2" />
                Project Structure
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-sm"
                onClick={() => setInput("Review my recent code changes")}
              >
                <Code className="h-4 w-4 mr-2" />
                Code Review
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-sm"
                onClick={() => setInput("Suggest improvements for performance")}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Optimization Tips
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-sm"
                onClick={() => setInput("What are the best practices for this project?")}
              >
                <Lightbulb className="h-4 w-4 mr-2" />
                Best Practices
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
