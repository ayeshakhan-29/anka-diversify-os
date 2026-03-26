'use client';

import { useState, useCallback, useEffect } from 'react';
import { 
  aiClient, 
  ChatRequest, 
  ChatResponse, 
  Message, 
  Session, 
  ProjectContext 
} from '@/lib/ai-client';

interface UseProjectChatState {
  sessions: Session[];
  currentSessionId: string | null;
  messages: Message[];
  projectContext: ProjectContext | undefined;
  isLoading: boolean;
  isContextLoading: boolean;
  error: string | null;
}

interface UseProjectChatActions {
  sendMessage: (message: string, sessionId?: string) => Promise<void>;
  selectSession: (sessionId: string) => void;
  createNewSession: () => void;
  refreshSessions: () => Promise<void>;
  refreshContext: () => Promise<void>;
  clearError: () => void;
}

export function useProjectChat(projectId: string): UseProjectChatState & UseProjectChatActions {
  const [state, setState] = useState<UseProjectChatState>({
    sessions: [],
    currentSessionId: null,
    messages: [],
    projectContext: undefined,
    isLoading: false,
    isContextLoading: false,
    error: null,
  });

  const setStateWithLoading = useCallback((updates: Partial<UseProjectChatState>, isLoading = false) => {
    setState(prev => ({ ...prev, ...updates, isLoading }));
  }, []);

  const setStateWithContextLoading = useCallback((updates: Partial<UseProjectChatState>, isContextLoading = false) => {
    setState(prev => ({ ...prev, ...updates, isContextLoading }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const refreshSessions = useCallback(async () => {
    try {
      setStateWithLoading({ isLoading: true });
      const response = await aiClient.getProjectSessions(projectId);
      setStateWithLoading({ sessions: response.sessions });
    } catch (error) {
      setStateWithLoading({ 
        error: error instanceof Error ? error.message : 'Failed to load sessions' 
      });
    } finally {
      setStateWithLoading({ isLoading: false });
    }
  }, [projectId, setStateWithLoading]);

  const refreshContext = useCallback(async () => {
    try {
      setStateWithContextLoading({ isContextLoading: true });
      const context = await aiClient.getProjectContext(projectId);
      setStateWithContextLoading({ projectContext: context });
    } catch (error) {
      setStateWithContextLoading({ 
        error: error instanceof Error ? error.message : 'Failed to load project context' 
      });
    } finally {
      setStateWithContextLoading({ isContextLoading: false });
    }
  }, [projectId, setStateWithContextLoading]);

  const loadSessionMessages = useCallback(async (sessionId: string) => {
    try {
      setStateWithLoading({ isLoading: true });
      const response = await aiClient.getProjectSessionMessages(projectId, sessionId);
      setStateWithLoading({ 
        messages: response.messages,
        currentSessionId: sessionId 
      });
    } catch (error) {
      setStateWithLoading({ 
        error: error instanceof Error ? error.message : 'Failed to load messages' 
      });
    } finally {
      setStateWithLoading({ isLoading: false });
    }
  }, [projectId, setStateWithLoading]);

  const sendMessage = useCallback(async (message: string, sessionId?: string) => {
    if (!message.trim()) return;

    const targetSessionId = sessionId || state.currentSessionId;
    
    try {
      setStateWithLoading({ isLoading: true, error: null });

      const request: ChatRequest = {
        message: message.trim(),
        sessionId: targetSessionId || undefined,
      };

      const response = await aiClient.sendProjectMessage(projectId, request);

      // Update state with new session ID if this was a new session
      if (!targetSessionId && response.sessionId !== state.currentSessionId) {
        setStateWithLoading({ currentSessionId: response.sessionId });
      }

      // Refresh sessions to update the list
      await refreshSessions();

      // Reload messages for the current session
      await loadSessionMessages(response.sessionId);

      // Refresh context as it might have changed
      await refreshContext();

    } catch (error) {
      setStateWithLoading({ 
        error: error instanceof Error ? error.message : 'Failed to send message' 
      });
    } finally {
      setStateWithLoading({ isLoading: false });
    }
  }, [
    projectId, 
    state.currentSessionId, 
    setStateWithLoading, 
    refreshSessions, 
    loadSessionMessages, 
    refreshContext
  ]);

  const selectSession = useCallback(async (sessionId: string) => {
    if (sessionId === state.currentSessionId) return;
    
    await loadSessionMessages(sessionId);
  }, [state.currentSessionId, loadSessionMessages]);

  const createNewSession = useCallback(() => {
    setStateWithLoading({ 
      currentSessionId: null, 
      messages: [],
      error: null 
    });
  }, [setStateWithLoading]);

  // Load sessions and context on initial mount
  useEffect(() => {
    if (projectId) {
      refreshSessions();
      refreshContext();
    }
  }, [projectId, refreshSessions, refreshContext]);

  return {
    ...state,
    sendMessage,
    selectSession,
    createNewSession,
    refreshSessions,
    refreshContext,
    clearError,
  };
}
