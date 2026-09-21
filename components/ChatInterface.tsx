'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { SendHorizontal } from 'lucide-react';
import { ChatMessage as ChatMessageType, ConversationSession, Flashcard } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocalInference } from '@/hooks/useLocalInference';
import Header from './Header';
import ChatMessage from './ChatMessage';
import CameraButton from './CameraButton';
import VoiceButton from './VoiceButton';
import SettingsPanel from './SettingsPanel';
import ChatHistoryDrawer from './ChatHistoryDrawer';

const SESSIONS_STORAGE_KEY = 'vernacular_sessions';

export default function ChatInterface() {
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [inputText, setInputText] = useState('');

  const bottomRef = useRef<HTMLDivElement>(null);
  const { t, language, tutorMode } = useLanguage();
  const { isInferring, startInference, streamedText } = useLocalInference();

  // Load sessions from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SESSIONS_STORAGE_KEY);
      if (saved) {
        const parsed: ConversationSession[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed);
          setCurrentSessionId(parsed[0].id);
          return;
        }
      }
    } catch (e) {
      console.error('Failed to load past sessions from localStorage', e);
    }

    // Default initial session
    const initialId = Date.now().toString();
    const initialSession: ConversationSession = {
      id: initialId,
      title: 'New Conversation',
      messages: [],
      timestamp: Date.now(),
    };
    setSessions([initialSession]);
    setCurrentSessionId(initialId);
  }, []);

  // Save sessions to localStorage when updated
  const saveSessions = useCallback((updated: ConversationSession[]) => {
    try {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save sessions to localStorage', e);
    }
  }, []);

  const currentSession = sessions.find((s) => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  // Helper to update messages for a specific session
  const updateSessionMessages = useCallback((
    targetSessionId: string,
    updater: (prev: ChatMessageType[]) => ChatMessageType[]
  ) => {
    setSessions((prevSessions) => {
      const nextSessions = prevSessions.map((session) => {
        if (session.id === targetSessionId) {
          const newMessages = updater(session.messages);
          let title = session.title;
          if (title === 'New Conversation' || !title) {
            const firstUserMsg = newMessages.find((m) => m.role === 'user');
            if (firstUserMsg) {
              title = firstUserMsg.content.slice(0, 32) || 'Academic Query';
            }
          }
          return {
            ...session,
            title,
            messages: newMessages,
            timestamp: Date.now(),
          };
        }
        return session;
      });
      saveSessions(nextSessions);
      return nextSessions;
    });
  }, [saveSessions]);

  // Auto-scroll on new messages or streaming text
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamedText]);

  const sendMessage = useCallback(async (
    text: string,
    imageUrl?: string,
    imageBlob?: Blob | null,
    audioBlob?: Blob | null
  ) => {
    if (!text.trim() && !imageUrl) return;

    const targetSessionId = currentSessionId;
    if (!targetSessionId) return;

    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      imageUrl,
      timestamp: Date.now(),
    };

    const assistantId = (Date.now() + 1).toString();
    const assistantMessage: ChatMessageType = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: Date.now() + 1,
      isStreaming: true,
    };

    updateSessionMessages(targetSessionId, (prev) => [...prev, userMessage, assistantMessage]);
    setInputText('');

    try {
      const fullResponse = await startInference(
        text,
        { imageUrl, imageBlob, audioBlob, language, tutorMode },
        (accumulatedText) => {
          updateSessionMessages(targetSessionId, (prev) =>
            prev.map((msg) =>
              msg.id === assistantId ? { ...msg, content: accumulatedText } : msg
            )
          );
        }
      );

      // Finalize message: guarantee isStreaming is set to false to remove blinking cursor
      updateSessionMessages(targetSessionId, (prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? {
                ...msg,
                content: fullResponse || msg.content || 'No response received from AI.',
                isStreaming: false,
              }
            : msg
        )
      );
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Error generating response';
      updateSessionMessages(targetSessionId, (prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? { ...msg, content: `⚠️ Error: ${errMsg}`, isStreaming: false }
            : msg
        )
      );
    }
  }, [currentSessionId, startInference, language, tutorMode, updateSessionMessages]);

  const handleSendText = () => {
    if (inputText.trim()) {
      sendMessage(inputText);
    }
  };

  const handleVoiceRecord = (transcript: string, audioBlob?: Blob | null) => {
    if (transcript && transcript.trim()) {
      sendMessage(transcript.trim(), undefined, undefined, audioBlob);
    }
  };

  const handleImageCapture = (blob: Blob, previewUrl: string) => {
    sendMessage('Analyze this textbook page', previewUrl, blob);
  };

  const handleNewChat = () => {
    if (currentSession && currentSession.messages.length === 0) {
      setIsDrawerOpen(false);
      return;
    }
    const newId = Date.now().toString();
    const newSession: ConversationSession = {
      id: newId,
      title: 'New Conversation',
      messages: [],
      timestamp: Date.now(),
    };
    const nextSessions = [newSession, ...sessions];
    setSessions(nextSessions);
    setCurrentSessionId(newId);
    saveSessions(nextSessions);
    setIsDrawerOpen(false);
  };

  const handleSelectSession = (id: string) => {
    setCurrentSessionId(id);
    setIsDrawerOpen(false);
  };

  const handleDeleteSession = (id: string) => {
    const remaining = sessions.filter((s) => s.id !== id);
    if (remaining.length === 0) {
      const freshId = Date.now().toString();
      const freshSession: ConversationSession = {
        id: freshId,
        title: 'New Conversation',
        messages: [],
        timestamp: Date.now(),
      };
      setSessions([freshSession]);
      setCurrentSessionId(freshId);
      saveSessions([freshSession]);
    } else {
      setSessions(remaining);
      if (currentSessionId === id) {
        setCurrentSessionId(remaining[0].id);
      }
      saveSessions(remaining);
    }
  };

  const handleClearAllConversations = () => {
    const freshId = Date.now().toString();
    const freshSession: ConversationSession = {
      id: freshId,
      title: 'New Conversation',
      messages: [],
      timestamp: Date.now(),
    };
    setSessions([freshSession]);
    setCurrentSessionId(freshId);
    try {
      localStorage.removeItem(SESSIONS_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear sessions', e);
    }
  };

  const handleUpdateFlashcard = (messageId: string, flashcard?: Flashcard) => {
    if (!currentSessionId) return;
    updateSessionMessages(currentSessionId, (prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, flashcard } : msg))
    );
  };

  return (
    <div className="flex flex-col h-full min-h-dvh bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 transition-colors duration-200 relative">
      <Header
        onSettingsOpen={() => setIsSettingsOpen(true)}
        onMenuOpen={() => setIsDrawerOpen(true)}
      />

      {/* Messages area */}
      <main className="flex-1 overflow-y-auto pt-16 pb-24">
        <div className="max-w-3xl mx-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center pt-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20">
                <span className="text-2xl">🎓</span>
              </div>
              <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
                {t('appTitle')}
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm max-w-xs">
                {t('askQuestion')}
              </p>
            </div>
          )}
          <AnimatePresence mode="popLayout">
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                onUpdateFlashcard={handleUpdateFlashcard}
              />
            ))}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>
      </main>

      {/* Bottom input bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-zinc-900/80 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800 transition-colors duration-200 pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-3xl mx-auto p-3 flex items-center gap-2">
          <CameraButton onCapture={handleImageCapture} />

          <input
            type="text"
            className="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-zinc-400 dark:placeholder:text-zinc-500 border border-zinc-200 dark:border-zinc-700/60 transition-colors"
            placeholder={t('askQuestion')}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendText();
              }
            }}
          />

          <VoiceButton onRecordingComplete={handleVoiceRecord} />

          <button
            onClick={handleSendText}
            disabled={!inputText.trim() || isInferring}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-accent text-white hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-w-11 min-h-11"
            aria-label={t('send')}
          >
            <SendHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Recent Chats Drawer */}
      <ChatHistoryDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
      />

      {/* Settings Modal */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onClearAllConversations={handleClearAllConversations}
      />
    </div>
  );
}

