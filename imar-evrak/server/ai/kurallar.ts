import type { Bulgu } from '../../src/types.js';
import type { MetinSonucu } from './metin.js';

export interface IncelemeGirdisi {
  /** Dosyanın bağlı olduğu belge kodu; boşsa genel ek. */
  belgeKodu: string;
  belgeAdi: string;
  dosyaAdi: string;
  boyut: number;
  /** Evrak kaydındaki bilgiler — belge bunlarla karşılaştırılır. */
  evrak: {
    no: string;
    tur: string;
    konu: string;
    gelisTarihi: string;
    basvuran: string;
    mahalle: string;
    ada: string;
    parsel: string;
    pafta: string;
  };
  metin: MetinSonucu;
  /** Aynı içerik daha önce bu evraka yüklenmiş mi. */
  kopyaMi: boolean;
}

/** Belgenin metninde görülmesi beklenen anahtar kelimeler. */
const ANAHTARLAR: Record<string, string[]> = {
  tapu: ['tapu', 'taşınmaz', 'malik'],
  'imar-durumu': ['imar durumu', 'taks', 'kaks', 'nizam'],
  'kot-kesit': ['kot', 'kesit'],
  aplikasyon: ['aplikasyon', 'röperli', 'kroki'],
  mimari: ['mimari', 'proje', 'vaziyet planı'],
  statik: ['statik', 'betonarme', 'hesap'],
  zemin: ['zemin etüdü', 'sondaj', 'jeoteknik', 'zemin etüt'],
  elektrik: ['elektrik', 'tesisat'],
  mekanik: ['mekanik', 'sıhhi tesisat', 'tesisat'],
  'yapi-denetim': ['yapı denetim', 'denetim sözleşmesi'],
  muteahhit: ['müteahhit', 'yetki belgesi', 'yambis'],
  'santiye-sefi': ['şantiye şefi', 'sözleşme'],
  harc: ['makbuz', 'harç', 'tahsilat'],
  sgk: ['sosyal güvenlik', 'ilişiksizlik'],
  vergi: ['vergi', 'ilişik kesme'],
  ekb: ['enerji kimlik', 'ekb'],
  'is-bitirme': ['iş bitirme', 'tutanak'],
  kanal: ['kanal', 'altyapı'],
  emlak: ['emlak', 'beyan'],
  vekalet: ['vekâletname', 'vekaletname', 'noter'],
  dilekce: ['dilekçe', 'talep', 'başvuru'],
  kimlik: ['t.c.', 'kimlik', 'nüfus'],
};

/** Tazeliği önemli belgeler ve azami yaşları (gün). */
const TAZELIK: Record<string, number> = {
  tapu: 30,
  'imar-durumu': 365,
  sgk: 60,
  vergi: 60,
};

/** Islak/elektronik imza aranması gereken belgeler. */
const IMZA_BEKLENEN = new Set([
  'mimari',
  'statik',
  'elektrik',
  'mekanik',
  'zemin',
  'yapi-denetim',
  'santiye-sefi',
  'dilekce',
  'is-bitirme',
]);

/**
 * Metindeki ada/parsel numaralarını toplar. Türkçede iki yazım da yaygın:
 * "Ada No: 412" ve "412 ada 7 parsel" — ikisi de yakalanır.
 */
const sayilar = (metin: string, kelime: string): string[] => {
  const bulunan = new Set<string>();
  const sonra = new RegExp(`${kelime}\\s*(?:no|nu|numarası)?\\s*[:.]?\\s*(\\d{1,5})`, 'gi');
  const once = new RegExp(`(\\d{1,5})\\s*(?:nolu\\s*)?${kelime}`, 'gi');
  for (const e of metin.matchAll(sonra)) bulunan.add(e[1]);
  for (const e of metin.matchAll(once)) bulunan.add(e[1]);
  return [...bulunan];
};

/** Metindeki gg.aa.yyyy tarihlerini ISO olarak döndürür. */
function tarihler(metin: string): string[] {
  const liste: string[] = [];
  for (const e of metin.matchAll(/(\d{2})[.\/-](\d{2})[.\/-](\d{4})/g)) {
    const [, g, a, y] = e;
    const iso = `${y}-${a}-${g}`;
    if (!Number.isNaN(new Date(iso).getTime())) liste.push(iso);
  }
  return liste;
}

const gunFarki = (iso: string): number =>
  Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000);

/**
 * Model gerektirmeyen, her zaman çalışan kontroller. Hiçbiri belgeyi
 * reddetmez; memura gösterilecek bulgular üretir.
 */
export function kurallariUygula(g: IncelemeGirdisi): Bulgu[] {
  const bulgular: Bulgu[] = [];
  const ekle = (seviye: Bulgu['seviye'], baslik: string, ayrinti?: string) =>
    bulgular.push({ seviye, baslik, ayrinti, kaynak: 'kural' });

  if (g.kopyaMi) {
    ekle('uyari', 'Bu dosya bu evraka daha önce yüklenmiş', 'İçerik birebir aynı.');
  }

  if (g.boyut < 3 * 1024) {
    ekle('uyari', 'Dosya çok küçük', `${g.boyut} bayt — eksik veya boş olabilir.`);
  }

  if (g.metin.hata) {
    ekle('bilgi', 'Dosya okunamadı', g.metin.hata);
    return bulgular;
  }

  if (g.metin.taranmis) {
    ekle(
      'bilgi',
      'Taranmış belge — metin kontrolü yapılamadı',
      'İçerik karşılaştırmaları için OCR gerekiyor; gözle kontrol edilmeli.',
    );
    return bulgular;
  }

  const metin = g.metin.metin;
  const kucuk = metin.toLocaleLowerCase('tr');

  // 1) Taşınmaz eşleşmesi
  if (g.evrak.ada && g.evrak.parsel) {
    const adalar = sayilar(metin, 'ada');
    const parseller = sayilar(metin, 'parsel');
    if (adalar.length || parseller.length) {
      const adaUyar = adalar.length > 0 && !adalar.includes(g.evrak.ada);
      const parselUyar = parseller.length > 0 && !parseller.includes(g.evrak.parsel);
      if (adaUyar || parselUyar) {
        ekle(
          'engel',
          'Belgedeki ada/parsel evrak kaydıyla uyuşmuyor',
          `Belgede ada ${adalar.join(', ') || '—'} / parsel ${parseller.join(', ') || '—'}; ` +
            `kayıtta ada ${g.evrak.ada} / parsel ${g.evrak.parsel}. Yanlış dosya olabilir.`,
        );
      } else {
        ekle('bilgi', 'Ada/parsel evrak kaydıyla uyuşuyor');
      }
    } else {
      ekle('uyari', 'Belgede ada/parsel bilgisi bulunamadı');
    }
  }

  // 2) Başvuran adı
  if (g.evrak.basvuran) {
    const parcalar = g.evrak.basvuran.toLocaleLowerCase('tr').split(/\s+/).filter((p) => p.length > 2);
    if (parcalar.length && !parcalar.every((p) => kucuk.includes(p))) {
      ekle(
        'uyari',
        'Başvuran adı belgede geçmiyor',
        `Kayıttaki ad: ${g.evrak.basvuran}. Belge başkasına ait olabilir.`,
      );
    }
  }

  // 3) Belge türü
  const anahtar = ANAHTARLAR[g.belgeKodu];
  if (anahtar && !anahtar.some((k) => kucuk.includes(k))) {
    ekle(
      'uyari',
      `Dosya "${g.belgeAdi}" gibi görünmüyor`,
      `Beklenen ifadelerin hiçbiri geçmiyor (${anahtar.join(', ')}). Yanlış satıra yüklenmiş olabilir.`,
    );
  }

  // 4) Tarih
  const bulunanTarihler = tarihler(metin);
  if (bulunanTarihler.length) {
    const enYeni = bulunanTarihler.sort().at(-1)!;
    const yas = gunFarki(enYeni);
    const sinir = TAZELIK[g.belgeKodu];
    if (yas < -1) {
      ekle('uyari', 'Belgede ileri tarih var', `Belgedeki en yeni tarih: ${enYeni}.`);
    } else if (sinir && yas > sinir) {
      ekle(
        'uyari',
        'Belge güncelliğini yitirmiş olabilir',
        `Belgedeki en yeni tarih ${enYeni} (${yas} gün önce); bu belge için beklenen azami yaş ${sinir} gün.`,
      );
    }
  } else if (TAZELIK[g.belgeKodu]) {
    ekle('uyari', 'Belgede tarih bulunamadı', 'Güncellik kontrolü yapılamadı.');
  }

  // 5) İmza
  if (IMZA_BEKLENEN.has(g.belgeKodu)) {
    if (g.metin.eImzali) {
      ekle('bilgi', 'Belgede elektronik imza alanı var');
    } else {
      ekle(
        'uyari',
        'Elektronik imza görülmedi',
        'Islak imzalı asıl veya e-imzalı sürüm kontrol edilmeli.',
      );
    }
  }

  // 6) Sayfa sayısı
  if (['mimari', 'statik', 'zemin'].includes(g.belgeKodu) && g.metin.sayfa === 1) {
    ekle('uyari', 'Belge tek sayfa', 'Proje/rapor için beklenenden kısa.');
  }

  return bulgular;
}
