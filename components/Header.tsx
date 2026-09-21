'use client';

import React from 'react';
import Link from 'next/link';
import { Settings, Menu, Moon, Sun, Activity } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface HeaderProps {
  onSettingsOpen: () => void;
  onMenuOpen: () => void;
}

export default function Header({ onSettingsOpen, onMenuOpen }: HeaderProps) {
  const { t, language, theme, toggleTheme } = useLanguage();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 transition-colors duration-200 pt-[env(safe-area-inset-top)]">
      <div className="flex items-center justify-between px-4 h-14 max-w-3xl mx-auto">
        {/* Left: Hamburger menu for Recent Chats drawer */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuOpen}
            className="p-2 -ml-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors rounded-full min-w-11 min-h-11 flex items-center justify-center"
            aria-label={t('recentChats')}
          >
            <Menu size={22} />
          </button>
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
            {t('appTitle')}
          </h1>
        </div>
        
        {/* Right controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Bridge Dashboard Link */}
          <Link
            href="/bridge"
            className="p-2 text-zinc-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors rounded-full min-w-10 min-h-10 flex items-center justify-center"
            title={t('missionControl') || 'Mission Control Bridge'}
            aria-label="Mission Control Bridge"
          >
            <Activity size={19} />
          </Link>

          {/* Theme Toggle in Header */}
          <button
            onClick={toggleTheme}
            className="p-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors rounded-full min-w-10 min-h-10 flex items-center justify-center"
            aria-label={theme === 'dark' ? t('lightMode') : t('darkMode')}
          >
            {theme === 'dark' ? (
              <Sun size={18} className="text-amber-400" />
            ) : (
              <Moon size={18} className="text-indigo-600" />
            )}
          </button>

          {/* Language Badge */}
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-zinc-100 text-zinc-700 border border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 uppercase tracking-wide">
            {language}
          </span>

          {/* Settings Gear */}
          <button 
            onClick={onSettingsOpen}
            className="p-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors rounded-full min-w-11 min-h-11 flex items-center justify-center"
            aria-label={t('settings')}
          >
            <Settings size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
