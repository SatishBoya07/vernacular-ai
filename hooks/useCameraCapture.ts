'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { CameraCaptureState } from '@/types';

export function useCameraCapture() {
  const [state, setState] = useState<CameraCaptureState>({
    isCapturing: false,
    imageBlob: null,
    previewUrl: null,
    error: null,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const cleanup = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera is not supported in this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      setState(prev => {
        if (prev.previewUrl) URL.revokeObjectURL(prev.previewUrl);
        return {
          ...prev,
          isCapturing: true,
          error: null,
          imageBlob: null,
          previewUrl: null,
        };
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to access camera. Permission denied?';
      setState(prev => ({
        ...prev,
        error: message,
      }));
    }
  }, []);

  const stopCamera = useCallback(() => {
    cleanup();
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setState(prev => ({ ...prev, isCapturing: false }));
  }, [cleanup]);

  const captureImage = useCallback(async () => {
    if (!videoRef.current || !streamRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    return new Promise<void>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setState(prev => {
            if (prev.previewUrl) URL.revokeObjectURL(prev.previewUrl);
            return {
              ...prev,
              imageBlob: blob,
              previewUrl: url,
            };
          });
        }
        resolve();
      }, 'image/jpeg', 0.92);
    });
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    ...state,
    startCamera,
    stopCamera,
    captureImage,
    videoRef,
  };
}
