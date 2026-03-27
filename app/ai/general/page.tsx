'use client';

import React, { useState } from 'react';
import { useGeneralChat } from '@/hooks/use-general-chat';
import { ChatContainer } from '@/components/ui/chat-container';
import { SessionList } from '@/components/ui/session-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bot, Menu, X } from 'lucide-react';

export default function GeneralAssistantPage() {
  const {
    sessions,
    currentSessionId,
    messages,
    isLoading,
    error,
    sendMessage,
    selectSession,
    createNewSession,
    clearError,
  } = useGeneralChat();

  const [showSessions, setShowSessions] = useState(true);

  const currentSession = sessions.find(s => s.id === currentSessionId);

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar with Sessions */}
      <div className={`${showSessions ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden border-r`}>
        <SessionList
          sessions={sessions}
          activeSessionId={currentSessionId || undefined}
          onSessionSelect={selectSession}
          onNewSession={createNewSession}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSessions(!showSessions)}
              >
                {showSessions ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                <h1 className="text-lg font-semibold">General Assistant</h1>
              </div>
            </div>
            {currentSession && (
              <div className="text-sm text-muted-foreground">
                {currentSession.title}
              </div>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
              <Button variant="outline" size="sm" className="ml-2" onClick={clearError}>
                Dismiss
              </Button>
            </Alert>
          </div>
        )}

        {/* Chat Container */}
        <div className="flex-1">
          <ChatContainer
            messages={messages}
            onSendMessage={sendMessage}
            isLoading={isLoading}
            placeholder="Ask me anything about your workspace, projects, or general questions..."
          />
        </div>
      </div>

      {/* Welcome Card (when no session is selected) */}
      {!currentSessionId && messages.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Card className="max-w-md mx-4 pointer-events-auto">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Bot className="h-6 w-6" />
                Welcome to General Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                I'm your AI assistant for workspace-level questions and cross-project insights.
              </p>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>Ask me about:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Workspace overview and statistics</li>
                  <li>Cross-project insights and patterns</li>
                  <li>General project management advice</li>
                  <li>Best practices and recommendations</li>
                </ul>
              </div>
              <Button onClick={createNewSession} className="w-full">
                Start Conversation
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
