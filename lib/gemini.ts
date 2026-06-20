import { GoogleGenAI } from '@google/genai';

// Sunucu tarafında çalışan paylaşılan çeviri çekirdeği.
// Hem Vercel serverless fonksiyonu (api/translate.ts) hem de yerel
// geliştirme middleware'i (vite.config.ts) bunu kullanır.
// API anahtarı parametre olarak alınır; burada ASLA okunmaz/gömülmez.

const LANG_NAMES: Record<string, string> = {
  tr: 'Turkish',
  en: 'English',
  ar: 'Arabic',
  de: 'German',
  ru: 'Russian',
  fr: 'French',
  es: 'Spanish',
  fa: 'Persian',
};

export async function translateText(
  text: string,
  fromCode: string,
  toCode: string,
  apiKey: string
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  const from = LANG_NAMES[fromCode] ?? fromCode;
  const to = LANG_NAMES[toCode] ?? toCode;

  const prompt =
    `You are a professional real-time face-to-face conversation interpreter. ` +
    `Translate the following ${from} utterance into natural, colloquial ${to}. ` +
    `Preserve tone and intent. Output ONLY the translated text — ` +
    `no quotes, no notes, no explanations.\n\nUtterance: ${text}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  const out = (response.text ?? '').trim();
  if (!out) throw new Error('EMPTY');
  return out;
}
