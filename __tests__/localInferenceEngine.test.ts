import { runInference, getLanguagePrompt } from '@/services/localInferenceEngine';
import { InferenceRequest, InferenceChunk } from '@/types';

// Helper to create a mock streaming fetch response
function createMockFetchStream(textChunks: string[], ok = true, status = 200) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      for (const text of textChunks) {
        controller.enqueue(encoder.encode(text));
      }
      controller.close();
    },
  });

  return Promise.resolve({
    ok,
    status,
    body: stream,
    text: () => Promise.resolve(textChunks.join('')),
    json: () => Promise.resolve({ text: textChunks.join('') }),
  } as unknown as Response);
}

describe('localInferenceEngine', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  describe('getLanguagePrompt', () => {
    it('returns English for en language', () => {
      expect(getLanguagePrompt('en')).toBe('English');
    });

    it('returns Hindi (हिंदी) for hi language', () => {
      expect(getLanguagePrompt('hi')).toBe('Hindi (हिंदी)');
    });

    it('returns Telugu (తెలుగు) for te language', () => {
      expect(getLanguagePrompt('te')).toBe('Telugu (తెలుగు)');
    });

    it('defaults to English for unknown language', () => {
      expect(getLanguagePrompt('unknown')).toBe('English');
    });
  });

  describe('runInference with empty input', () => {
    it('yields prompt when transcript is empty in English', async () => {
      const chunks: InferenceChunk[] = [];
      for await (const chunk of runInference('', 'en')) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBe(2);
      expect(chunks[0].token).toContain('Please ask a question');
      expect(chunks[0].done).toBe(false);
      expect(chunks[1].done).toBe(true);
    });

    it('yields prompt in Hindi when transcript is empty and language is hi', async () => {
      const chunks: InferenceChunk[] = [];
      for await (const chunk of runInference('', 'hi')) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBe(2);
      expect(chunks[0].token).toMatch(/[\u0900-\u097F]/);
      expect(chunks[1].done).toBe(true);
    });

    it('yields prompt in Telugu when transcript is empty and language is te', async () => {
      const chunks: InferenceChunk[] = [];
      for await (const chunk of runInference('', 'te')) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBe(2);
      expect(chunks[0].token).toMatch(/[\u0C00-\u0C7F]/);
      expect(chunks[1].done).toBe(true);
    });
  });

  describe('runInference streaming via /api/chat', () => {
    it('returns an async generator', () => {
      global.fetch = jest.fn().mockImplementation(() =>
        createMockFetchStream(['Photosynthesis is a process.'])
      );

      const generator = runInference('Explain photosynthesis', 'en');
      expect(generator[Symbol.asyncIterator]).toBeDefined();
    });

    it('calls /api/chat with user message and target language', async () => {
      const mockFetch = jest.fn().mockImplementation(() =>
        createMockFetchStream(['Photosynthesis ', 'is ', 'vital.'])
      );
      global.fetch = mockFetch;

      const request: InferenceRequest = {
        audioTranscript: 'Explain photosynthesis',
        language: 'hi',
      };

      const chunks: InferenceChunk[] = [];
      for await (const chunk of runInference(request)) {
        chunks.push(chunk);
      }

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/chat',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            message: 'Explain photosynthesis',
            language: 'hi',
          }),
        })
      );

      // Verify chunks received: content chunks + final done chunk
      expect(chunks.length).toBeGreaterThanOrEqual(2);
      const combinedText = chunks.map(c => c.token).join('');
      expect(combinedText).toContain('Photosynthesis');
      expect(chunks[chunks.length - 1].done).toBe(true);
      expect(chunks[chunks.length - 1].token).toBe('');
    });

    it('handles server error response gracefully without hanging', async () => {
      global.fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          text: () => Promise.resolve('Internal server error in Gemini API'),
          json: () => Promise.resolve({ error: 'Internal server error in Gemini API' }),
        } as unknown as Response)
      );

      const chunks: InferenceChunk[] = [];
      for await (const chunk of runInference('Test question', 'en')) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBe(2);
      expect(chunks[0].token).toContain('Internal server error in Gemini API');
      expect(chunks[0].done).toBe(false);
      expect(chunks[1].done).toBe(true);
    });

    it('handles network / fetch failure gracefully without hanging', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Failed to fetch'));

      const chunks: InferenceChunk[] = [];
      for await (const chunk of runInference('Test question', 'en')) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBe(2);
      expect(chunks[0].token).toContain('Failed to fetch');
      expect(chunks[0].done).toBe(false);
      expect(chunks[1].done).toBe(true);
    });
  });
});
