import { GoogleGenAI } from '@google/genai';
import { findLanguage } from '../data';

// API anahtarı vite.config.ts içinde process.env.API_KEY olarak enjekte edilir
// (kaynağı .env.local içindeki GEMINI_API_KEY). Anahtar ASLA koda gömülmez.
const apiKey = process.env.API_KEY as string | undefined;

// Anahtar yoksa arayüz kullanıcıya nazikçe bilgi verebilsin diye dışa aktarıyoruz.
export const translationConfigured = Boolean(apiKey);

let client: GoogleGenAI | null = null;
const getClient = (): GoogleGenAI | null => {
  if (!apiKey) return null;
  if (!client) client = new GoogleGenAI({ apiKey });
  return client;
};

// Gerçek zamanlı sohbet çevirmeni gibi davranır: tek bir cümleyi/ifadeyi
// kaynak dilden hedef dile çevirir ve SADECE çeviriyi döndürür.
export async function translate(
  text: string,
  fromCode: string,
  toCode: string
): Promise<string> {
  const ai = getClient();
  if (!ai) throw new Error('NO_API_KEY');

  const from = findLanguage(fromCode);
  const to = findLanguage(toCode);

  const prompt =
    `You are a professional real-time face-to-face conversation interpreter. ` +
    `Translate the following ${from.nativeName} utterance into natural, ` +
    `colloquial ${to.nativeName}. Preserve tone and intent. ` +
    `Output ONLY the translated text — no quotes, no notes, no explanations.\n\n` +
    `Utterance: ${text}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  const out = (response.text ?? '').trim();
  if (!out) throw new Error('EMPTY');
  return out;
}
