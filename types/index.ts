// ============================================================
// Vernacular AI — Shared TypeScript Interfaces
// ============================================================

export type TutorMode = 'summary' | 'socratic';

export interface Flashcard {
  question: string;
  answer: string;
}

/** A single message in the chat conversation */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  timestamp: number;
  isStreaming?: boolean;
  flashcard?: Flashcard;
}

/** A full conversation session for the Recent Chats drawer */
export interface ConversationSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  timestamp: number;
}

/** State returned by the useAudioRecorder hook */
export interface AudioRecorderState {
  isRecording: boolean;
  audioBlob: Blob | null;
  audioUrl: string | null;
  duration: number;
  error: string | null;
  volumeLevel: number; // 0–1, driven by AnalyserNode for visual feedback
  transcript: string; // Real-time speech-to-text transcript
}

/** State returned by the useCameraCapture hook */
export interface CameraCaptureState {
  isCapturing: boolean;
  imageBlob: Blob | null;
  previewUrl: string | null;
  error: string | null;
}

/** Input to the local inference engine */
export interface InferenceRequest {
  imageBlob?: Blob | null;
  audioTranscript: string;
  language: SupportedLanguage;
  tutorMode?: TutorMode;
}

/** A single chunk emitted by the streaming inference engine */
export interface InferenceChunk {
  token: string;
  done: boolean;
  metadata?: InferenceMetadata;
}

/** Telemetry metadata attached to inference chunks */
export interface InferenceMetadata {
  tokensPerSecond: number;
  latencyMs: number;
}

/** A single entry in the Bridge debug log */
export interface BridgeLogEntry {
  timestamp: number;
  type: 'npu' | 'mic' | 'camera' | 'token' | 'system';
  message: string;
  value?: number | boolean | string;
}

/** Supported UI languages */
export type SupportedLanguage = 'en' | 'hi' | 'te';

/** Translation string map for one language */
export interface TranslationStrings {
  appTitle: string;
  askQuestion: string;
  tapToRecord: string;
  captureTextbook: string;
  recording: string;
  processing: string;
  settings: string;
  language: string;
  english: string;
  hindi: string;
  telugu: string;
  send: string;
  retake: string;
  confirm: string;
  cancel: string;
  offline: string;
  offlineMessage: string;
  retry: string;
  missionControl: string;
  npuMemory: string;
  micStatus: string;
  tokenSpeed: string;
  systemLogs: string;
  connected: string;
  disconnected: string;
  // New features
  newChat: string;
  recentChats: string;
  noChats: string;
  theme: string;
  darkMode: string;
  lightMode: string;
  tutorMode: string;
  quickSummary: string;
  socraticExplainer: string;
  clearConversations: string;
  clearConfirm: string;
  flashcard: string;
  readAloud: string;
  stopAudio: string;
}
