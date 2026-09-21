'use client';

import React from 'react';
import { Mic } from 'lucide-react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useLanguage } from '@/contexts/LanguageContext';

interface VoiceButtonProps {
  onRecordingComplete: (transcript: string, audioBlob?: Blob | null) => void;
}

export default function VoiceButton({ onRecordingComplete }: VoiceButtonProps) {
  const { t, language } = useLanguage();
  const { isRecording, duration, volumeLevel, transcript, startRecording, stopRecording } = useAudioRecorder();

  const handleToggle = async () => {
    // Check for native browser SpeechRecognition API support
    const hasSpeechRecognition = typeof window !== 'undefined' && Boolean(
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition ||
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
    );

    if (!isRecording) {
      if (!hasSpeechRecognition) {
        alert(
          language === 'hi'
            ? 'इस ब्राउज़र में स्पीच रिकग्निशन समर्थित नहीं है। कृपया Google Chrome या Microsoft Edge का उपयोग करें, या अपना प्रश्न टाइप करें।'
            : language === 'te'
            ? 'ఈ బ్రౌజర్‌లో స్పీచ్ రికగ్నిషన్ సపోర్ట్ చేయబడదు. దయచేసి Google Chrome లేదా Microsoft Edge ఉపయోగించండి, లేదా మీ ప్రశ్నను టైప్ చేయండి.'
            : 'Speech Recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge, or type your question.'
        );
        return;
      }

      await startRecording(language);
    } else {
      const result = await stopRecording();
      const realTranscript = (result?.transcript || transcript).trim();

      if (realTranscript) {
        onRecordingComplete(realTranscript, result?.blob);
      } else {
        alert(
          language === 'hi'
            ? 'कोई आवाज़ नहीं पहचानी गई। कृपया माइक के पास स्पष्ट रूप से बोलें।'
            : language === 'te'
            ? 'వాయిస్ గుర్తించబడలేదు. దయచేసి మైక్రోఫోన్‌కు స్పష్టంగా మాట్లాడండి.'
            : 'No speech was detected. Please speak clearly into your microphone and try again.'
        );
      }
    }
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center relative">
      {isRecording && (
        <span className="absolute -top-6 text-red-400 text-xs font-medium font-mono whitespace-nowrap">
          {formatDuration(duration)}
        </span>
      )}
      <div className="relative">
        {isRecording && (
          <div
            className="absolute inset-0 bg-red-500/30 rounded-full blur-md transition-transform duration-75"
            style={{ transform: `scale(${1 + volumeLevel * 1.5})` }}
          />
        )}
        <button
          onClick={handleToggle}
          className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-colors min-w-11 min-h-11 ${
            isRecording
              ? 'bg-red-600 animate-pulse-glow shadow-[0_0_15px_rgba(220,38,38,0.5)]'
              : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-transparent'
          }`}
          aria-label={isRecording ? t('recording') : t('tapToRecord')}
        >
          <Mic className={isRecording ? 'text-white' : 'text-zinc-600 dark:text-zinc-400'} size={22} />
        </button>
      </div>
    </div>
  );
}
