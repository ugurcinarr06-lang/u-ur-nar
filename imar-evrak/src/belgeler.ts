import type { Tur } from './types';

export interface BelgeTanimi {
  kod: string;
  ad: string;
  /**
   * false: yalnızca bazı başvurularda istenir (vekâletname, asansör
   * raporu gibi). Eksik belge yazısında koşullu belgeler yer almaz.
   */
  zorunlu: boolean;
}

/**
 * Evrak türüne göre istenen belgeler. Belediyeler arasında küçük
 * farklar olabilir; liste buradan düzenlenir.
 */
export const BELGELER: Record<Tur, BelgeTanimi[]> = {
  ruhsat: [
    { kod: 'dilekce', ad: 'Başvuru dilekçesi', zorunlu: true },
    { kod: 'tapu', ad: 'Tapu kayıt örneği', zorunlu: true },
    { kod: 'imar-durumu', ad: 'İmar durumu belgesi', zorunlu: true },
    { kod: 'aplikasyon', ad: 'Aplikasyon / röperli kroki', zorunlu: true },
    { kod: 'kot-kesit', ad: 'Kot–kesit belgesi', zorunlu: true },
    { kod: 'mimari', ad: 'Mimari proje', zorunlu: true },
    { kod: 'statik', ad: 'Statik proje ve hesaplar', zorunlu: true },
    { kod: 'zemin', ad: 'Zemin etüdü raporu', zorunlu: true },
    { kod: 'elektrik', ad: 'Elektrik tesisat projesi', zorunlu: true },
    { kod: 'mekanik', ad: 'Mekanik (sıhhi) tesisat projesi', zorunlu: true },
    { kod: 'yapi-denetim', ad: 'Yapı denetim sözleşmesi / izin belgesi', zorunlu: true },
    { kod: 'muteahhit', ad: 'Müteahhit yetki belgesi (YAMBİS)', zorunlu: true },
    { kod: 'santiye-sefi', ad: 'Şantiye şefi sözleşmesi', zorunlu: true },
    { kod: 'harc', ad: 'Harç ve katılım payı makbuzları', zorunlu: true },
    { kod: 'vekalet', ad: 'Noter onaylı vekâletname (vekâleten başvuruda)', zorunlu: false },
  ],
  iskan: [
    { kod: 'dilekce', ad: 'Başvuru dilekçesi', zorunlu: true },
    { kod: 'ruhsat', ad: 'Yapı ruhsatı örneği', zorunlu: true },
    { kod: 'is-bitirme', ad: 'Yapı denetim iş bitirme tutanağı', zorunlu: true },
    { kod: 'sgk', ad: 'SGK ilişiksizlik belgesi', zorunlu: true },
    { kod: 'vergi', ad: 'Vergi ilişik kesme belgesi', zorunlu: true },
    { kod: 'ekb', ad: 'Enerji kimlik belgesi (EKB)', zorunlu: true },
    { kod: 'kanal', ad: 'Kanal bağlantı / altyapı katılım belgesi', zorunlu: true },
    { kod: 'emlak', ad: 'Emlak beyanı', zorunlu: true },
    { kod: 'fotograf', ad: 'Yapının dört cephe fotoğrafı', zorunlu: true },
    { kod: 'asansor', ad: 'Asansör tescil ve son kontrol raporu', zorunlu: false },
    { kod: 'yangin', ad: 'Yangın güvenlik raporu', zorunlu: false },
  ],
  'imar-durumu': [
    { kod: 'dilekce', ad: 'Başvuru dilekçesi', zorunlu: true },
    { kod: 'tapu', ad: 'Tapu kayıt örneği (son bir ay)', zorunlu: true },
    { kod: 'kimlik', ad: 'Kimlik fotokopisi', zorunlu: true },
    { kod: 'harc', ad: 'Harç makbuzu', zorunlu: true },
    { kod: 'vekalet', ad: 'Vekâletname (vekâleten başvuruda)', zorunlu: false },
  ],
  'kot-kesit': [
    { kod: 'dilekce', ad: 'Başvuru dilekçesi', zorunlu: true },
    { kod: 'imar-durumu', ad: 'İmar durumu belgesi', zorunlu: true },
    { kod: 'aplikasyon', ad: 'Aplikasyon krokisi', zorunlu: true },
    { kod: 'harc', ad: 'Harç makbuzu', zorunlu: true },
  ],
  aplikasyon: [
    { kod: 'dilekce', ad: 'Başvuru dilekçesi', zorunlu: true },
    { kod: 'tapu', ad: 'Tapu kayıt örneği', zorunlu: true },
    { kod: 'harc', ad: 'Harç makbuzu', zorunlu: true },
  ],
  'yapi-kayit': [
    { kod: 'basvuru', ad: 'e-Devlet yapı kayıt belgesi başvuru çıktısı', zorunlu: true },
    { kod: 'tapu', ad: 'Tapu veya zilyetlik belgesi', zorunlu: true },
    { kod: 'kimlik', ad: 'Kimlik fotokopisi', zorunlu: true },
    { kod: 'fotograf', ad: 'Yapı fotoğrafları', zorunlu: true },
    { kod: 'dekont', ad: 'Ödeme dekontu', zorunlu: true },
  ],
  sikayet: [
    { kod: 'dilekce', ad: 'İmzalı şikâyet dilekçesi', zorunlu: true },
    { kod: 'iletisim', ad: 'Ad soyad ve iletişim bilgisi', zorunlu: true },
    { kod: 'konum', ad: 'Şikâyete konu yerin adresi / krokisi', zorunlu: true },
    { kod: 'fotograf', ad: 'Fotoğraf veya belge', zorunlu: false },
  ],
  diger: [
    { kod: 'dilekce', ad: 'Başvuru dilekçesi', zorunlu: true },
    { kod: 'kimlik', ad: 'Kimlik fotokopisi', zorunlu: true },
    { kod: 'harc', ad: 'Harç makbuzu', zorunlu: false },
  ],
};

/**
 * Kaynağından (e-Devlet, YAMBİS, ilgili kurum) teyit edilebilen belgeler.
 * Yalnızca bunlarda doğrulama kodu alanı gösterilir.
 */
export const DOGRULANABILIR = new Set([
  'tapu',
  'sgk',
  'vergi',
  'ekb',
  'basvuru',
  'muteahhit',
  'yapi-denetim',
  'kimlik',
]);

export const belgeListesi = (tur: Tur): BelgeTanimi[] => BELGELER[tur] ?? BELGELER.diger;

export const belgeAdi = (tur: Tur, kod: string): string =>
  belgeListesi(tur).find((b) => b.kod === kod)?.ad ?? kod;
