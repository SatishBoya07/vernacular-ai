'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useCameraCapture } from '@/hooks/useCameraCapture';
import { useLanguage } from '@/contexts/LanguageContext';

interface CameraViewfinderProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (blob: Blob, previewUrl: string) => void;
}

export default function CameraViewfinder({ isOpen, onClose, onCapture }: CameraViewfinderProps) {
  const { t } = useLanguage();
  const { isCapturing, imageBlob, previewUrl, startCamera, stopCamera, captureImage, videoRef } = useCameraCapture();
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowPreview(false);
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleCaptureClick = async () => {
    await captureImage();
    setShowPreview(true);
  };

  const handleConfirm = () => {
    if (imageBlob && previewUrl) {
      onCapture(imageBlob, previewUrl);
      onClose();
    }
  };

  const handleRetake = () => {
    setShowPreview(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed inset-0 z-50 flex flex-col bg-black"
        >
          <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-black">
            {showPreview && previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-contain"
              />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            )}
          </div>

          <div className="h-32 bg-black flex items-center justify-between px-8 pb-[env(safe-area-inset-bottom)]">
            <button
              onClick={onClose}
              className="p-3 bg-zinc-900 rounded-full text-white min-w-11 min-h-11"
              aria-label={t('cancel')}
            >
              <X size={24} />
            </button>

            {showPreview && previewUrl ? (
              <div className="flex gap-4">
                <button
                  onClick={handleRetake}
                  className="px-6 py-3 rounded-full bg-zinc-800 text-white font-medium min-h-11"
                >
                  {t('retake')}
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-6 py-3 rounded-full bg-white text-black font-medium min-h-11"
                >
                  {t('confirm')}
                </button>
              </div>
            ) : (
              <button
                onClick={handleCaptureClick}
                className="w-20 h-20 rounded-full border-4 border-zinc-300 flex items-center justify-center"
                aria-label={t('captureTextbook')}
              >
                <div className="w-16 h-16 rounded-full bg-white" />
              </button>
            )}

            {!(showPreview && previewUrl) && <div className="w-12 h-12" />}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
