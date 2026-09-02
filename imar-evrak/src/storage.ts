import { ornekVeri } from './data';
import type { Evrak, Yedek } from './types';

const ANAHTAR = 'imar-evrak/v1';

/** Kayıtları okur; ilk açılışta örnek veriyle başlar. */
export function evraklariOku(): Evrak[] {
  try {
    const ham = localStorage.getItem(ANAHTAR);
    if (!ham) return ornekVeri();
    const veri = JSON.parse(ham) as unknown;
    // Eski kayıtlarda "ekler"/"belgeler" alanı yok; okurken tamamlıyoruz.
    return Array.isArray(veri)
      ? (veri as Evrak[]).map((e) => ({ ...e, ekler: e.ekler ?? [], belgeler: e.belgeler ?? [] }))
      : ornekVeri();
  } catch {
    // Bozuk/erişilemez depolama: uygulama yine de açılsın.
    return ornekVeri();
  }
}

export function evraklariYaz(evraklar: Evrak[]): void {
  try {
    localStorage.setItem(ANAHTAR, JSON.stringify(evraklar));
  } catch {
    // Kota dolu veya gizli sekme: yazamamak uygulamayı durdurmamalı.
  }
}

export function yedekOlustur(evraklar: Evrak[]): Yedek {
  return {
    uygulama: 'imar-evrak',
    surum: 1,
    tarih: new Date().toISOString(),
    evraklar,
  };
}

/**
 * Yedek dosyasını çözer. Geçersizse hata fırlatır ki çağıran
 * kullanıcıya anlamlı bir mesaj gösterebilsin.
 */
export function yedekCoz(metin: string): Evrak[] {
  const veri = JSON.parse(metin) as Partial<Yedek>;
  if (veri?.uygulama !== 'imar-evrak' || !Array.isArray(veri.evraklar)) {
    throw new Error('Dosya bir İmar Evrak yedeği değil.');
  }
  return (veri.evraklar as Evrak[]).map((e) => ({
    ...e,
    ekler: e.ekler ?? [],
    belgeler: e.belgeler ?? [],
  }));
}
