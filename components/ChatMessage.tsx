'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Zap, ChevronDown, ChevronUp, X, Sparkles } from 'lucide-react';
import { ChatMessage as ChatMessageType, Flashcard } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { StreamingText } from './StreamingText';
import { TypingIndicator } from './TypingIndicator';

interface ChatMessageProps {
  message: ChatMessageType;
  onUpdateFlashcard?: (messageId: string, flashcard?: Flashcard) => void;
}

function extractFlashcard(content: string, lang: string): Flashcard {
  const clean = content.replace(/[#*`_]/g, '').trim();
  const sentences = clean.split(/[.!?\n]+/).map(s => s.trim()).filter(Boolean);

  const firstSentence = sentences[0] || '';
  const isQuestion = firstSentence.endsWith('?');

  const qLabel = lang === 'hi' ? 'मुख्य प्रश्न: ' : lang === 'te' ? 'ప్రధాన ప్రశ్న: ' : 'Key Concept: ';
  const question = isQuestion ? firstSentence : `${qLabel}${firstSentence}`;

  const answerBody = sentences.length > 1 
    ? sentences.slice(1, 3).join('. ')
    : clean;

  return {
    question,
    answer: answerBody.endsWith('.') ? answerBody : `${answerBody}.`,
  };
}

export default function ChatMessage({ message, onUpdateFlashcard }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const { t, language } = useLanguage();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFlashcardOpen, setIsFlashcardOpen] = useState(false);

  // Clean up speech synthesis when component unmounts
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleToggleSpeech = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();

    // Clean markdown symbols for cleaner speech output
    const cleanText = message.content
      .replace(/[#*`_>]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Map selected language to TTS voice locale
    let langCode = 'en-US';
    if (language === 'hi') langCode = 'hi-IN';
    else if (language === 'te') langCode = 'te-IN';
    utterance.lang = langCode;

    // Pick matching voice if installed in browser
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find(
      (v) => v.lang === langCode || v.lang.startsWith(langCode.slice(0, 2))
    );
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [isSpeaking, message.content, language]);

  const handleToggleFlashcard = () => {
    if (!message.flashcard && onUpdateFlashcard) {
      const generated = extractFlashcard(message.content, language);
      onUpdateFlashcard(message.id, generated);
      setIsFlashcardOpen(true);
      setIsFlipped(false);
    } else {
      setIsFlashcardOpen((prev) => !prev);
    }
  };

  const handleDismissFlashcard = () => {
    setIsFlashcardOpen(false);
    if (onUpdateFlashcard) {
      onUpdateFlashcard(message.id, undefined);
    }
  };

  const timeString = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col w-full my-2 ${isUser ? 'items-end' : 'items-start'}`}
    >
      <div
        className={`relative px-4 py-3 rounded-2xl max-w-[88%] sm:max-w-[80%] shadow-sm transition-colors duration-200 ${
          isUser
            ? 'bg-indigo-600 text-white rounded-tr-sm'
            : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-tl-sm border border-zinc-200 dark:border-zinc-700/60'
        }`}
      >
        {message.imageUrl && (
          <img
            src={message.imageUrl}
            alt="Uploaded content"
            className="max-w-[240px] rounded-lg mb-2 object-cover"
          />
        )}

        {message.isStreaming && !message.content ? (
          <TypingIndicator />
        ) : message.isStreaming ? (
          <StreamingText text={message.content} isStreaming={true} />
        ) : (
          <span className="whitespace-pre-wrap leading-relaxed">{message.content}</span>
        )}

        {/* Action toolbar for assistant messages (once done streaming and has content) */}
        {!isUser && !message.isStreaming && message.content && (
          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-zinc-200 dark:border-zinc-700/60 text-xs">
            {/* Read-Aloud TTS Button */}
            <button
              onClick={handleToggleSpeech}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-medium transition-all ${
                isSpeaking
                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/40 animate-pulse'
                  : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-700/50 dark:hover:bg-zinc-700 text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100'
              }`}
              title={isSpeaking ? t('stopAudio') : t('readAloud')}
              aria-label={isSpeaking ? t('stopAudio') : t('readAloud')}
            >
              {isSpeaking ? (
                <>
                  <VolumeX size={14} />
                  <span>{t('stopAudio')}</span>
                </>
              ) : (
                <>
                  <Volume2 size={14} />
                  <span>{t('readAloud')}</span>
                </>
              )}
            </button>

            {/* Flashcard Generation Button */}
            <button
              onClick={handleToggleFlashcard}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-medium transition-all ${
                message.flashcard || isFlashcardOpen
                  ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/40'
                  : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-700/50 dark:hover:bg-zinc-700 text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100'
              }`}
              title={t('flashcard')}
              aria-label={t('flashcard')}
            >
              <Zap size={14} className="text-yellow-500 fill-yellow-500" />
              <span>{t('flashcard')}</span>
            </button>
          </div>
        )}
      </div>

      {/* Interactive Flashcard Card */}
      <AnimatePresence>
        {!isUser && (message.flashcard || isFlashcardOpen) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            className="w-full max-w-[88%] sm:max-w-[80%] mt-2 p-3.5 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/70 dark:to-purple-950/70 border border-indigo-200 dark:border-indigo-500/30 text-zinc-800 dark:text-zinc-200 shadow-md backdrop-blur-sm transition-colors duration-200"
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-indigo-200 dark:border-indigo-500/20">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-300 uppercase tracking-wider">
                <Sparkles size={14} className="text-indigo-500 dark:text-indigo-400" />
                <span>{t('flashcard')}</span>
              </div>
              <button
                onClick={handleDismissFlashcard}
                className="p-1 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 rounded-md transition-colors"
                aria-label="Dismiss flashcard"
              >
                <X size={14} />
              </button>
            </div>

            {/* Flashcard Front / Back */}
            <div className="text-xs space-y-2">
              <div>
                <span className="font-semibold text-indigo-600 dark:text-indigo-300 block mb-0.5">Q:</span>
                <p className="text-zinc-900 dark:text-zinc-100 font-medium">
                  {message.flashcard?.question || extractFlashcard(message.content, language).question}
                </p>
              </div>

              {isFlipped ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="pt-2 border-t border-indigo-200 dark:border-indigo-500/20"
                >
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 block mb-0.5">A:</span>
                  <p className="text-zinc-700 dark:text-zinc-200 leading-relaxed">
                    {message.flashcard?.answer || extractFlashcard(message.content, language).answer}
                  </p>
                </motion.div>
              ) : null}

              <button
                onClick={() => setIsFlipped((prev) => !prev)}
                className="mt-2 w-full py-1.5 px-3 rounded-lg bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-600/30 dark:hover:bg-indigo-600/50 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-200 text-xs font-medium flex items-center justify-center gap-1 transition-colors"
              >
                {isFlipped ? (
                  <>
                    <ChevronUp size={14} />
                    <span>Hide Answer</span>
                  </>
                ) : (
                  <>
                    <ChevronDown size={14} />
                    <span>Reveal Answer</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 mx-1">{timeString}</span>
    </motion.div>
  );
}
