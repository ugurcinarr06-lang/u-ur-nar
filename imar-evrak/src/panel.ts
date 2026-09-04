import { DURUMLAR, KAPALI_DURUMLAR, TURLER, durumAdi, turAdi } from './data';
import { bekleyenGun, bekliyorMu, type Gorus } from './gorus';
import { hazirlikDurumu } from './hazirlik';
import type { Durum, Evrak, Tur } from './types';
import { gecikmisMi, kalanGun } from './utils';

/**
 * Gösterge panelinin hesapları. Amaç, müdürün ve memurun ekranı açtığında
 * "bugün neye bakmalıyım" sorusunu okumadan görmesi.
 */

export interface AylikSatir {
  /** "2026-09" */
  ay: string;
  ad: string;
  gelen: number;
  sonuclanan: number;
}

export interface PersonelSatiri {
  ad: string;
  acik: number;
  geciken: number;
}

export interface AcilSatir {
  evrak: Evrak;
  kalan: number;
  /** Kısa gerekçe: "3 eksik belge", "karara hazır"… */
  neden: string;
}

export interface GorusSatiri {
  evrak: Evrak;
  gorus: Gorus;
  gun: number;
}

export interface PanelVerisi {
  toplam: number;
  acik: number;
  eksik: number;
  geciken: number;
  kararaHazir: number;
  gorusBekleyen: number;
  odenmemisHarc: number;
  odenmemisTutar: number;
  buAyGelen: number;
  buAySonuclanan: number;
  /** Sonuçlanmış dosyaların ortalama işlem süresi (gün); yoksa null. */
  ortalamaGun: number | null;
  /** Hedef süresi içinde sonuçlanan dosyaların oranı (%); yoksa null. */
  zamanindaOran: number | null;
  durumDagilimi: { durum: Durum; ad: string; sayi: number; nokta: string }[];
  turDagilimi: { tur: Tur; ad: string; sayi: number }[];
  aylik: AylikSatir[];
  personel: PersonelSatiri[];
  acilDosyalar: AcilSatir[];
  gorusler: GorusSatiri[];
}

const AY_ADLARI = [
  'Oca',
  'Şub',
  'Mar',
  'Nis',
  'May',
  'Haz',
  'Tem',
  'Ağu',
  'Eyl',
  'Eki',
  'Kas',
  'Ara',
];

/** Kapanmış bir dosyanın sonuçlanma tarihi: son kapalı-durum işleminin tarihi. */
function sonuclanmaTarihi(e: Evrak): string | null {
  if (!KAPALI_DURUMLAR.includes(e.durum)) return null;
  const islem = [...e.gecmis].reverse().find((i) => KAPALI_DURUMLAR.includes(i.durum));
  return (islem?.tarih ?? '').slice(0, 10) || null;
}

const gunFarki = (baslangic: string, bitis: string): number =>
  Math.round(
    (new Date(`${bitis}T00:00:00`).getTime() - new Date(`${baslangic}T00:00:00`).getTime()) /
      86_400_000,
  );

/** Bir dosyanın "neden acil" gerekçesi. */
function acilNedeni(e: Evrak): string {
  const h = hazirlikDurumu(e);
  if (h.uygunsuzlar.length + h.engeller.length > 0) {
    return `${h.uygunsuzlar.length + h.engeller.length} engel`;
  }
  if (h.eksikler.length > 0) return `${h.eksikler.length} eksik belge`;
  const bekleyenGorus = e.gorusler.filter(bekliyorMu).length;
  if (bekleyenGorus > 0) return `${bekleyenGorus} kurum görüşü bekleniyor`;
  if (h.bekleyenKararlar.length > 0) return `${h.bekleyenKararlar.length} belge karar bekliyor`;
  if (h.hazir) return 'Karara hazır';
  return 'İşlemde';
}

export function panelVerisi(evraklar: Evrak[], bugun = new Date()): PanelVerisi {
  const bugunIso = bugun.toISOString().slice(0, 10);
  const acikOlanlar = evraklar.filter((e) => !KAPALI_DURUMLAR.includes(e.durum));

  // Son altı ayın akışı — panelde çubuk grafik olarak çizilir.
  const aylik: AylikSatir[] = [];
  for (let geri = 5; geri >= 0; geri--) {
    const d = new Date(bugun.getFullYear(), bugun.getMonth() - geri, 1);
    const ay = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    aylik.push({
      ay,
      ad: AY_ADLARI[d.getMonth()],
      gelen: evraklar.filter((e) => e.gelisTarihi.startsWith(ay)).length,
      sonuclanan: evraklar.filter((e) => (sonuclanmaTarihi(e) ?? '').startsWith(ay)).length,
    });
  }

  const sureler = evraklar
    .map((e) => {
      const bitis = sonuclanmaTarihi(e);
      return bitis ? { gun: gunFarki(e.gelisTarihi, bitis), hedef: e.hedefGun } : null;
    })
    .filter((s): s is { gun: number; hedef: number } => s !== null && s.gun >= 0);

  const personelHaritasi = new Map<string, PersonelSatiri>();
  for (const e of acikOlanlar) {
    const ad = e.sorumlu.trim() || 'Atanmamış';
    const satir = personelHaritasi.get(ad) ?? { ad, acik: 0, geciken: 0 };
    satir.acik += 1;
    if (gecikmisMi(e)) satir.geciken += 1;
    personelHaritasi.set(ad, satir);
  }

  const gorusler: GorusSatiri[] = acikOlanlar
    .flatMap((e) =>
      e.gorusler.filter(bekliyorMu).map((g) => ({ evrak: e, gorus: g, gun: bekleyenGun(g, bugunIso) ?? 0 })),
    )
    .sort((a, b) => b.gun - a.gun);

  const odenmemis = evraklar.filter((e) => e.tahakkuk && !e.tahakkuk.makbuzNo);

  const acilDosyalar: AcilSatir[] = acikOlanlar
    .map((e) => ({ evrak: e, kalan: kalanGun(e), neden: acilNedeni(e) }))
    .sort((a, b) => a.kalan - b.kalan)
    .slice(0, 6);

  const buAy = bugunIso.slice(0, 7);

  return {
    toplam: evraklar.length,
    acik: acikOlanlar.length,
    eksik: evraklar.filter((e) => e.durum === 'eksik').length,
    geciken: evraklar.filter(gecikmisMi).length,
    kararaHazir: acikOlanlar.filter((e) => hazirlikDurumu(e).hazir).length,
    gorusBekleyen: gorusler.length,
    odenmemisHarc: odenmemis.length,
    odenmemisTutar: odenmemis.reduce((t, e) => t + (e.tahakkuk?.toplam ?? 0), 0),
    buAyGelen: evraklar.filter((e) => e.gelisTarihi.startsWith(buAy)).length,
    buAySonuclanan: evraklar.filter((e) => (sonuclanmaTarihi(e) ?? '').startsWith(buAy)).length,
    ortalamaGun: sureler.length
      ? Math.round(sureler.reduce((t, s) => t + s.gun, 0) / sureler.length)
      : null,
    zamanindaOran: sureler.length
      ? Math.round((sureler.filter((s) => s.gun <= s.hedef).length / sureler.length) * 100)
      : null,
    durumDagilimi: DURUMLAR.map((d) => ({
      durum: d.deger,
      ad: durumAdi(d.deger),
      sayi: evraklar.filter((e) => e.durum === d.deger).length,
      nokta: d.nokta,
    })).filter((d) => d.sayi > 0),
    turDagilimi: TURLER.map((t) => ({
      tur: t.deger,
      ad: turAdi(t.deger),
      sayi: evraklar.filter((e) => e.tur === t.deger).length,
    }))
      .filter((t) => t.sayi > 0)
      .sort((a, b) => b.sayi - a.sayi),
    aylik,
    personel: [...personelHaritasi.values()].sort((a, b) => b.acik - a.acik),
    acilDosyalar,
    gorusler: gorusler.slice(0, 5),
  };
}
