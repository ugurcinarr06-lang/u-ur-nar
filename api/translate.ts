import type { VercelRequest, VercelResponse } from '@vercel/node';
import { translateText } from '../lib/gemini';

// Vercel serverless fonksiyonu: POST /api/translate
// Gövde: { text, from, to } → Yanıt: { translation }
// GEMINI_API_KEY yalnızca sunucu ortamında okunur, istemciye gönderilmez.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: 'NO_API_KEY' });
    return;
  }

  try {
    const { text, from, to } = (req.body ?? {}) as {
      text?: string;
      from?: string;
      to?: string;
    };

    if (!text || !from || !to) {
      res.status(400).json({ error: 'BAD_REQUEST' });
      return;
    }

    const translation = await translateText(
      String(text),
      String(from),
      String(to),
      apiKey
    );
    res.status(200).json({ translation });
  } catch {
    res.status(500).json({ error: 'TRANSLATE_FAILED' });
  }
}
