import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const dynamic = 'force-dynamic';

function getLanguageName(lang?: string): string {
  switch (lang) {
    case 'hi':
      return 'Hindi (हिंदी)';
    case 'te':
      return 'Telugu (తెలుగు)';
    case 'en':
    default:
      return 'English';
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, language, image, tutorMode } = body;

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        text: 'AI Tutor is currently in offline demo mode. Please verify your GEMINI_API_KEY in .env.local to enable live AI responses.',
      });
    }

    const targetLanguage = getLanguageName(language);
    const personaInstruction = tutorMode === 'socratic'
      ? `You are an academic tutor. Use the Socratic method: guide the student step-by-step with intuitive questions, encouraging critical thinking and deep conceptual explanations. Respond strictly in the language: ${targetLanguage}.`
      : `You are an academic tutor. Explain concepts concisely, clearly, and accurately. Respond strictly in the language: ${targetLanguage}.`;

    const promptText = (message && typeof message === 'string' && message.trim())
      ? message.trim()
      : 'Explain the academic concepts in this textbook page.';

    const candidateModels = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-flash-latest'];
    let responseText = '';

    // Primary: GoogleGenAI SDK
    try {
      const ai = new GoogleGenAI({ apiKey });
      const contents: Array<string | { inlineData: { mimeType: string; data: string } }> = [];

      if (image && typeof image === 'string') {
        const cleanBase64 = image.includes(',') ? image.split(',')[1] : image;
        contents.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: cleanBase64,
          },
        });
      }
      contents.push(promptText);

      for (const model of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents,
            config: {
              systemInstruction: personaInstruction,
            },
          });
          if (response && response.text) {
            responseText = response.text;
            break;
          }
        } catch (modelErr: any) {
          console.warn(`Model ${model} via SDK failed:`, modelErr.message);
        }
      }
    } catch (sdkInitErr) {
      console.warn('SDK initialization failed, trying REST fallback:', sdkInitErr);
    }

    // Secondary: Direct REST endpoint fallback
    if (!responseText) {
      for (const model of candidateModels) {
        try {
          const restRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      ...(image && typeof image === 'string'
                        ? [{ inlineData: { mimeType: 'image/jpeg', data: image.includes(',') ? image.split(',')[1] : image } }]
                        : []),
                      { text: promptText },
                    ],
                  },
                ],
                systemInstruction: {
                  parts: [{ text: personaInstruction }],
                },
              }),
            }
          );
          if (restRes.ok) {
            const data = await restRes.json();
            const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (candidateText) {
              responseText = candidateText;
              break;
            }
          }
        } catch (restErr) {
          console.warn(`REST fallback for ${model} failed:`, restErr);
        }
      }
    }

    if (!responseText) {
      return NextResponse.json({
        text: 'AI Tutor is currently in offline demo mode. Please verify your GEMINI_API_KEY.',
      });
    }

    return NextResponse.json({ text: responseText });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({
      text: `Error: ${errorMsg}`,
    });
  }
}
