/**
 * @jest-environment node
 */
import { POST } from '@/app/api/chat/route';
import { NextRequest } from 'next/server';

// Mock @google/genai
const mockGenerateContent = jest.fn();

jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContent: mockGenerateContent,
    },
  })),
}));

describe('/api/chat route', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns informative message when API key is missing', async () => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    const req = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'What is biology?', language: 'en' }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.text).toContain('offline demo mode');
  });

  it('calls Gemini generateContent with candidate model and returns JSON response', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    mockGenerateContent.mockResolvedValue({ text: 'Photosynthesis is important.' });

    const req = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'What is photosynthesis?', language: 'en' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: expect.stringMatching(/gemini-(3\.6|2\.5)-flash|gemini-flash-latest/),
        contents: expect.arrayContaining(['What is photosynthesis?']),
        config: expect.objectContaining({
          systemInstruction: expect.stringContaining('English'),
        }),
      })
    );

    const data = await res.json();
    expect(data.text).toBe('Photosynthesis is important.');
  });

  it('enforces target language in system instruction for Hindi and Telugu', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    mockGenerateContent.mockResolvedValue({ text: 'उत्तर' });

    const reqHindi = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'नमस्ते', language: 'hi' }),
    });

    await POST(reqHindi);
    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({
          systemInstruction: expect.stringContaining('Hindi (हिंदी)'),
        }),
      })
    );

    const reqTelugu = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'హలో', language: 'te' }),
    });

    await POST(reqTelugu);
    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({
          systemInstruction: expect.stringContaining('Telugu (తెలుగు)'),
        }),
      })
    );
  });
});

