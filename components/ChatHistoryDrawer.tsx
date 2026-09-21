'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, MessageSquare } from 'lucide-react';
import { ConversationSession } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface ChatHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ConversationSession[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
}

export default function ChatHistoryDrawer({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
}: ChatHistoryDrawerProps) {
  const { t } = useLanguage();

  const formatRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Slide-out Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed top-0 left-0 bottom-0 z-50 w-4/5 max-w-xs bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col pt-[env(safe-area-inset-top)] shadow-2xl transition-colors duration-200"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                {t('recentChats')}
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 rounded-full transition-colors min-w-11 min-h-11 flex items-center justify-center"
                aria-label={t('cancel')}
              >
                <X size={20} />
              </button>
            </div>

            {/* + New Chat Action Button */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => {
                  onNewChat();
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors shadow-sm min-h-11"
              >
                <Plus size={18} />
                <span>{t('newChat')}</span>
              </button>
            </div>

            {/* Conversation Sessions List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {sessions.length === 0 ? (
                <div className="text-center py-12 px-4 text-zinc-400 dark:text-zinc-500 text-sm">
                  {t('noChats')}
                </div>
              ) : (
                sessions.map((session) => {
                  const isActive = session.id === currentSessionId;
                  return (
                    <div
                      key={session.id}
                      className={`group flex items-center justify-between p-3 rounded-xl transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-indigo-50 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 font-medium shadow-sm'
                          : 'bg-zinc-100/80 hover:bg-zinc-200/80 dark:bg-zinc-800/40 dark:hover:bg-zinc-800/80 text-zinc-800 dark:text-zinc-300'
                      }`}
                      onClick={() => {
                        onSelectSession(session.id);
                        onClose();
                      }}
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="text-sm truncate">{session.title}</div>
                        <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 font-mono">
                          {formatRelativeTime(session.timestamp)}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSession(session.id);
                        }}
                        className="p-2 text-zinc-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 rounded-lg transition-colors opacity-80 hover:opacity-100 min-w-9 min-h-9 flex items-center justify-center"
                        aria-label="Delete chat"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-400 dark:text-zinc-500 text-center font-mono pb-[env(safe-area-inset-bottom)]">
              Vernacular AI &bull; Offline PWA
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
