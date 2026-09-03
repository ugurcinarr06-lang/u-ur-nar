import type { MuteahhitSonucu, SorguTuru, TapuSonucu } from './tipler.js';

/**
 * Kurum servisleri için genel HTTP sağlayıcısı.
 *
 * Gerçek uçlar (TAKBİS/YAMBİS) protokolle açıldığında KOD DEĞİŞMEZ:
 * adres, başlıklar, istek gövdesi ve yanıttaki alan yolları ortam
 * değişkenlerinden okunur. Böylece entegrasyon, izin gelene kadar
 * "deneme" sağlayıcısıyla çalışır durumda bekler.
 */

export interface SorguGirdisi {
  il?: string;
  ilce?: string;
  mahalle?: string;
  ada?: string;
  parsel?: string;
  /** YAMBİS için: yetki belgesi numarası veya vergi/TC no. */
  belgeNo?: string;
}

export interface Sonuc<T> {
  veri: T;
  ham: unknown;
}

export interface KurumSaglayici {
  ad: string;
  tapuSorgula?(g: SorguGirdisi): Promise<Sonuc<TapuSonucu>>;
  muteahhitSorgula?(g: SorguGirdisi): Promise<Sonuc<MuteahhitSonucu>>;
}

const ortam = (ad: string, varsayilan = ''): string => process.env[ad] ?? varsayilan;

const AYAR = {
  takbis: ortam('IMAR_TAKBIS', 'kapali').toLowerCase(),
  yambis: ortam('IMAR_YAMBIS', 'kapali').toLowerCase(),
  zamanAsimiMs: Number(ortam('IMAR_KURUM_ZAMAN_ASIMI', '30000')),
};

/** "sonuc.malikler.0.ad" gibi bir yoldan değer okur. */
function yoldanAl(kaynak: unknown, yol: string): unknown {
  if (!yol) return undefined;
  return yol.split('.').reduce<unknown>((deger, parca) => {
    if (deger === null || deger === undefined) return undefined;
    if (Array.isArray(deger)) return deger[Number(parca)];
    if (typeof deger === 'object') return (deger as Record<string, unknown>)[parca];
    return undefined;
  }, kaynak);
}

const metin = (deger: unknown): string | undefined => {
  if (deger === null || deger === undefined) return undefined;
  if (Array.isArray(deger)) return deger.map((d) => String(d)).join(', ');
  return String(deger);
};

/**
 * Şablondaki {{alan}} yerlerine girdi değerlerini koyar.
 * Gövde şablonunda JSON kaçışı, adres şablonunda yüzde kodlaması uygulanır —
 * aksi hâlde ada/parsel alanına yazılan bir değer adrese parametre
 * ekleyebilirdi.
 */
function sablonDoldur(sablon: string, g: SorguGirdisi, adres = false): string {
  return sablon.replace(/\{\{(\w+)\}\}/g, (_, ad: string) => {
    const deger = (g as Record<string, string | undefined>)[ad] ?? '';
    return adres ? encodeURIComponent(deger) : JSON.stringify(deger).slice(1, -1);
  });
}

async function httpIstek(onek: string, g: SorguGirdisi): Promise<unknown> {
  const url = sablonDoldur(ortam(`${onek}_URL`), g, true);
  if (!url) throw new Error(`${onek}_URL tanımlı değil.`);

  const yontem = ortam(`${onek}_YONTEM`, 'POST').toUpperCase();
  let baslikar: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    Object.assign(baslikar, JSON.parse(ortam(`${onek}_BASLIKLAR`, '{}')) as Record<string, string>);
  } catch {
    throw new Error(`${onek}_BASLIKLAR geçerli JSON değil.`);
  }

  const kontrol = new AbortController();
  const sayac = setTimeout(() => kontrol.abort(), AYAR.zamanAsimiMs);
  try {
    const yanit = await fetch(url, {
      method: yontem,
      headers: baslikar,
      body: yontem === 'GET' ? undefined : sablonDoldur(ortam(`${onek}_GOVDE`, '{}'), g),
      signal: kontrol.signal,
    });
    if (!yanit.ok) throw new Error(`${onek} ${yanit.status}: ${(await yanit.text()).slice(0, 200)}`);
    return (await yanit.json()) as unknown;
  } finally {
    clearTimeout(sayac);
  }
}

function httpTapu(): KurumSaglayici {
  return {
    ad: 'http/takbis',
    async tapuSorgula(g) {
      const ham = await httpIstek('IMAR_TAKBIS', g);
      const malikAlan = ortam('IMAR_TAKBIS_ALAN_MALIK', 'malikler');
      const malikDeger = yoldanAl(ham, malikAlan);
      const malikler = Array.isArray(malikDeger)
        ? malikDeger.map((m) => String(typeof m === 'object' ? metin(yoldanAl(m, ortam('IMAR_TAKBIS_ALAN_MALIK_AD', 'adSoyad'))) : m))
        : metin(malikDeger)
          ? [metin(malikDeger)!]
          : [];

      return {
        ham,
        veri: {
          bulundu: malikler.length > 0 || Boolean(yoldanAl(ham, ortam('IMAR_TAKBIS_ALAN_ADA', 'ada'))),
          malikler,
          ada: metin(yoldanAl(ham, ortam('IMAR_TAKBIS_ALAN_ADA', 'ada'))),
          parsel: metin(yoldanAl(ham, ortam('IMAR_TAKBIS_ALAN_PARSEL', 'parsel'))),
          mahalle: metin(yoldanAl(ham, ortam('IMAR_TAKBIS_ALAN_MAHALLE', 'mahalle'))),
          nitelik: metin(yoldanAl(ham, ortam('IMAR_TAKBIS_ALAN_NITELIK', 'nitelik'))),
          yuzolcumu: metin(yoldanAl(ham, ortam('IMAR_TAKBIS_ALAN_YUZOLCUMU', 'yuzolcumu'))),
          takyidat: metin(yoldanAl(ham, ortam('IMAR_TAKBIS_ALAN_TAKYIDAT', 'takyidat'))),
        },
      };
    },
  };
}

function httpMuteahhit(): KurumSaglayici {
  return {
    ad: 'http/yambis',
    async muteahhitSorgula(g) {
      const ham = await httpIstek('IMAR_YAMBIS', g);
      return {
        ham,
        veri: {
          bulundu: Boolean(yoldanAl(ham, ortam('IMAR_YAMBIS_ALAN_UNVAN', 'unvan'))),
          unvan: metin(yoldanAl(ham, ortam('IMAR_YAMBIS_ALAN_UNVAN', 'unvan'))),
          yetkiBelgeNo: metin(yoldanAl(ham, ortam('IMAR_YAMBIS_ALAN_BELGE_NO', 'yetkiBelgeNo'))),
          gecerlilik: metin(yoldanAl(ham, ortam('IMAR_YAMBIS_ALAN_GECERLILIK', 'gecerlilikTarihi'))),
          durum: metin(yoldanAl(ham, ortam('IMAR_YAMBIS_ALAN_DURUM', 'durum'))),
          sinif: metin(yoldanAl(ham, ortam('IMAR_YAMBIS_ALAN_SINIF', 'grup'))),
        },
      };
    },
  };
}

/**
 * Gerçek servis yokken boru hattını çalıştırmak için örnek veri üretir.
 * Ada/parsel eşleşmesini denemek üzere girdiyi yansıtır; "999" parseli
 * bulunamadı, "888" ise farklı malik döndürür.
 */
function denemeSaglayici(): KurumSaglayici {
  return {
    ad: 'deneme',
    async tapuSorgula(g) {
      if (g.parsel === '999') return { ham: { sonuc: 'kayit-yok' }, veri: { bulundu: false, malikler: [] } };
      const malik = g.parsel === '888' ? 'Başka Bir Kişi' : 'Mehmet Yılmaz';
      const ham = {
        ada: g.ada,
        parsel: g.parsel,
        mahalle: g.mahalle,
        malikler: [{ adSoyad: malik, hisse: '1/1' }],
        nitelik: 'Arsa',
        yuzolcumu: '480 m²',
        takyidat: g.parsel === '777' ? 'İpotek kaydı var' : '',
      };
      return {
        ham,
        veri: {
          bulundu: true,
          malikler: [malik],
          ada: g.ada,
          parsel: g.parsel,
          mahalle: g.mahalle,
          nitelik: 'Arsa',
          yuzolcumu: '480 m²',
          takyidat: ham.takyidat,
        },
      };
    },
    async muteahhitSorgula(g) {
      if (!g.belgeNo) return { ham: {}, veri: { bulundu: false } };
      // Sonu 0 ile biten belge numaraları süresi geçmiş kabul edilir.
      const gecmis = g.belgeNo.endsWith('0');
      const ham = {
        unvan: 'Örnek İnşaat San. Tic. Ltd. Şti.',
        yetkiBelgeNo: g.belgeNo,
        gecerlilikTarihi: gecmis ? '2024-12-31' : '2027-12-31',
        durum: gecmis ? 'Süresi dolmuş' : 'Faal',
        grup: 'B',
      };
      return {
        ham,
        veri: {
          bulundu: true,
          unvan: ham.unvan,
          yetkiBelgeNo: ham.yetkiBelgeNo,
          gecerlilik: ham.gecerlilikTarihi,
          durum: ham.durum,
          sinif: ham.grup,
        },
      };
    },
  };
}

export function saglayiciSec(tur: SorguTuru): KurumSaglayici | null {
  const ayar = tur === 'takbis' ? AYAR.takbis : AYAR.yambis;
  switch (ayar) {
    case 'deneme':
      return denemeSaglayici();
    case 'http':
      return tur === 'takbis' ? httpTapu() : httpMuteahhit();
    default:
      return null;
  }
}

export const kurumDurumu = (): Record<SorguTuru, string> => ({
  takbis: AYAR.takbis,
  yambis: AYAR.yambis,
});
