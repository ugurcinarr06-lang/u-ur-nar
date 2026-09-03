/**
 * Kurum görüşü takibi.
 *
 * İmar dosyalarının çoğu, başka bir kurumun görüşü beklenirken durur
 * (DSİ, Karayolları, TEDAŞ, Koruma Kurulu…). Bu bölüm "hangi kuruma ne zaman
 * yazıldı, kaç gündür bekliyor, cevap ne oldu" sorusunu dosyanın içinde
 * yanıtlar; bekleyen görüşler için de hatırlatma üretilir.
 */

export type GorusDurumu = 'hazirlaniyor' | 'gonderildi' | 'olumlu' | 'olumsuz' | 'iptal';

export interface Gorus {
  id: string;
  /** Görüş sorulan kurum. */
  kurum: string;
  konu: string;
  durum: GorusDurumu;
  /** Yazının çıkış tarihi (YYYY-MM-DD). */
  gonderimTarihi: string;
  /** Cevabın geliş tarihi. */
  cevapTarihi: string;
  /** Giden yazının sayısı. */
  sayi: string;
  /** Gelen cevabın sayısı. */
  cevapSayisi: string;
  not: string;
  olusturan: string;
  tarih: string;
}

export const GORUS_DURUMLARI: { deger: GorusDurumu; ad: string; renk: string }[] = [
  {
    deger: 'hazirlaniyor',
    ad: 'Yazı hazırlanıyor',
    renk: 'bg-slate-100 text-slate-700 ring-slate-300',
  },
  {
    deger: 'gonderildi',
    ad: 'Cevap bekleniyor',
    renk: 'bg-amber-100 text-amber-800 ring-amber-300',
  },
  { deger: 'olumlu', ad: 'Olumlu görüş', renk: 'bg-emerald-100 text-emerald-800 ring-emerald-300' },
  { deger: 'olumsuz', ad: 'Olumsuz görüş', renk: 'bg-rose-100 text-rose-800 ring-rose-300' },
  { deger: 'iptal', ad: 'Gerek kalmadı', renk: 'bg-slate-200 text-slate-600 ring-slate-300' },
];

export const gorusDurumAdi = (d: GorusDurumu): string =>
  GORUS_DURUMLARI.find((x) => x.deger === d)?.ad ?? d;

export const gorusDurumRengi = (d: GorusDurumu): string =>
  GORUS_DURUMLARI.find((x) => x.deger === d)?.renk ?? 'bg-slate-100 text-slate-700 ring-slate-300';

/** Cevabı beklenen görüşler — süre sayacı bunlar için işler. */
export const BEKLEYEN_DURUMLAR: GorusDurumu[] = ['hazirlaniyor', 'gonderildi'];

export const bekliyorMu = (g: Gorus): boolean => BEKLEYEN_DURUMLAR.includes(g.durum);

/**
 * İmar dosyalarında en sık görüş sorulan kurumlar. Liste sadece öneridir;
 * memur başka bir kurum adını elle yazabilir.
 */
export const KURUMLAR = [
  'DSİ Bölge Müdürlüğü',
  'Karayolları Bölge Müdürlüğü',
  'TEDAŞ / Elektrik Dağıtım A.Ş.',
  'Su ve Kanalizasyon İdaresi',
  'Doğal gaz dağıtım şirketi',
  'İtfaiye Müdürlüğü',
  'İl Sağlık Müdürlüğü',
  'Kültür Varlıklarını Koruma Bölge Kurulu',
  'Çevre, Şehircilik ve İklim Değişikliği İl Müdürlüğü',
  'İl Tarım ve Orman Müdürlüğü',
  'Orman Bölge Müdürlüğü',
  'AFAD / İl Afet ve Acil Durum Müdürlüğü',
  'BOTAŞ',
  'TCDD',
  'Devlet Hava Meydanları İşletmesi',
  'Ulaşım Dairesi Başkanlığı',
  'Büyükşehir Belediyesi İmar Dairesi',
  'Maden ve Petrol İşleri Genel Müdürlüğü',
];

/** Cevap gelmemiş bir görüşün kaç gündür beklediği; gönderilmediyse null. */
export function bekleyenGun(g: Gorus, bugun = new Date().toISOString().slice(0, 10)): number | null {
  if (!bekliyorMu(g) || !g.gonderimTarihi) return null;
  const fark =
    (new Date(`${bugun}T00:00:00`).getTime() -
      new Date(`${g.gonderimTarihi}T00:00:00`).getTime()) /
    86_400_000;
  return Number.isFinite(fark) ? Math.round(fark) : null;
}

/** Bu süreyi aşan cevapsız görüşler için hatırlatma üretilir. */
export const HATIRLATMA_GUNU = 15;

/** Evrakın kurum görüşü özeti: liste ekranındaki rozet ve panel için. */
export function gorusOzeti(gorusler: Gorus[]): {
  bekleyen: number;
  olumsuz: number;
  /** En uzun süredir bekleyen görüşün gün sayısı. */
  enUzunGun: number;
} {
  const bekleyenler = gorusler.filter(bekliyorMu);
  const gunler = bekleyenler.map((g) => bekleyenGun(g) ?? 0);
  return {
    bekleyen: bekleyenler.length,
    olumsuz: gorusler.filter((g) => g.durum === 'olumsuz').length,
    enUzunGun: gunler.length ? Math.max(...gunler) : 0,
  };
}
