/** Evrakın iş akışındaki durumu. */
export type Durum =
  | 'yeni'
  | 'incelemede'
  | 'eksik'
  | 'onaylandi'
  | 'reddedildi'
  | 'arsiv';

/** İmar müdürlüğüne gelen evrak türleri. */
export type Tur =
  | 'ruhsat'
  | 'iskan'
  | 'imar-durumu'
  | 'kot-kesit'
  | 'aplikasyon'
  | 'yapi-kayit'
  | 'sikayet'
  | 'diger';

/** Evrak üzerinde yapılan tek bir işlem (durum değişikliği veya not). */
export interface Islem {
  id: string;
  /** ISO tarih-saat. */
  tarih: string;
  /** İşlem sonrası durum. Sadece not düşüldüyse durum değişmez. */
  durum: Durum;
  not: string;
  kullanici: string;
}

export interface Tasinmaz {
  mahalle: string;
  ada: string;
  parsel: string;
  pafta: string;
}

export interface Basvuran {
  ad: string;
  telefon: string;
}

export interface Evrak {
  id: string;
  /** İnsan tarafından okunan evrak numarası: 2026/0043 */
  no: string;
  konu: string;
  tur: Tur;
  durum: Durum;
  /** ISO tarih (YYYY-MM-DD). */
  gelisTarihi: string;
  /** Kaç iş günü içinde sonuçlandırılması gerektiği. */
  hedefGun: number;
  basvuran: Basvuran;
  tasinmaz: Tasinmaz;
  /** Evrakı takip eden personel. */
  sorumlu: string;
  aciklama: string;
  gecmis: Islem[];
}

/** Liste ekranındaki filtre durumu. */
export interface Filtre {
  arama: string;
  durum: Durum | 'hepsi';
  tur: Tur | 'hepsi';
  sorumlu: string | 'hepsi';
  sadeceGeciken: boolean;
  /** Sonuçlanmamış (açık) dosyalar; özet kartından açılır. */
  sadeceAcik: boolean;
}

/** Yedek dosyasının biçimi. */
export interface Yedek {
  uygulama: 'imar-evrak';
  surum: 1;
  tarih: string;
  evraklar: Evrak[];
}
