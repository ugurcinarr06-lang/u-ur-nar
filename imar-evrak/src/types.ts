import type { Gorus } from './gorus';
import type { Tahakkuk } from './harc';
import type { YapiBilgisi } from './yapi';

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

/** Evraka bağlı dosya (dilekçe taraması, proje pdf'i, tutanak fotoğrafı…). */
export interface Ek {
  id: string;
  /** Otomatik inceleme sonucu; sunucu kipinde doldurulur. */
  inceleme?: Inceleme;
  /** Bağlı olduğu kontrol listesi maddesi; boşsa dosya genel ektir. */
  belgeKodu: string;
  /** Kullanıcının yüklediği özgün dosya adı. */
  ad: string;
  /** Bayt cinsinden boyut. */
  boyut: number;
  tur: string;
  yukleyen: string;
  tarih: string;
}

/** Bir incelemede çıkan tek bulgu. */
export type BulguSeviye = 'bilgi' | 'uyari' | 'engel';

export interface Bulgu {
  seviye: BulguSeviye;
  baslik: string;
  ayrinti?: string;
  /** Bulgunun kaynağı: kural motoru, yapay zekâ veya kurum sorgusu. */
  kaynak: 'kural' | 'yapay-zeka' | 'kurum';
}

export type IncelemeDurumu = 'bekliyor' | 'inceleniyor' | 'tamam' | 'hata';

/** Yüklenen dosyanın otomatik incelenme sonucu. Karar memurundur. */
export interface Inceleme {
  durum: IncelemeDurumu;
  /** uygun: sorun görülmedi · kontrol: bakılmalı · uygunsuz: engel var */
  sonuc?: 'uygun' | 'kontrol' | 'uygunsuz';
  ozet?: string;
  bulgular: Bulgu[];
  /** İncelemeyi yapan model (ör. "kural" veya "ollama/llama3.1"). */
  model?: string;
  tarih?: string;
}

/** Kontrol listesindeki bir belgenin teslim durumu. */
export interface BelgeDurumu {
  /** belgeler.ts içindeki tanım kodu. */
  kod: string;
  teslim: boolean;
  /** Son işaretleyen personel ve zamanı. */
  kullanici?: string;
  tarih?: string;
  /** Memurun içerik kararı: teslim alınmak belgeyi uygun yapmaz. */
  karar?: 'uygun' | 'uygunsuz';
  kararNotu?: string;
  kararVeren?: string;
  kararTarihi?: string;
  /** e-Devlet / kurum belgesindeki barkod veya doğrulama kodu. */
  dogrulamaKodu?: string;
  /** Kod kaynağından teyit edildiyse true. */
  dogrulandi?: boolean;
  dogrulayan?: string;
  dogrulamaTarihi?: string;
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
  /** Yerel kipte dosya saklanamadığı için her zaman boştur. */
  ekler: Ek[];
  /** Yalnızca işaretlenmiş belgeler tutulur; kalanlar eksik sayılır. */
  belgeler: BelgeDurumu[];
  /** Ruhsat/iskân/imar durumu belgelerini dolduran yapı ve parsel bilgileri. */
  yapi: YapiBilgisi;
  /** Başka kurumlardan istenen görüşler. */
  gorusler: Gorus[];
  /** Son harç tahakkuku; hesaplanmadıysa yoktur. */
  tahakkuk?: Tahakkuk;
  /** Vatandaşa verilen takip kodu; yalnızca sunucu kipinde vardır. */
  takipKodu?: string;
}

/** Vatandaşın takip ekranında gördüğü, daraltılmış bilgi. */
export interface TakipSonucu {
  no: string;
  konu: string;
  tur: Tur;
  gelisTarihi: string;
  durum: Durum;
  sonGuncelleme: string;
  hedefGun: number;
  /** Hedef süreye kalan gün; negatifse aşım. */
  kalanGun: number;
  eksikBelgeler: string[];
  uygunsuzBelgeler: { ad: string; neden?: string }[];
  /** Cevabı beklenen kurum görüşleri — vatandaş gecikmenin nedenini görsün. */
  beklenenGorusler: string[];
}

/** Formdan gelen, henüz kaydedilmemiş evrak bilgileri. */
export type Taslak = Omit<
  Evrak,
  'id' | 'gecmis' | 'ekler' | 'belgeler' | 'yapi' | 'gorusler' | 'tahakkuk'
>;

/** Liste ekranındaki filtre durumu. */
export interface Filtre {
  arama: string;
  durum: Durum | 'hepsi';
  tur: Tur | 'hepsi';
  sorumlu: string | 'hepsi';
  sadeceGeciken: boolean;
  /** Sonuçlanmamış (açık) dosyalar; özet kartından açılır. */
  sadeceAcik: boolean;
  /** Zorunlu belgeleri tamam, karar bekleyen dosyalar. */
  sadeceHazir: boolean;
  /** Cevabı beklenen kurum görüşü olan dosyalar. */
  sadeceGorusBekleyen: boolean;
  /** Harcı tahakkuk etmiş ama tahsil edilmemiş dosyalar. */
  sadeceOdenmemis: boolean;
}

/** Yedek dosyasının biçimi. */
export interface Yedek {
  uygulama: 'imar-evrak';
  surum: 1;
  tarih: string;
  evraklar: Evrak[];
}
