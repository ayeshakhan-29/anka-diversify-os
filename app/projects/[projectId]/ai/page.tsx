'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useProjectChat } from '@/hooks/use-project-chat';
import { ChatContainer } from '@/components/ui/chat-container';
import { SessionList } from '@/components/ui/session-list';
import { ContextPanel } from '@/components/ui/context-panel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bot, Menu, X, Settings } from 'lucide-react';

export default function ProjectAssistantPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const {
    sessions,
    currentSessionId,
    messages,
    projectContext,
    isLoading,
    isContextLoading,
    error,
    sendMessage,
    selectSession,
    createNewSession,
    refreshContext,
    clearError,
  } = useProjectChat(projectId);

  const [showSessions, setShowSessions] = useState(true);
  const [showContext, setShowContext] = useState(true);

  const currentSession = sessions.find(s => s.id === currentSessionId);

  if (!projectId) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Project ID is required</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar with Sessions */}
      <div className={`${showSessions ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden border-r`}>
        <SessionList
          sessions={sessions}
          activeSessionId={currentSessionId || undefined}
          onSessionSelect={selectSession}
          onNewSession={createNewSession}
          isLoading={isLoading}
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
                <h1 className="text-lg font-semibold">Project Assistant</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowContext(!showContext)}
              >
                <Settings className="h-4 w-4" />
              </Button>
              {currentSession && (
                <div className="text-sm text-muted-foreground">
                  {currentSession.title}
                </div>
              )}
            </div>
          </div>
          {projectContext && (
            <div className="text-sm text-muted-foreground mt-2">
              Project: {projectContext.project.name}
              {projectContext.project.phase && ` • Phase: ${projectContext.project.phase}`}
              {` • Progress: ${projectContext.project.progress}%`}
            </div>
          )}
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
            placeholder={`Ask me anything about "${projectContext?.project.name || 'this project'}"...`}
          />
        </div>
      </div>

      {/* Context Panel */}
      <div className={`${showContext ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden border-l`}>
        <ContextPanel
          context={projectContext}
          isLoading={isContextLoading}
        />
      </div>

      {/* Welcome Card (when no session is selected) */}
      {!currentSessionId && messages.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Card className="max-w-md mx-4 pointer-events-auto">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Bot className="h-6 w-6" />
                Project Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                I'm your specialized AI assistant for this project, with deep knowledge of its context, tasks, and progress.
              </p>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>I can help you with:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Project planning and next steps</li>
                  <li>Task management and prioritization</li>
                  <li>Decision-making based on project context</li>
                  <li>Progress tracking and insights</li>
                  <li>Team collaboration guidance</li>
                </ul>
              </div>
              <Button onClick={createNewSession} className="w-full">
                Start Project Conversation
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
