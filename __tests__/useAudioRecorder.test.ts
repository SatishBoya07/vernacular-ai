import { renderHook, act } from '@testing-library/react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';

// --- Mock browser APIs ---

const mockStop = jest.fn();
const mockGetTracks = jest.fn(() => [{ stop: mockStop, kind: 'audio' }]);

const mockMediaStream = {
  getTracks: mockGetTracks,
  getAudioTracks: jest.fn(() => [{ stop: mockStop }]),
} as unknown as MediaStream;

const mockGetUserMedia = jest.fn().mockResolvedValue(mockMediaStream);

// Mock MediaRecorder
const mockMediaRecorderInstance = {
  start: jest.fn(),
  stop: jest.fn(),
  state: 'inactive' as RecordingState,
  ondataavailable: null as ((event: BlobEvent) => void) | null,
  onstop: null as (() => void) | null,
  mimeType: 'audio/webm',
};

const MockMediaRecorder = jest.fn().mockImplementation(() => {
  mockMediaRecorderInstance.state = 'recording';
  return mockMediaRecorderInstance;
});
(MockMediaRecorder as unknown as { isTypeSupported: (type: string) => boolean }).isTypeSupported = jest.fn(() => true);

// Mock AudioContext
const mockAnalyserNode = {
  fftSize: 0,
  frequencyBinCount: 128,
  getByteFrequencyData: jest.fn((arr: Uint8Array) => {
    for (let i = 0; i < arr.length; i++) arr[i] = 64;
  }),
};

const mockAudioContext = {
  createAnalyser: jest.fn(() => mockAnalyserNode),
  createMediaStreamSource: jest.fn(() => ({
    connect: jest.fn(),
  })),
  state: 'running',
  close: jest.fn().mockResolvedValue(undefined),
};

// Mock SpeechRecognition
const mockSpeechRecognitionInstance = {
  continuous: false,
  interimResults: false,
  lang: '',
  onresult: null as ((event: any) => void) | null,
  onerror: null as ((event: any) => void) | null,
  start: jest.fn(),
  stop: jest.fn(),
  abort: jest.fn(),
};

const MockSpeechRecognition = jest.fn().mockImplementation(() => {
  return mockSpeechRecognitionInstance;
});

// Apply mocks
beforeAll(() => {
  Object.defineProperty(global.navigator, 'mediaDevices', {
    value: { getUserMedia: mockGetUserMedia },
    writable: true,
    configurable: true,
  });

  global.MediaRecorder = MockMediaRecorder as unknown as typeof MediaRecorder;
  global.AudioContext = jest.fn(() => mockAudioContext) as unknown as typeof AudioContext;
  (global as any).SpeechRecognition = MockSpeechRecognition;

  // Mock requestAnimationFrame
  jest.spyOn(global, 'requestAnimationFrame').mockImplementation(() => 1);
  jest.spyOn(global, 'cancelAnimationFrame').mockImplementation(() => {});
});

beforeEach(() => {
  jest.clearAllMocks();
  mockMediaRecorderInstance.state = 'inactive';
  mockMediaRecorderInstance.ondataavailable = null;
  mockMediaRecorderInstance.onstop = null;
  mockSpeechRecognitionInstance.lang = '';
  mockSpeechRecognitionInstance.onresult = null;
});

describe('useAudioRecorder', () => {
  it('has correct initial state', () => {
    const { result } = renderHook(() => useAudioRecorder());

    expect(result.current.isRecording).toBe(false);
    expect(result.current.audioBlob).toBeNull();
    expect(result.current.audioUrl).toBeNull();
    expect(result.current.duration).toBe(0);
    expect(result.current.error).toBeNull();
    expect(result.current.volumeLevel).toBe(0);
    expect(result.current.transcript).toBe('');
  });

  it('calls getUserMedia on startRecording', async () => {
    const { result } = renderHook(() => useAudioRecorder());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(mockGetUserMedia).toHaveBeenCalledWith({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
  });

  it('sets isRecording to true after startRecording', async () => {
    const { result } = renderHook(() => useAudioRecorder());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.isRecording).toBe(true);
  });

  it('creates MediaRecorder with supported MIME type', async () => {
    const { result } = renderHook(() => useAudioRecorder());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(MockMediaRecorder).toHaveBeenCalled();
  });

  it('binds SpeechRecognition language to hi-IN for Hindi', async () => {
    const { result } = renderHook(() => useAudioRecorder());

    await act(async () => {
      await result.current.startRecording('hi');
    });

    expect(mockSpeechRecognitionInstance.lang).toBe('hi-IN');
    expect(mockSpeechRecognitionInstance.start).toHaveBeenCalled();
  });

  it('binds SpeechRecognition language to te-IN for Telugu', async () => {
    const { result } = renderHook(() => useAudioRecorder());

    await act(async () => {
      await result.current.startRecording('te');
    });

    expect(mockSpeechRecognitionInstance.lang).toBe('te-IN');
    expect(mockSpeechRecognitionInstance.start).toHaveBeenCalled();
  });

  it('binds SpeechRecognition language to en-US for English', async () => {
    const { result } = renderHook(() => useAudioRecorder());

    await act(async () => {
      await result.current.startRecording('en');
    });

    expect(mockSpeechRecognitionInstance.lang).toBe('en-US');
    expect(mockSpeechRecognitionInstance.start).toHaveBeenCalled();
  });

  it('updates transcript when SpeechRecognition produces results', async () => {
    const { result } = renderHook(() => useAudioRecorder());

    await act(async () => {
      await result.current.startRecording('en');
    });

    // Simulate speech recognition event
    act(() => {
      if (mockSpeechRecognitionInstance.onresult) {
        mockSpeechRecognitionInstance.onresult({
          resultIndex: 0,
          results: [
            [{ transcript: 'What is photosynthesis' }],
          ],
        });
      }
    });

    expect(result.current.transcript).toBe('What is photosynthesis');
  });

  it('handles permission denial gracefully', async () => {
    mockGetUserMedia.mockRejectedValueOnce(new Error('Permission denied'));

    const { result } = renderHook(() => useAudioRecorder());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.isRecording).toBe(false);
    expect(result.current.error).toBe('Permission denied');
  });

  it('handles missing mediaDevices gracefully', async () => {
    const original = navigator.mediaDevices;
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useAudioRecorder());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.isRecording).toBe(false);
    expect(result.current.error).toBeTruthy();

    // Restore
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: original,
      writable: true,
      configurable: true,
    });
  });

  it('calls stop on MediaRecorder when stopRecording is called', async () => {
    const { result } = renderHook(() => useAudioRecorder());

    await act(async () => {
      await result.current.startRecording();
    });

    act(() => {
      result.current.stopRecording();
    });

    expect(mockMediaRecorderInstance.stop).toHaveBeenCalled();
  });

  it('cleans up streams on unmount', async () => {
    const { result, unmount } = renderHook(() => useAudioRecorder());

    await act(async () => {
      await result.current.startRecording();
    });

    unmount();

    expect(mockStop).toHaveBeenCalled();
  });
});
