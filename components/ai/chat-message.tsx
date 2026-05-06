"use client";

import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "./types";

interface ChatMessageProps {
  message: Message;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
}

export function ChatMessage({ message, copiedId, onCopy }: ChatMessageProps) {
  return (
    <div className={cn("flex gap-3", message.role === "user" && "flex-row-reverse")}>
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback
          className={cn(
            message.role === "assistant"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-foreground",
          )}
        >
          {message.role === "assistant" ? <Bot className="h-4 w-4" /> : "ME"}
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
            message.role === "assistant" ? "bg-secondary/50" : "bg-primary text-primary-foreground",
          )}
        >
          {message.role === "assistant" ? (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-pre:p-0 prose-pre:bg-transparent">
              <ReactMarkdown
                components={{
                  code({ node, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || "");
                    if (!match) {
                      return (
                        <code
                          className="bg-black/20 rounded px-1 py-0.5 text-xs font-mono"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    }
                    const codeStr = String(children).replace(/\n$/, "");
                    const copyKey = `code-${codeStr.slice(0, 20)}`;
                    return (
                      <div className="relative group my-2">
                        <button
                          onClick={() => onCopy(codeStr, copyKey)}
                          className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-secondary rounded p-1"
                        >
                          {copiedId === copyKey ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                        <SyntaxHighlighter
                          style={oneDark}
                          language={match[1]}
                          PreTag="div"
                          customStyle={{
                            margin: 0,
                            borderRadius: "0.375rem",
                            fontSize: "0.75rem",
                          }}
                        >
                          {codeStr}
                        </SyntaxHighlighter>
                      </div>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{message.content}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground">
            {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
          {message.role === "assistant" && (
            <button
              onClick={() => onCopy(message.content, message.id)}
              className="text-muted-foreground hover:text-foreground transition-colors"
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
  );
}
