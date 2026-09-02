import type { Durum, Evrak, Tur } from './types';

export const DURUMLAR: { deger: Durum; ad: string; renk: string }[] = [
  { deger: 'yeni', ad: 'Yeni kayıt', renk: 'bg-sky-100 text-sky-800 ring-sky-300' },
  { deger: 'incelemede', ad: 'İncelemede', renk: 'bg-amber-100 text-amber-800 ring-amber-300' },
  { deger: 'eksik', ad: 'Eksik evrak', renk: 'bg-orange-100 text-orange-800 ring-orange-300' },
  { deger: 'onaylandi', ad: 'Onaylandı', renk: 'bg-emerald-100 text-emerald-800 ring-emerald-300' },
  { deger: 'reddedildi', ad: 'Reddedildi', renk: 'bg-rose-100 text-rose-800 ring-rose-300' },
  { deger: 'arsiv', ad: 'Arşiv', renk: 'bg-slate-200 text-slate-700 ring-slate-300' },
];

/** Sonuçlanmış sayılan, süre takibi yapılmayan durumlar. */
export const KAPALI_DURUMLAR: Durum[] = ['onaylandi', 'reddedildi', 'arsiv'];

export const TURLER: { deger: Tur; ad: string; hedefGun: number }[] = [
  { deger: 'ruhsat', ad: 'Yapı ruhsatı başvurusu', hedefGun: 30 },
  { deger: 'iskan', ad: 'Yapı kullanma izni (iskân)', hedefGun: 30 },
  { deger: 'imar-durumu', ad: 'İmar durumu belgesi', hedefGun: 15 },
  { deger: 'kot-kesit', ad: 'Kot–kesit belgesi', hedefGun: 15 },
  { deger: 'aplikasyon', ad: 'Aplikasyon / röperli kroki', hedefGun: 15 },
  { deger: 'yapi-kayit', ad: 'Yapı kayıt belgesi', hedefGun: 30 },
  { deger: 'sikayet', ad: 'Şikâyet / ihbar', hedefGun: 10 },
  { deger: 'diger', ad: 'Diğer', hedefGun: 30 },
];

export const durumAdi = (d: Durum): string =>
  DURUMLAR.find((x) => x.deger === d)?.ad ?? d;

export const durumRengi = (d: Durum): string =>
  DURUMLAR.find((x) => x.deger === d)?.renk ?? 'bg-slate-100 text-slate-700 ring-slate-300';

export const turAdi = (t: Tur): string => TURLER.find((x) => x.deger === t)?.ad ?? t;

export const turHedefGun = (t: Tur): number =>
  TURLER.find((x) => x.deger === t)?.hedefGun ?? 30;

/** İlk açılışta gösterilen örnek kayıtlar; kullanıcı silebilir. */
export function ornekVeri(): Evrak[] {
  const gun = (geriGun: number): string => {
    const d = new Date();
    d.setDate(d.getDate() - geriGun);
    return d.toISOString().slice(0, 10);
  };

  const kayit = (
    e: Omit<Evrak, 'gecmis'> & { gecmis?: Evrak['gecmis'] },
  ): Evrak => ({
    ...e,
    gecmis: e.gecmis ?? [
      {
        id: `${e.id}-1`,
        tarih: `${e.gelisTarihi}T09:00:00.000Z`,
        durum: 'yeni',
        not: 'Evrak kaydı açıldı.',
        kullanici: 'Kayıt Bürosu',
      },
    ],
  });

  return [
    kayit({
      id: 'ornek-1',
      no: '2026/0041',
      konu: '3 katlı betonarme konut için yapı ruhsatı',
      tur: 'ruhsat',
      durum: 'incelemede',
      gelisTarihi: gun(12),
      hedefGun: 30,
      basvuran: { ad: 'Mehmet Yılmaz', telefon: '0532 000 00 01' },
      tasinmaz: { mahalle: 'Cumhuriyet', ada: '412', parsel: '7', pafta: 'K23-b-04' },
      sorumlu: 'A. Demir',
      aciklama: 'Mimari, statik ve tesisat projeleri teslim edildi. Statik hesap kontrolü sürüyor.',
    }),
    kayit({
      id: 'ornek-2',
      no: '2026/0042',
      konu: 'İmar durumu belgesi talebi',
      tur: 'imar-durumu',
      durum: 'onaylandi',
      gelisTarihi: gun(20),
      hedefGun: 15,
      basvuran: { ad: 'Ayşe Kaya', telefon: '0533 000 00 02' },
      tasinmaz: { mahalle: 'Yeni', ada: '118', parsel: '23', pafta: 'K23-b-01' },
      sorumlu: 'S. Çelik',
      aciklama: 'Ayrık nizam 2 kat, TAKS 0.30 / KAKS 0.60.',
    }),
    kayit({
      id: 'ornek-3',
      no: '2026/0043',
      konu: 'Ruhsatsız kat ilavesi ihbarı',
      tur: 'sikayet',
      durum: 'eksik',
      gelisTarihi: gun(18),
      hedefGun: 10,
      basvuran: { ad: 'İsimsiz ihbar', telefon: '—' },
      tasinmaz: { mahalle: 'Fatih', ada: '905', parsel: '2', pafta: 'K23-c-11' },
      sorumlu: 'A. Demir',
      aciklama: 'Yerinde tespit yapıldı; tutanak ve fotoğraflar dosyaya eklenecek.',
    }),
  ];
}
