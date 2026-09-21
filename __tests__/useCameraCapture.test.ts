import { renderHook, act } from '@testing-library/react';
import { useCameraCapture } from '@/hooks/useCameraCapture';

// --- Mock browser APIs ---

const mockStop = jest.fn();
const mockGetTracks = jest.fn(() => [{ stop: mockStop, kind: 'video' }]);
const mockPlay = jest.fn().mockResolvedValue(undefined);

const mockMediaStream = {
  getTracks: mockGetTracks,
  getVideoTracks: jest.fn(() => [{ stop: mockStop }]),
} as unknown as MediaStream;

const mockGetUserMedia = jest.fn().mockResolvedValue(mockMediaStream);

// Mock canvas context
const mockDrawImage = jest.fn();
const mockToBlob = jest.fn((callback: BlobCallback) => {
  const blob = new Blob(['fake-image-data'], { type: 'image/jpeg' });
  callback(blob);
});

const mockCanvasElement = {
  width: 0,
  height: 0,
  getContext: jest.fn(() => ({
    drawImage: mockDrawImage,
  })),
  toBlob: mockToBlob,
};

// Apply mocks
beforeAll(() => {
  Object.defineProperty(global.navigator, 'mediaDevices', {
    value: { getUserMedia: mockGetUserMedia },
    writable: true,
    configurable: true,
  });

  const originalCreateElement = document.createElement.bind(document);
  jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
    if (tagName === 'canvas') {
      return mockCanvasElement as unknown as HTMLCanvasElement;
    }
    return originalCreateElement(tagName);
  });
});

beforeEach(() => {
  jest.clearAllMocks();
  mockGetUserMedia.mockResolvedValue(mockMediaStream);
});

describe('useCameraCapture', () => {
  it('has correct initial state', () => {
    const { result } = renderHook(() => useCameraCapture());

    expect(result.current.isCapturing).toBe(false);
    expect(result.current.imageBlob).toBeNull();
    expect(result.current.previewUrl).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('provides a videoRef', () => {
    const { result } = renderHook(() => useCameraCapture());

    expect(result.current.videoRef).toBeDefined();
    expect(result.current.videoRef.current).toBeNull(); // not attached yet
  });

  it('calls getUserMedia with environment facingMode on startCamera', async () => {
    const { result } = renderHook(() => useCameraCapture());

    await act(async () => {
      await result.current.startCamera();
    });

    expect(mockGetUserMedia).toHaveBeenCalledWith({
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
    });
  });

  it('sets isCapturing to true after startCamera', async () => {
    const { result } = renderHook(() => useCameraCapture());

    await act(async () => {
      await result.current.startCamera();
    });

    expect(result.current.isCapturing).toBe(true);
  });

  it('handles permission denial gracefully', async () => {
    mockGetUserMedia.mockRejectedValueOnce(new Error('Permission denied'));

    const { result } = renderHook(() => useCameraCapture());

    await act(async () => {
      await result.current.startCamera();
    });

    expect(result.current.isCapturing).toBe(false);
    expect(result.current.error).toBe('Permission denied');
  });

  it('handles missing mediaDevices gracefully', async () => {
    const original = navigator.mediaDevices;
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useCameraCapture());

    await act(async () => {
      await result.current.startCamera();
    });

    expect(result.current.isCapturing).toBe(false);
    expect(result.current.error).toBeTruthy();

    // Restore
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: original,
      writable: true,
      configurable: true,
    });
  });

  it('stops camera and resets state on stopCamera', async () => {
    const { result } = renderHook(() => useCameraCapture());

    await act(async () => {
      await result.current.startCamera();
    });

    expect(result.current.isCapturing).toBe(true);

    act(() => {
      result.current.stopCamera();
    });

    expect(result.current.isCapturing).toBe(false);
    expect(mockStop).toHaveBeenCalled();
  });

  it('cleans up streams on unmount', async () => {
    const { result, unmount } = renderHook(() => useCameraCapture());

    await act(async () => {
      await result.current.startCamera();
    });

    unmount();

    expect(mockStop).toHaveBeenCalled();
  });
});
