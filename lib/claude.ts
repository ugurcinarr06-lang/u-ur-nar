import Anthropic from '@anthropic-ai/sdk';

// Sunucu tarafında çalışan paylaşılan çeviri çekirdeği (Claude / Anthropic).
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
  const client = new Anthropic({ apiKey });
  const from = LANG_NAMES[fromCode] ?? fromCode;
  const to = LANG_NAMES[toCode] ?? toCode;

  const system =
    `You are a professional real-time face-to-face conversation interpreter. ` +
    `Translate the user's ${from} utterance into natural, colloquial ${to}. ` +
    `Preserve tone and intent. Output ONLY the translated text — ` +
    `no quotes, no notes, no explanations.`;

  // claude-haiku-4-5: en hızlı ve en ucuz model; canlı çeviri için ideal.
  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    system,
    messages: [{ role: 'user', content: text }],
  });

  let out = '';
  for (const block of response.content) {
    if (block.type === 'text') out += block.text;
  }
  out = out.trim();
  if (!out) throw new Error('EMPTY');
  return out;
}
