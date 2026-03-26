'use client';

import { useState, useCallback, useEffect } from 'react';
import { aiClient, ChatRequest, ChatResponse, Message, Session } from '@/lib/ai-client';

interface UseGeneralChatState {
  sessions: Session[];
  currentSessionId: string | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

interface UseGeneralChatActions {
  sendMessage: (message: string, sessionId?: string) => Promise<void>;
  selectSession: (sessionId: string) => void;
  createNewSession: () => void;
  refreshSessions: () => Promise<void>;
  clearError: () => void;
}

export function useGeneralChat(): UseGeneralChatState & UseGeneralChatActions {
  const [state, setState] = useState<UseGeneralChatState>({
    sessions: [],
    currentSessionId: null,
    messages: [],
    isLoading: false,
    error: null,
  });

  const setStateWithLoading = useCallback((updates: Partial<UseGeneralChatState>, isLoading = false) => {
    setState(prev => ({ ...prev, ...updates, isLoading }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const refreshSessions = useCallback(async () => {
    try {
      setStateWithLoading({ isLoading: true });
      const response = await aiClient.getGeneralSessions();
      setStateWithLoading({ sessions: response.sessions });
    } catch (error) {
      setStateWithLoading({ 
        error: error instanceof Error ? error.message : 'Failed to load sessions' 
      });
    } finally {
      setStateWithLoading({ isLoading: false });
    }
  }, [setStateWithLoading]);

  const loadSessionMessages = useCallback(async (sessionId: string) => {
    try {
      setStateWithLoading({ isLoading: true });
      const response = await aiClient.getGeneralSessionMessages(sessionId);
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
  }, [setStateWithLoading]);

  const sendMessage = useCallback(async (message: string, sessionId?: string) => {
    if (!message.trim()) return;

    const targetSessionId = sessionId || state.currentSessionId;
    
    try {
      setStateWithLoading({ isLoading: true, error: null });

      const request: ChatRequest = {
        message: message.trim(),
        sessionId: targetSessionId || undefined,
      };

      const response = await aiClient.sendGeneralMessage(request);

      // Update state with new session ID if this was a new session
      if (!targetSessionId && response.sessionId !== state.currentSessionId) {
        setStateWithLoading({ currentSessionId: response.sessionId });
      }

      // Refresh sessions to update the list
      await refreshSessions();

      // Reload messages for the current session
      await loadSessionMessages(response.sessionId);

    } catch (error) {
      setStateWithLoading({ 
        error: error instanceof Error ? error.message : 'Failed to send message' 
      });
    } finally {
      setStateWithLoading({ isLoading: false });
    }
  }, [state.currentSessionId, setStateWithLoading, refreshSessions, loadSessionMessages]);

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

  // Load sessions on initial mount
  useEffect(() => {
    refreshSessions();
  }, [refreshSessions]);

  return {
    ...state,
    sendMessage,
    selectSession,
    createNewSession,
    refreshSessions,
    clearError,
  };
}
