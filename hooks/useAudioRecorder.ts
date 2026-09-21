'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { AudioRecorderState, SupportedLanguage } from '@/types';

// Web Speech API interface definitions
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      isFinal?: boolean;
    };
  };
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

export function useAudioRecorder() {
  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    audioBlob: null,
    audioUrl: null,
    duration: 0,
    error: null,
    volumeLevel: 0,
    transcript: '',
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const stopResolverRef = useRef<((result: { blob: Blob | null; transcript: string }) => void) | null>(null);

  // Speech recognition ref
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const transcriptRef = useRef<string>('');

  const getSupportedMimeType = () => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/aac',
      'audio/ogg;codecs=opus',
    ];
    for (const type of types) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return '';
  };

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore errors on stopping
      }
      recognitionRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async (targetLanguage?: SupportedLanguage | string) => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Audio recording is not supported in this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      chunksRef.current = [];
      transcriptRef.current = '';

      const mimeType = getSupportedMimeType();
      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const selectedType = mediaRecorder.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: selectedType });
        const url = URL.createObjectURL(blob);
        const finalTranscript = transcriptRef.current;
        setState(prev => ({
          ...prev,
          audioBlob: blob,
          audioUrl: url,
          transcript: finalTranscript,
          isRecording: false,
        }));
        cleanup();
        if (stopResolverRef.current) {
          stopResolverRef.current({ blob, transcript: finalTranscript });
          stopResolverRef.current = null;
        }
      };

      // Initialize Web Speech API for native real voice-to-text
      const SpeechRecognitionClass = typeof window !== 'undefined'
        ? (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance; webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).SpeechRecognition ||
          (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance; webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition
        : null;

      if (SpeechRecognitionClass) {
        try {
          const recognition = new SpeechRecognitionClass();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = targetLanguage === 'hi' ? 'hi-IN' : targetLanguage === 'te' ? 'te-IN' : 'en-US';

          recognition.onresult = (event: SpeechRecognitionEvent) => {
            let fullTranscript = '';
            for (let i = 0; i < event.results.length; i++) {
              const res = event.results[i];
              if (res && res[0]) {
                fullTranscript += res[0].transcript;
              }
            }
            transcriptRef.current = fullTranscript;
            setState(prev => ({ ...prev, transcript: fullTranscript }));
          };

          recognition.onerror = (err) => {
            console.warn('Web Speech recognition warning:', err);
          };

          recognition.start();
          recognitionRef.current = recognition;
        } catch (speechErr) {
          console.warn('Failed to initialize SpeechRecognition:', speechErr);
        }
      }

      // Audio context for volume
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        const audioContext = new AudioContextClass();
        audioContextRef.current = audioContext;
        const analyser = audioContext.createAnalyser();
        analyserRef.current = analyser;
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const updateVolume = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const average = sum / bufferLength;
          const volumeLevel = Math.min(average / 128, 1);
          
          setState(prev => ({ ...prev, volumeLevel }));
          animationFrameRef.current = requestAnimationFrame(updateVolume);
        };
        
        updateVolume();
      }

      mediaRecorder.start(1000);

      setState(prev => {
        if (prev.audioUrl) URL.revokeObjectURL(prev.audioUrl);
        return {
          ...prev,
          isRecording: true,
          duration: 0,
          error: null,
          audioBlob: null,
          audioUrl: null,
          transcript: '',
        };
      });

      timerRef.current = setInterval(() => {
        setState(prev => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to start recording. Permission denied?';
      setState(prev => ({
        ...prev,
        error: message,
      }));
    }
  }, [cleanup]);

  const stopRecording = useCallback((): Promise<{ blob: Blob | null; transcript: string }> => {
    return new Promise((resolve) => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore
        }
      }

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        stopResolverRef.current = resolve;
        mediaRecorderRef.current.stop();
      } else {
        resolve({ blob: state.audioBlob, transcript: transcriptRef.current || state.transcript });
      }
    });
  }, [state.audioBlob, state.transcript]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    ...state,
    startRecording,
    stopRecording,
  };
}
