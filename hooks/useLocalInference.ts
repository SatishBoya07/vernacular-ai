'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { runInference } from '@/services/localInferenceEngine';
import { InferenceRequest, SupportedLanguage, TutorMode } from '@/types';

interface UseLocalInferenceOptions {
  imageUrl?: string;
  imageBlob?: Blob | null;
  audioBlob?: Blob | null;
  language?: SupportedLanguage;
  tutorMode?: TutorMode;
}

interface UseLocalInferenceReturn {
  isInferring: boolean;
  streamedText: string;
  error: string | null;
  startInference: (
    transcript: string,
    options?: UseLocalInferenceOptions,
    onChunk?: (fullText: string, chunkText: string) => void
  ) => Promise<string>;
  reset: () => void;
}

export function useLocalInference(): UseLocalInferenceReturn {
  const [isInferring, setIsInferring] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    setStreamedText('');
    setError(null);
  }, []);

  const startInference = useCallback(async (
    transcript: string,
    options?: UseLocalInferenceOptions,
    onChunk?: (fullText: string, chunkText: string) => void
  ): Promise<string> => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setIsInferring(true);
    setStreamedText('');
    setError(null);

    let fullText = '';

    try {
      const request: InferenceRequest = {
        audioTranscript: transcript,
        language: options?.language ?? 'en',
        imageBlob: options?.imageBlob ?? (options?.imageUrl ? new Blob() : null),
        tutorMode: options?.tutorMode,
      };

      const generator = runInference(request);

      for await (const chunk of generator) {
        if (signal.aborted) break;

        if (chunk.token) {
          fullText += chunk.token;
          setStreamedText(fullText);
          if (onChunk) {
            onChunk(fullText, chunk.token);
          }
        }

        if (chunk.done) break;
      }

      return fullText;
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        const errorMsg = err.message || 'Inference failed';
        setError(errorMsg);
        fullText = `⚠️ Error: ${errorMsg}`;
        setStreamedText(fullText);
        if (onChunk) onChunk(fullText, fullText);
      }
      return fullText;
    } finally {
      if (!signal.aborted) {
        setIsInferring(false);
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    isInferring,
    streamedText,
    error,
    startInference,
    reset,
  };
}
