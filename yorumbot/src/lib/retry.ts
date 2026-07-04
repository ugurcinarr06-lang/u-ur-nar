// Geçici hatalar (ağ kopması, 429, 5xx) için üstel geri çekilmeli tekrar deneme.
// Google/Claude API çağrıları tek bir hata yüzünden yorumu kaybetmemeli.

export interface RetryOptions {
  retries?: number; // toplam deneme sayısı (ilk deneme dahil değil)
  baseDelayMs?: number;
  maxDelayMs?: number;
}

function isRetryableStatus(status: number | undefined) {
  if (status === undefined) return false;
  return status === 429 || status >= 500;
}

function getStatus(err: any): number | undefined {
  return err?.status ?? err?.response?.status ?? err?.code;
}

function isRetryable(err: any): boolean {
  const status = getStatus(err);
  if (typeof status === "number" && isRetryableStatus(status)) return true;
  // Node ağ hataları (DNS, bağlantı kopması, timeout)
  const code = err?.code;
  if (["ECONNRESET", "ETIMEDOUT", "ECONNREFUSED", "EAI_AGAIN"].includes(code)) return true;
  return false;
}

export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const retries = opts.retries ?? 3;
  const baseDelayMs = opts.baseDelayMs ?? 500;
  const maxDelayMs = opts.maxDelayMs ?? 8000;

  let attempt = 0;
  for (;;) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= retries || !isRetryable(err)) throw err;
      const delay = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt) * (0.5 + Math.random() * 0.5);
      await new Promise((resolve) => setTimeout(resolve, delay));
      attempt++;
    }
  }
}
