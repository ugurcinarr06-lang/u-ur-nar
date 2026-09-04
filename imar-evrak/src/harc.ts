import type { Tur } from './types';
import { YAPI_SINIFLARI, sayiOku, type YapiBilgisi } from './yapi';

/**
 * Harç, ücret ve katılım payı hesabı.
 *
 * Tutarlar KANUNDAN DEĞİL, belediyenin kendi tarifesinden gelir: her belediye
 * meclisi kendi tarife cetvelini belirler. Bu yüzden burada yalnızca hesap
 * yöntemi vardır; birim fiyatları müdür "Tarife" ekranından girer ve onaylar.
 * Tarife onaylanana kadar üretilen tahakkuk "örnek" sayılır ve çıktının
 * üstünde bu not yazar.
 */

/** Bir kalemin hangi büyüklükle çarpılacağı. */
export type Taban =
  | 'sabit'
  | 'insaat-alani'
  | 'emsal-alani'
  | 'konut-alani'
  | 'ticari-alan'
  | 'arsa-alani'
  | 'bagimsiz-bolum'
  | 'otopark-eksigi'
  | 'maliyet-yuzdesi';

export const TABANLAR: { deger: Taban; ad: string; birim: string }[] = [
  { deger: 'sabit', ad: 'Sabit tutar', birim: 'adet' },
  { deger: 'insaat-alani', ad: 'Toplam inşaat alanı', birim: 'm²' },
  { deger: 'emsal-alani', ad: 'Emsale konu alan', birim: 'm²' },
  { deger: 'konut-alani', ad: 'Konut alanı', birim: 'm²' },
  { deger: 'ticari-alan', ad: 'Ticari alan', birim: 'm²' },
  { deger: 'arsa-alani', ad: 'Arsa alanı', birim: 'm²' },
  { deger: 'bagimsiz-bolum', ad: 'Bağımsız bölüm sayısı', birim: 'adet' },
  { deger: 'otopark-eksigi', ad: 'Parselde karşılanamayan otopark', birim: 'adet' },
  { deger: 'maliyet-yuzdesi', ad: 'Yapı maliyetinin yüzdesi', birim: 'TL' },
];

export const tabanAdi = (t: Taban): string =>
  TABANLAR.find((x) => x.deger === t)?.ad ?? t;

export const tabanBirimi = (t: Taban): string =>
  TABANLAR.find((x) => x.deger === t)?.birim ?? '';

export interface HarcKalemi {
  kod: string;
  ad: string;
  taban: Taban;
  /** TL/birim; 'maliyet-yuzdesi' tabanında yüzde oranıdır. */
  birimFiyat: number;
  /** Bu kalemin çıkarıldığı evrak türleri. */
  turler: Tur[];
  aciklama: string;
  aktif: boolean;
}

export interface Tarife {
  yil: number;
  /** Müdür "belediyemizin tarifesi budur" dediğinde true olur. */
  onaylandi: boolean;
  onaylayan: string;
  guncelleme: string;
  /** Yapı sınıfı → m² yaklaşık yapı maliyeti (TL). Bakanlık tebliğinden girilir. */
  birimMaliyet: Record<string, number>;
  kalemler: HarcKalemi[];
}

/**
 * Kurulumda gelen kalem listesi. Adlar 2464 sayılı Belediye Gelirleri
 * Kanunu'ndaki harç/pay adlarıdır; TUTARLAR ÖRNEKTİR, belediyenin tarife
 * cetvelinden girilmelidir.
 */
export const VARSAYILAN_KALEMLER: HarcKalemi[] = [
  {
    kod: 'bina-insaat-konut',
    ad: 'Bina inşaat harcı (konut)',
    taban: 'konut-alani',
    birimFiyat: 0,
    turler: ['ruhsat'],
    aciklama: 'Konut bağımsız bölümlerinin inşaat alanı üzerinden',
    aktif: true,
  },
  {
    kod: 'bina-insaat-isyeri',
    ad: 'Bina inşaat harcı (işyeri)',
    taban: 'ticari-alan',
    birimFiyat: 0,
    turler: ['ruhsat'],
    aciklama: 'Ticari bağımsız bölümlerin inşaat alanı üzerinden',
    aktif: true,
  },
  {
    kod: 'plan-proje',
    ad: 'Plan ve proje tasdik harcı',
    taban: 'insaat-alani',
    birimFiyat: 0,
    turler: ['ruhsat'],
    aciklama: 'Onaylanan projelerin toplam inşaat alanı üzerinden',
    aktif: true,
  },
  {
    kod: 'zemin-acma',
    ad: 'Zemin açma izni ve toprak hafriyatı harcı',
    taban: 'arsa-alani',
    birimFiyat: 0,
    turler: ['ruhsat'],
    aciklama: 'Hafriyat yapılan alan üzerinden',
    aktif: true,
  },
  {
    kod: 'yapi-kullanma',
    ad: 'Yapı kullanma izni harcı',
    taban: 'insaat-alani',
    birimFiyat: 0,
    turler: ['iskan'],
    aciklama: 'İskân verilen inşaat alanı üzerinden',
    aktif: true,
  },
  {
    kod: 'imar-durumu-harci',
    ad: 'İmar durumu belgesi harcı',
    taban: 'sabit',
    birimFiyat: 0,
    turler: ['imar-durumu'],
    aciklama: 'Belge başına',
    aktif: true,
  },
  {
    kod: 'kot-kesit-harci',
    ad: 'Kot–kesit belgesi harcı',
    taban: 'sabit',
    birimFiyat: 0,
    turler: ['kot-kesit'],
    aciklama: 'Belge başına',
    aktif: true,
  },
  {
    kod: 'aplikasyon-harci',
    ad: 'Aplikasyon / röperli kroki ücreti',
    taban: 'sabit',
    birimFiyat: 0,
    turler: ['aplikasyon'],
    aciklama: 'Belge başına',
    aktif: true,
  },
  {
    kod: 'otopark-bedeli',
    ad: 'Otopark bedeli',
    taban: 'otopark-eksigi',
    birimFiyat: 0,
    turler: ['ruhsat'],
    aciklama: 'Parselinde karşılanamayan her otopark için',
    aktif: true,
  },
  {
    kod: 'kanal-katilim',
    ad: 'Kanalizasyon harcamalarına katılma payı',
    taban: 'insaat-alani',
    birimFiyat: 0,
    turler: ['ruhsat', 'iskan'],
    aciklama: 'Altyapı katılım payı',
    aktif: true,
  },
  {
    kod: 'yol-katilim',
    ad: 'Yol harcamalarına katılma payı',
    taban: 'arsa-alani',
    birimFiyat: 0,
    turler: ['ruhsat'],
    aciklama: 'Parselin yola cephesi olan alanı üzerinden',
    aktif: true,
  },
  {
    kod: 'su-katilim',
    ad: 'Su tesisleri harcamalarına katılma payı',
    taban: 'insaat-alani',
    birimFiyat: 0,
    turler: ['ruhsat'],
    aciklama: 'Altyapı katılım payı',
    aktif: true,
  },
];

export const VARSAYILAN_TARIFE: Tarife = {
  yil: new Date().getFullYear(),
  onaylandi: false,
  onaylayan: '',
  guncelleme: '',
  birimMaliyet: Object.fromEntries(YAPI_SINIFLARI.map((s) => [s, 0])),
  kalemler: VARSAYILAN_KALEMLER,
};

export interface TahakkukSatiri {
  kod: string;
  ad: string;
  taban: Taban;
  /** Çarpanın kendisi (alan, adet veya yapı maliyeti). */
  miktar: number;
  birim: string;
  birimFiyat: number;
  tutar: number;
  aciklama: string;
}

export interface Tahakkuk {
  satirlar: TahakkukSatiri[];
  toplam: number;
  /** Hesabı eksik bırakan noktalar (girilmemiş alan, sıfır birim fiyat…). */
  uyarilar: string[];
  /** Tarife onaylı değilse çıktı "örnek" sayılır. */
  tarifeOnayli: boolean;
  tarifeYili: number;
  tarih?: string;
  hesaplayan?: string;
  /** Makbuz kaydı: tahsil edildiğinde memur girer. */
  makbuzNo?: string;
  odemeTarihi?: string;
}

/** Yapı sınıfına göre toplam yapı maliyeti (TL). */
export function yapiMaliyeti(y: YapiBilgisi, tarife: Tarife): number {
  const alan = sayiOku(y.toplamAlan);
  const birim = tarife.birimMaliyet[y.yapiSinifi ?? ''] ?? 0;
  return alan * birim;
}

/** Bir tabanın bu yapı bilgilerindeki karşılığı. */
function tabanMiktari(taban: Taban, y: YapiBilgisi, tarife: Tarife): number {
  const toplam = sayiOku(y.toplamAlan);
  const ticari = sayiOku(y.ticariAlan);
  switch (taban) {
    case 'sabit':
      return 1;
    case 'insaat-alani':
      return toplam;
    case 'emsal-alani':
      return sayiOku(y.emsalAlan) || toplam;
    // Konut alanı girilmediyse, ticari alan biliniyorsa kalanı konut sayılır.
    case 'konut-alani':
      return sayiOku(y.konutAlani) || Math.max(0, toplam - ticari);
    case 'ticari-alan':
      return ticari;
    case 'arsa-alani':
      return sayiOku(y.arsaAlani);
    case 'bagimsiz-bolum':
      return sayiOku(y.bbKonut) + sayiOku(y.bbTicari);
    case 'otopark-eksigi':
      return Math.max(0, sayiOku(y.otoparkAdedi) - sayiOku(y.otoparkParselde));
    case 'maliyet-yuzdesi':
      return yapiMaliyeti(y, tarife);
  }
}

/**
 * Evrak türüne uyan aktif kalemleri hesaplar. Karar memurundur: tutarlar
 * ekranda satır satır gösterilir, memur kalem ekleyip çıkarabilir.
 */
export function harcHesapla(tur: Tur, y: YapiBilgisi, tarife: Tarife): Tahakkuk {
  const uyarilar: string[] = [];
  const satirlar: TahakkukSatiri[] = [];

  for (const k of tarife.kalemler) {
    if (!k.aktif || !k.turler.includes(tur)) continue;
    const miktar = tabanMiktari(k.taban, y, tarife);
    const tutar =
      k.taban === 'maliyet-yuzdesi' ? (miktar * k.birimFiyat) / 100 : miktar * k.birimFiyat;

    if (miktar === 0 && k.taban !== 'sabit') {
      uyarilar.push(`${k.ad}: ${tabanAdi(k.taban).toLocaleLowerCase('tr')} girilmemiş.`);
    }
    if (k.birimFiyat === 0) {
      uyarilar.push(`${k.ad}: tarifede birim fiyat girilmemiş.`);
    }

    satirlar.push({
      kod: k.kod,
      ad: k.ad,
      taban: k.taban,
      miktar,
      birim: tabanBirimi(k.taban),
      birimFiyat: k.birimFiyat,
      tutar,
      aciklama: k.aciklama,
    });
  }

  const maliyetKullanildi = satirlar.some((s) => s.taban === 'maliyet-yuzdesi');
  if (maliyetKullanildi && !(tarife.birimMaliyet[y.yapiSinifi ?? ''] ?? 0)) {
    uyarilar.push(
      `Yapı sınıfı "${y.yapiSinifi || '—'}" için m² birim maliyeti tarifede tanımlı değil.`,
    );
  }

  return {
    satirlar,
    toplam: satirlar.reduce((t, s) => t + s.tutar, 0),
    uyarilar,
    tarifeOnayli: tarife.onaylandi,
    tarifeYili: tarife.yil,
  };
}

/** 12345.6 → "12.345,60 TL" */
export const paraGoster = (n: number): string =>
  `${n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;

/** Sunucudan/yerelden gelen tarifeyi eksik alanlara karşı tamamlar. */
export function tarifeDuzelt(gelen: unknown): Tarife {
  const t = (gelen ?? {}) as Partial<Tarife>;
  const kalemler = Array.isArray(t.kalemler) && t.kalemler.length ? t.kalemler : VARSAYILAN_KALEMLER;
  return {
    yil: Number(t.yil) || new Date().getFullYear(),
    onaylandi: Boolean(t.onaylandi),
    onaylayan: t.onaylayan ?? '',
    guncelleme: t.guncelleme ?? '',
    birimMaliyet: {
      ...Object.fromEntries(YAPI_SINIFLARI.map((s) => [s, 0])),
      ...Object.fromEntries(
        Object.entries(t.birimMaliyet ?? {})
          .filter(([sinif]) => YAPI_SINIFLARI.includes(sinif))
          .map(([sinif, deger]) => [sinif, Math.max(0, Number(deger) || 0)]),
      ),
    },
    kalemler: kalemler.map((k) => ({
      kod: String(k.kod ?? ''),
      ad: String(k.ad ?? ''),
      taban: (TABANLAR.some((x) => x.deger === k.taban) ? k.taban : 'sabit') as Taban,
      // Eksi birim fiyat veri girişi hatasıdır; harcı eksiye düşürmesin.
      birimFiyat: Math.max(0, Number(k.birimFiyat) || 0),
      turler: Array.isArray(k.turler) ? k.turler : [],
      aciklama: String(k.aciklama ?? ''),
      aktif: k.aktif !== false,
    })),
  };
}
