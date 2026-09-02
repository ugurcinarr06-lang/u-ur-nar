import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';

/**
 * Şifreler scrypt ile saklanır (harici bağımlılık yok).
 * Biçim: scrypt$<tuz-hex>$<özet-hex>
 */
export function sifreOzeti(sifre: string): string {
  const tuz = randomBytes(16);
  const ozet = scryptSync(sifre.normalize('NFKC'), tuz, 64);
  return `scrypt$${tuz.toString('hex')}$${ozet.toString('hex')}`;
}

export function sifreDogru(sifre: string, kayit: string): boolean {
  const [alg, tuzHex, ozetHex] = kayit.split('$');
  if (alg !== 'scrypt' || !tuzHex || !ozetHex) return false;
  const beklenen = Buffer.from(ozetHex, 'hex');
  const gelen = scryptSync(sifre.normalize('NFKC'), Buffer.from(tuzHex, 'hex'), beklenen.length);
  return timingSafeEqual(beklenen, gelen);
}

export const yeniToken = (): string => randomBytes(32).toString('hex');

export const yeniId = (): string => randomUUID();

/** Oturum süresi: 12 saat (bir mesai günü). */
export const OTURUM_SURESI_MS = 12 * 60 * 60 * 1000;

export const COOKIE_ADI = 'imar_oturum';
