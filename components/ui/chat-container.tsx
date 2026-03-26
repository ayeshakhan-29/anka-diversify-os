'use client';

import React, { useRef, useEffect } from 'react';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';
import { Message } from '@/lib/ai-client';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChatContainerProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showInput?: boolean;
}

export function ChatContainer({
  messages,
  onSendMessage,
  isLoading = false,
  placeholder = "Type your message...",
  className,
  disabled = false,
  showInput = true,
}: ChatContainerProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Messages Area */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center space-y-2">
              <p className="text-lg font-medium">No messages yet</p>
              <p className="text-sm">Start a conversation to get started</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isLoading && (
              <ChatMessage
                message={{
                  id: 'loading',
                  sessionId: '',
                  role: 'assistant',
                  content: 'Thinking...',
                  createdAt: new Date().toISOString(),
                }}
                isLoading={true}
              />
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      {showInput && (
        <div className="border-t p-4">
          <ChatInput
            onSendMessage={onSendMessage}
            isLoading={isLoading}
            placeholder={placeholder}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
}

export default ChatContainer;
