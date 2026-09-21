'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Moon, Sun, BookOpen, Trash2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SupportedLanguage, TutorMode } from '@/types';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onClearAllConversations?: () => void;
}

export default function SettingsPanel({
  isOpen,
  onClose,
  onClearAllConversations,
}: SettingsPanelProps) {
  const { t, language, setLanguage, theme, toggleTheme, tutorMode, setTutorMode } = useLanguage();

  const languages: { code: SupportedLanguage; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी (Hindi)' },
    { code: 'te', label: 'తెలుగు (Telugu)' },
  ];

  const handleClear = () => {
    if (confirm(t('clearConfirm'))) {
      if (onClearAllConversations) {
        onClearAllConversations();
      }
      onClose();
    }
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

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-4/5 max-w-sm bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 flex flex-col pt-[env(safe-area-inset-top)] shadow-2xl transition-colors duration-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{t('settings')}</h2>
              <button
                onClick={onClose}
                className="p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 rounded-full transition-colors min-w-11 min-h-11 flex items-center justify-center"
                aria-label={t('cancel')}
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-4 flex-1 overflow-y-auto space-y-6">
              {/* Language Selection */}
              <section>
                <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
                  {t('language')}
                </h3>
                <div className="space-y-2">
                  {languages.map(({ code, label }) => (
                    <button
                      key={code}
                      onClick={() => setLanguage(code)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors min-h-11 ${
                        language === code
                          ? 'bg-indigo-600 text-white font-medium shadow-sm'
                          : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-transparent'
                      }`}
                    >
                      <span>{label}</span>
                      {language === code && <span className="text-xs font-bold">✓</span>}
                    </button>
                  ))}
                </div>
              </section>

              {/* Theme Toggle */}
              <section>
                <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
                  {t('theme')}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => theme !== 'dark' && toggleTheme()}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl transition-colors min-h-11 ${
                      theme === 'dark'
                        ? 'bg-indigo-600 text-white font-medium shadow-sm'
                        : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-transparent'
                    }`}
                  >
                    <Moon size={16} />
                    <span className="text-sm">{t('darkMode')}</span>
                  </button>
                  <button
                    onClick={() => theme !== 'light' && toggleTheme()}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl transition-colors min-h-11 ${
                      theme === 'light'
                        ? 'bg-indigo-600 text-white font-medium shadow-sm'
                        : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-transparent'
                    }`}
                  >
                    <Sun size={16} />
                    <span className="text-sm">{t('lightMode')}</span>
                  </button>
                </div>
              </section>

              {/* Tutor Persona / Mode */}
              <section>
                <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <BookOpen size={14} className="text-indigo-600 dark:text-indigo-400" />
                  {t('tutorMode')}
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setTutorMode('summary')}
                    className={`w-full text-left p-3 rounded-xl transition-colors min-h-11 ${
                      tutorMode === 'summary'
                        ? 'bg-indigo-600 text-white font-medium shadow-sm'
                        : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-transparent'
                    }`}
                  >
                    <div className="text-sm font-semibold">{t('quickSummary')}</div>
                    <div className="text-xs opacity-75 mt-0.5">Concise, direct academic answers</div>
                  </button>
                  <button
                    onClick={() => setTutorMode('socratic')}
                    className={`w-full text-left p-3 rounded-xl transition-colors min-h-11 ${
                      tutorMode === 'socratic'
                        ? 'bg-indigo-600 text-white font-medium shadow-sm'
                        : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-transparent'
                    }`}
                  >
                    <div className="text-sm font-semibold">{t('socraticExplainer')}</div>
                    <div className="text-xs opacity-75 mt-0.5">Deep conceptual explanations with guidance</div>
                  </button>
                </div>
              </section>

              {/* Data Reset */}
              <section className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  onClick={handleClear}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-colors text-sm font-medium border border-red-200 dark:border-red-500/20 min-h-11"
                >
                  <Trash2 size={16} />
                  <span>{t('clearConversations')}</span>
                </button>
              </section>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-400 dark:text-zinc-500 text-center font-mono pb-[env(safe-area-inset-bottom)]">
              Vernacular AI v1.2
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
