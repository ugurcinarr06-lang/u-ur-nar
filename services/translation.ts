// İstemci tarafı çeviri servisi.
// Artık API anahtarını tarayıcıda kullanmaz; çeviriyi serverless
// fonksiyona (POST /api/translate) devreder. Böylece ANTHROPIC_API_KEY
// yalnızca sunucuda kalır ve istemci paketine gömülmez.
export async function translate(
  text: string,
  fromCode: string,
  toCode: string
): Promise<string> {
  let res: Response;
  try {
    res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, from: fromCode, to: toCode }),
    });
  } catch {
    throw new Error('NETWORK');
  }

  if (res.status === 503) throw new Error('NO_API_KEY');
  if (!res.ok) throw new Error('TRANSLATE_FAILED');

  const data = (await res.json().catch(() => null)) as { translation?: string } | null;
  const out = (data?.translation ?? '').trim();
  if (!out) throw new Error('EMPTY');
  return out;
}
