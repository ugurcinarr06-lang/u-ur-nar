import type { Tur } from './types';

/**
 * Ruhsat, iskân ve imar durumu belgelerinin doldurulması için gereken
 * yapı/parsel bilgileri. Alanlar burada tanımlanır; hem giriş formu hem de
 * belge çıktıları bu listeden üretilir, sunucu da gelen anahtarları buna
 * göre süzer. Belediyenizin formu farklıysa düzenlenecek tek yer burasıdır.
 */

export type AlanTipi = 'metin' | 'sayi' | 'tarih' | 'secim' | 'uzun';

export interface YapiAlani {
  kod: string;
  ad: string;
  tip: AlanTipi;
  /** 'secim' için seçenekler. */
  secenekler?: string[];
  /** Alan altında görünen kısa açıklama. */
  ipucu?: string;
  /** Sayısal alanlarda birim ("m²", "TL"). */
  birim?: string;
}

export interface YapiGrubu {
  kod: string;
  ad: string;
  /** Bu grubun istendiği evrak türleri; boşsa hepsinde gösterilir. */
  turler?: Tur[];
  alanlar: YapiAlani[];
}

/** Yapı yaklaşık birim maliyet tebliğindeki sınıf/grup kodları. */
export const YAPI_SINIFLARI = [
  'I-A',
  'I-B',
  'II-A',
  'II-B',
  'II-C',
  'III-A',
  'III-B',
  'IV-A',
  'IV-B',
  'IV-C',
  'V-A',
  'V-B',
  'V-C',
  'V-D',
];

export const YAPI_GRUPLARI: YapiGrubu[] = [
  {
    kod: 'arsa',
    ad: 'Arsa ve imar bilgileri',
    alanlar: [
      { kod: 'il', ad: 'İl', tip: 'metin' },
      { kod: 'ilce', ad: 'İlçe', tip: 'metin' },
      { kod: 'cadde', ad: 'Cadde / sokak', tip: 'metin' },
      { kod: 'kapiNo', ad: 'Kapı no', tip: 'metin' },
      { kod: 'arsaAlani', ad: 'Arsa alanı', tip: 'sayi', birim: 'm²' },
      { kod: 'hisse', ad: 'Malik / hisse', tip: 'metin', ipucu: 'Tapudaki malik ve hisse oranı' },
      {
        kod: 'fonksiyon',
        ad: 'Plandaki fonksiyon',
        tip: 'metin',
        ipucu: 'Konut, ticaret, konut+ticaret…',
      },
      {
        kod: 'nizam',
        ad: 'Yapı nizamı',
        tip: 'secim',
        secenekler: ['Ayrık', 'Bitişik', 'Blok', 'İkiz'],
      },
      { kod: 'taks', ad: 'TAKS', tip: 'metin', ipucu: 'Taban alanı katsayısı (ör. 0,30)' },
      { kod: 'kaks', ad: 'KAKS (emsal)', tip: 'metin', ipucu: 'Kat alanı katsayısı (ör. 1,50)' },
      { kod: 'hmax', ad: 'Hmax / kat adedi', tip: 'metin', ipucu: 'Plandaki azami yükseklik' },
      { kod: 'cekmeOn', ad: 'Ön bahçe mesafesi', tip: 'metin', birim: 'm' },
      { kod: 'cekmeYan', ad: 'Yan bahçe mesafesi', tip: 'metin', birim: 'm' },
      { kod: 'cekmeArka', ad: 'Arka bahçe mesafesi', tip: 'metin', birim: 'm' },
      { kod: 'planAdi', ad: 'Uygulama imar planı', tip: 'metin', ipucu: 'Plan adı / onay tarihi' },
      {
        kod: 'planNotu',
        ad: 'Plan notları',
        tip: 'uzun',
        ipucu: 'İmar durumu belgesine yazılacak notlar',
      },
    ],
  },
  {
    kod: 'yapi',
    ad: 'Yapı bilgileri',
    turler: ['ruhsat', 'iskan', 'kot-kesit', 'yapi-kayit'],
    alanlar: [
      {
        kod: 'ruhsatTuru',
        ad: 'Ruhsat türü',
        tip: 'secim',
        secenekler: ['Yeni', 'İlave', 'Tadilat', 'Yenileme', 'İsim değişikliği'],
      },
      { kod: 'kullanimAmaci', ad: 'Kullanım amacı', tip: 'metin', ipucu: 'Konut, işyeri, karma…' },
      {
        kod: 'tasiyiciSistem',
        ad: 'Taşıyıcı sistem',
        tip: 'secim',
        secenekler: ['Betonarme', 'Çelik', 'Yığma', 'Ahşap', 'Prefabrik'],
      },
      { kod: 'yapiSinifi', ad: 'Yapı sınıfı / grubu', tip: 'secim', secenekler: YAPI_SINIFLARI },
      { kod: 'katBodrum', ad: 'Bodrum kat adedi', tip: 'sayi' },
      { kod: 'katZemin', ad: 'Zemin kat adedi', tip: 'sayi' },
      { kod: 'katNormal', ad: 'Normal kat adedi', tip: 'sayi' },
      { kod: 'katCati', ad: 'Çatı katı adedi', tip: 'sayi' },
      { kod: 'yapiYuksekligi', ad: 'Yapı yüksekliği', tip: 'metin', birim: 'm' },
      { kod: 'tabanAlani', ad: 'Taban alanı', tip: 'sayi', birim: 'm²' },
      { kod: 'toplamAlan', ad: 'Toplam inşaat alanı', tip: 'sayi', birim: 'm²' },
      { kod: 'emsalAlan', ad: 'Emsale konu alan', tip: 'sayi', birim: 'm²' },
      {
        kod: 'konutAlani',
        ad: 'Konut alanı',
        tip: 'sayi',
        birim: 'm²',
        ipucu: 'Harç hesabında ayrı tarifelendirilir',
      },
      { kod: 'ticariAlan', ad: 'Ticari alan', tip: 'sayi', birim: 'm²' },
      { kod: 'bbKonut', ad: 'Bağımsız bölüm (konut)', tip: 'sayi' },
      { kod: 'bbTicari', ad: 'Bağımsız bölüm (ticari)', tip: 'sayi' },
      { kod: 'otoparkAdedi', ad: 'Gereken otopark adedi', tip: 'sayi' },
      { kod: 'otoparkParselde', ad: 'Parselde karşılanan otopark', tip: 'sayi' },
    ],
  },
  {
    kod: 'taraflar',
    ad: 'Müteahhit, şantiye şefi ve yapı denetim',
    turler: ['ruhsat', 'iskan'],
    alanlar: [
      { kod: 'muteahhitAd', ad: 'Yapı müteahhidi', tip: 'metin' },
      { kod: 'muteahhitNo', ad: 'T.C. / vergi no', tip: 'metin' },
      { kod: 'muteahhitYambis', ad: 'Yetki belge no (YAMBİS)', tip: 'metin' },
      { kod: 'muteahhitAdres', ad: 'Müteahhit adresi', tip: 'metin' },
      { kod: 'sefAd', ad: 'Şantiye şefi', tip: 'metin' },
      { kod: 'sefNo', ad: 'Şantiye şefi T.C. / oda sicil', tip: 'metin' },
      { kod: 'denetimAd', ad: 'Yapı denetim kuruluşu', tip: 'metin' },
      { kod: 'denetimBelgeNo', ad: 'Yapı denetim izin belge no', tip: 'metin' },
      { kod: 'denetimSozlesme', ad: 'Yapı denetim sözleşme tarihi', tip: 'tarih' },
    ],
  },
  {
    kod: 'muellifler',
    ad: 'Proje müellifleri',
    turler: ['ruhsat', 'iskan'],
    alanlar: [
      { kod: 'mimar', ad: 'Mimari proje müellifi', tip: 'metin' },
      { kod: 'mimarSicil', ad: 'Mimar oda sicil no', tip: 'metin' },
      { kod: 'statikci', ad: 'Statik proje müellifi', tip: 'metin' },
      { kod: 'statikSicil', ad: 'İnşaat müh. oda sicil no', tip: 'metin' },
      { kod: 'mekanikci', ad: 'Mekanik tesisat müellifi', tip: 'metin' },
      { kod: 'mekanikSicil', ad: 'Makine müh. oda sicil no', tip: 'metin' },
      { kod: 'elektrikci', ad: 'Elektrik tesisat müellifi', tip: 'metin' },
      { kod: 'elektrikSicil', ad: 'Elektrik müh. oda sicil no', tip: 'metin' },
      { kod: 'zeminci', ad: 'Zemin etüdü müellifi', tip: 'metin' },
    ],
  },
  {
    kod: 'iskan',
    ad: 'Yapı kullanma izni bilgileri',
    turler: ['iskan'],
    alanlar: [
      { kod: 'ruhsatNo', ad: 'Yapı ruhsatı no', tip: 'metin' },
      { kod: 'ruhsatTarihi', ad: 'Yapı ruhsatı tarihi', tip: 'tarih' },
      { kod: 'baslamaTarihi', ad: 'Yapıya başlama tarihi', tip: 'tarih' },
      { kod: 'bitisTarihi', ad: 'Yapının bitiş tarihi', tip: 'tarih' },
      { kod: 'ekbSinifi', ad: 'Enerji kimlik belgesi sınıfı', tip: 'metin', ipucu: 'A–G' },
      { kod: 'sgkYazi', ad: 'SGK ilişiksizlik yazısı', tip: 'metin', ipucu: 'Tarih ve sayı' },
      {
        kod: 'kismiIskan',
        ad: 'Kısmi kullanma izni',
        tip: 'metin',
        ipucu: 'Verilen bağımsız bölümler',
      },
    ],
  },
];

/** Bir evrak türünde doldurulacak gruplar. */
export const yapiGruplari = (tur: Tur): YapiGrubu[] =>
  YAPI_GRUPLARI.filter((g) => !g.turler || g.turler.includes(tur));

/** Tüm tanımlı alan kodları — sunucu gelen anahtarları bununla süzer. */
export const YAPI_ALAN_KODLARI = new Set(YAPI_GRUPLARI.flatMap((g) => g.alanlar.map((a) => a.kod)));

export const yapiAlani = (kod: string): YapiAlani | undefined =>
  YAPI_GRUPLARI.flatMap((g) => g.alanlar).find((a) => a.kod === kod);

/** Yapı bilgileri: alan kodu → metin değer. Sayılar da metin tutulur. */
export type YapiBilgisi = Record<string, string>;

/** "1.250,50" / "1250.5" → 1250.5 · boş veya sayı değilse 0. */
export function sayiOku(deger: string | undefined): number {
  if (!deger) return 0;
  const temiz = deger.trim().replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  const n = Number(temiz);
  return Number.isFinite(n) ? n : 0;
}

/** 1250.5 → "1.250,5" */
export const sayiGoster = (n: number): string =>
  n.toLocaleString('tr-TR', { maximumFractionDigits: 2 });

/** Kat adetlerinden "2 bodrum + zemin + 4 normal" biçiminde özet. */
export function katOzeti(y: YapiBilgisi): string {
  return [
    sayiOku(y.katBodrum) > 0 && `${sayiOku(y.katBodrum)} bodrum`,
    sayiOku(y.katZemin) > 0 && `${sayiOku(y.katZemin)} zemin`,
    sayiOku(y.katNormal) > 0 && `${sayiOku(y.katNormal)} normal`,
    sayiOku(y.katCati) > 0 && `${sayiOku(y.katCati)} çatı`,
  ]
    .filter(Boolean)
    .join(' + ');
}

/** Toplam kat adedi. */
export const katSayisi = (y: YapiBilgisi): number =>
  sayiOku(y.katBodrum) + sayiOku(y.katZemin) + sayiOku(y.katNormal) + sayiOku(y.katCati);

/**
 * Belge basmadan önce eksik kalan alanları çıkarır. Belge yine de basılabilir
 * (memur elle tamamlayabilir); amaç çıktıya boş satır gitmeden uyarmaktır.
 */
export function eksikAlanlar(y: YapiBilgisi, kodlar: string[]): string[] {
  return kodlar
    .map((kod) => ({ kod, tanim: yapiAlani(kod) }))
    .filter(({ kod, tanim }) => tanim && !(y[kod] ?? '').trim())
    .map(({ tanim }) => tanim!.ad);
}

/** Yapı ruhsatı için en az bulunması gereken alanlar. */
export const RUHSAT_ZORUNLU = [
  'arsaAlani',
  'yapiSinifi',
  'toplamAlan',
  'kullanimAmaci',
  'muteahhitAd',
  'mimar',
];

/** Yapı kullanma izin belgesi için en az bulunması gereken alanlar. */
export const ISKAN_ZORUNLU = ['ruhsatNo', 'ruhsatTarihi', 'toplamAlan', 'yapiSinifi'];

/** İmar durumu belgesi için en az bulunması gereken alanlar. */
export const IMAR_DURUMU_ZORUNLU = ['arsaAlani', 'fonksiyon', 'nizam', 'taks', 'kaks'];
