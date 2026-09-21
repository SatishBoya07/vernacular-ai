import { InferenceRequest, InferenceChunk, SupportedLanguage } from '@/types';

// Map language code to human-readable language description
export function getLanguagePrompt(targetLanguage: SupportedLanguage | string): string {
  switch (targetLanguage) {
    case 'hi':
      return 'Hindi (हिंदी)';
    case 'te':
      return 'Telugu (తెలుగు)';
    case 'en':
    default:
      return 'English';
  }
}

// Convert image Blob to base64 string
async function blobToBase64(blob: Blob): Promise<string> {
  if (typeof FileReader !== 'undefined') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1] || '';
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } else {
    const arrayBuffer = await blob.arrayBuffer();
    return Buffer.from(arrayBuffer).toString('base64');
  }
}

export async function* runInference(
  requestOrMessage: InferenceRequest | string,
  targetLangParam?: SupportedLanguage | string
): AsyncGenerator<InferenceChunk> {
  const userMessage = typeof requestOrMessage === 'string'
    ? requestOrMessage
    : requestOrMessage.audioTranscript || '';

  const targetLanguage = typeof requestOrMessage === 'string'
    ? (targetLangParam || 'en')
    : (requestOrMessage.language || 'en');

  const imageBlob = typeof requestOrMessage === 'object' ? requestOrMessage.imageBlob : null;
  const tutorMode = typeof requestOrMessage === 'object' ? requestOrMessage.tutorMode : 'summary';

  if (!userMessage.trim() && !imageBlob) {
    const emptyPrompt = targetLanguage === 'hi' 
      ? 'कृपया एक प्रश्न पूछें या एक पाठ्यपुस्तक पृष्ठ स्कैन करें।'
      : targetLanguage === 'te'
      ? 'దయచేసి ఒక ప్రశ్న అడగండి లేదా పాఠ్యపుస్తక పేజీని స్కాన్ చేయండి.'
      : 'Please ask a question or scan a textbook page.';

    yield {
      token: emptyPrompt,
      done: false,
      metadata: { latencyMs: 0, tokensPerSecond: 0 }
    };
    yield {
      token: '',
      done: true,
      metadata: { latencyMs: 0, tokensPerSecond: 0 }
    };
    return;
  }

  const startTime = Date.now();

  try {
    let base64Image: string | undefined = undefined;
    if (imageBlob && imageBlob.size > 0) {
      base64Image = await blobToBase64(imageBlob);
    }

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: userMessage,
        language: targetLanguage,
        image: base64Image,
        tutorMode,
      }),
    });

    if (!response.ok) {
      let errMessage = `HTTP error ${response.status}`;
      try {
        if (typeof response.json === 'function') {
          const errData = await response.json();
          errMessage = errData?.text || errData?.error || errMessage;
        } else if (typeof response.text === 'function') {
          errMessage = await response.text();
        }
      } catch (_) {}
      throw new Error(errMessage);
    }

    let fullText = '';
    if (typeof response.json === 'function') {
      const data = await response.json().catch(() => ({ text: '' }));
      fullText = data?.text || '';
    } else if (typeof response.text === 'function') {
      const raw = await response.text();
      try {
        const parsed = JSON.parse(raw);
        fullText = parsed.text || raw;
      } catch (_) {
        fullText = raw;
      }
    }

    if (!fullText) {
      fullText = 'No response received from AI.';
    }

    // Yield in smooth token chunks for typewriter effect
    const words = fullText.split(' ');
    for (let i = 0; i < words.length; i++) {
      const isLast = i === words.length - 1;
      const wordToken = words[i] + (isLast ? '' : ' ');
      const latencyMs = Date.now() - startTime;
      const tokensPerSecond = Math.round(((i + 1) / ((latencyMs || 1) / 1000)));

      yield {
        token: wordToken,
        done: false,
        metadata: {
          latencyMs,
          tokensPerSecond,
        },
      };

      // Fast, natural typewriter pacing (15ms delay per token if multiple words)
      if (words.length > 1 && i < words.length - 1) {
        await new Promise((r) => setTimeout(r, 15));
      }
    }

    yield {
      token: '',
      done: true,
      metadata: {
        latencyMs: Date.now() - startTime,
        tokensPerSecond: 0,
      }
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Inference request failed';
    yield {
      token: `⚠️ Error: ${message}`,
      done: false,
      metadata: { latencyMs: 0, tokensPerSecond: 0 }
    };
    yield {
      token: '',
      done: true,
      metadata: { latencyMs: 0, tokensPerSecond: 0 }
    };
  }
}
