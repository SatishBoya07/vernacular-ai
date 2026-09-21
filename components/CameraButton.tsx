'use client';

import React, { useState } from 'react';
import { Camera } from 'lucide-react';
import CameraViewfinder from './CameraViewfinder';
import { useLanguage } from '@/contexts/LanguageContext';

interface CameraButtonProps {
  onCapture: (imageBlob: Blob, previewUrl: string) => void;
}

export default function CameraButton({ onCapture }: CameraButtonProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const handleCapture = (blob: Blob, url: string) => {
    onCapture(blob, url);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center w-12 h-12 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-transparent transition-colors min-w-11 min-h-11"
        aria-label={t('captureTextbook')}
      >
        <Camera className="text-zinc-600 dark:text-zinc-400" size={24} />
      </button>

      <CameraViewfinder
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onCapture={handleCapture}
      />
    </>
  );
}
