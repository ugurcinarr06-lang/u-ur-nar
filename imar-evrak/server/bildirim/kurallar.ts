import { belgeListesi } from '../../src/belgeler.js';
import { HATIRLATMA_GUNU as GORUS_HATIRLATMA_GUNU } from '../../src/gorus.js';
import type { Durum, Tur } from '../../src/types.js';
import { db } from '../db.js';
import { bildirimEkle } from './kuyruk.js';

interface EvrakOzet {
  id: string;
  no: string;
  konu: string;
  tur: string;
  durum: string;
  gelis_tarihi: string;
  hedef_gun: number;
  sorumlu: string;
  basvuran_ad: string;
  basvuran_telefon: string;
  takip_kodu: string;
}

const KAPALI: Durum[] = ['onaylandi', 'reddedildi', 'arsiv'];

const gunFarki = (tarih: string): number =>
  Math.round((Date.now() - new Date(`${tarih}T00:00:00`).getTime()) / 86_400_000);

const gunAnahtari = (): string => new Date().toISOString().slice(0, 10);

/** Haftalık özet anahtarı için içinde bulunduğumuz haftanın pazartesisi. */
function haftaBasi(): string {
  const d = new Date();
  const gun = (d.getDay() + 6) % 7; // pazartesi = 0
  d.setDate(d.getDate() - gun);
  return d.toISOString().slice(0, 10);
}

const personelEpostasi = (ad: string): string =>
  (
    (db.prepare('SELECT eposta FROM kullanicilar WHERE ad = ?').get(ad) as
      | { eposta: string }
      | undefined) ?? { eposta: '' }
  ).eposta;

const mudurEpostalari = (): string[] =>
  (
    db.prepare("SELECT eposta FROM kullanicilar WHERE rol = 'mudur' AND eposta <> ''").all() as {
      eposta: string;
    }[]
  ).map((k) => k.eposta);

const acikEvraklar = (): EvrakOzet[] =>
  db
    .prepare(
      `SELECT id, no, konu, tur, durum, gelis_tarihi, hedef_gun, sorumlu,
              basvuran_ad, basvuran_telefon, takip_kodu
         FROM evraklar WHERE durum NOT IN ('onaylandi','reddedildi','arsiv')`,
    )
    .all() as EvrakOzet[];

/**
 * Süreye bağlı hatırlatmaları üretir: hedefe 3 gün kalanlar ve süresi
 * aşılanlar. Aynı evrak için gün/hafta başına tek mesaj gider.
 */
export function sureHatirlatmalari(): number {
  let uretilen = 0;

  for (const e of acikEvraklar()) {
    const kalan = e.hedef_gun - gunFarki(e.gelis_tarihi);
    const eposta = personelEpostasi(e.sorumlu);

    if (kalan >= 0 && kalan <= 3 && eposta) {
      const eklendi = bildirimEkle({
        anahtar: `yaklasan:${e.id}:${gunAnahtari()}`,
        evrakId: e.id,
        tur: 'yaklasan',
        kanal: 'eposta',
        hedef: eposta,
        konu: `Süre doluyor: ${e.no} (${kalan} gün kaldı)`,
        govde:
          `${e.no} sayılı "${e.konu}" başvurusunun hedef süresine ${kalan} gün kaldı.\n` +
          `Başvuru tarihi: ${e.gelis_tarihi} · Hedef süre: ${e.hedef_gun} gün\n` +
          `Sorumlu: ${e.sorumlu}`,
      });
      if (eklendi) uretilen++;
    }

    if (kalan < 0) {
      // Gecikmede haftada bir hatırlatılır; her gün mesaj yığılmasın.
      const hedefler = [eposta, ...mudurEpostalari()].filter(Boolean);
      for (const hedef of new Set(hedefler)) {
        const eklendi = bildirimEkle({
          anahtar: `gecikme:${e.id}:${haftaBasi()}:${hedef}`,
          evrakId: e.id,
          tur: 'gecikme',
          kanal: 'eposta',
          hedef,
          konu: `Süre aşıldı: ${e.no} (${Math.abs(kalan)} gün)`,
          govde:
            `${e.no} sayılı "${e.konu}" başvurusunda hedef süre ${Math.abs(kalan)} gün aşıldı.\n` +
            `Başvuru tarihi: ${e.gelis_tarihi} · Sorumlu: ${e.sorumlu || 'atanmamış'}`,
        });
        if (eklendi) uretilen++;
      }
    }
  }
  return uretilen;
}

/**
 * Cevabı gecikmiş kurum görüşleri. Dosya, başka kurumun cevabını beklerken
 * unutulmasın diye sorumluya haftada bir hatırlatılır.
 */
export function gorusHatirlatmalari(): number {
  const satirlar = db
    .prepare(
      `SELECT g.id, g.kurum, g.gonderim_tarihi, g.sayi, e.id AS evrak_id, e.no, e.konu, e.sorumlu
         FROM gorusler g JOIN evraklar e ON e.id = g.evrak_id
        WHERE g.durum = 'gonderildi' AND g.gonderim_tarihi <> ''
          AND e.durum NOT IN ('onaylandi','reddedildi','arsiv')`,
    )
    .all() as {
    id: string;
    kurum: string;
    gonderim_tarihi: string;
    sayi: string;
    evrak_id: string;
    no: string;
    konu: string;
    sorumlu: string;
  }[];

  let uretilen = 0;
  for (const g of satirlar) {
    const bekleyen = gunFarki(g.gonderim_tarihi);
    if (bekleyen < GORUS_HATIRLATMA_GUNU) continue;
    const eposta = personelEpostasi(g.sorumlu);
    if (!eposta) continue;

    const eklendi = bildirimEkle({
      anahtar: `gorus:${g.id}:${haftaBasi()}`,
      evrakId: g.evrak_id,
      tur: 'gorus',
      kanal: 'eposta',
      hedef: eposta,
      konu: `Kurum görüşü bekliyor: ${g.kurum} (${bekleyen} gün)`,
      govde:
        `${g.no} sayılı "${g.konu}" dosyasında ${g.kurum} görüşü ${bekleyen} gündür bekliyor.\n` +
        `Yazının çıkış tarihi: ${g.gonderim_tarihi}${g.sayi ? ` · Sayı: ${g.sayi}` : ''}\n` +
        'Kurumla yazışmayı tekrarlamak gerekebilir.',
    });
    if (eklendi) uretilen++;
  }
  return uretilen;
}

/** Müdürlere haftalık özet (pazartesi sabahı). */
export function haftalikOzet(): number {
  const hedefler = mudurEpostalari();
  if (hedefler.length === 0) return 0;

  const acik = acikEvraklar();
  const geciken = acik.filter((e) => e.hedef_gun - gunFarki(e.gelis_tarihi) < 0);
  const eksik = acik.filter((e) => e.durum === 'eksik');

  const satirlar = geciken
    .map((e) => `  - ${e.no} · ${e.konu} · ${Math.abs(e.hedef_gun - gunFarki(e.gelis_tarihi))} gün gecikme · ${e.sorumlu || 'sorumlu atanmamış'}`)
    .join('\n');

  let uretilen = 0;
  for (const hedef of hedefler) {
    const eklendi = bildirimEkle({
      anahtar: `haftalik:${haftaBasi()}:${hedef}`,
      tur: 'haftalik',
      kanal: 'eposta',
      hedef,
      konu: `İmar evrak haftalık özet — ${geciken.length} geciken dosya`,
      govde:
        `Açık dosya: ${acik.length}\nEksik belge bekleyen: ${eksik.length}\n` +
        `Süresi aşılan: ${geciken.length}\n\n` +
        (satirlar ? `Geciken dosyalar:\n${satirlar}\n` : 'Geciken dosya yok.\n'),
    });
    if (eklendi) uretilen++;
  }
  return uretilen;
}

/**
 * Durum değişince vatandaşa bilgi verir. Mesaj kısadır ve kişisel veri
 * taşımaz; ayrıntı takip sayfasındadır.
 */
export function vatandasaBildir(evrakId: string, yeniDurum: Durum, takipAdresi: string): void {
  const e = db
    .prepare(
      `SELECT id, no, konu, tur, durum, gelis_tarihi, hedef_gun, sorumlu,
              basvuran_ad, basvuran_telefon, takip_kodu FROM evraklar WHERE id = ?`,
    )
    .get(evrakId) as EvrakOzet | undefined;
  if (!e || !e.basvuran_telefon.trim()) return;

  if (yeniDurum === 'eksik') {
    const tanimlar = belgeListesi(e.tur as Tur).filter((b) => b.zorunlu);
    const teslimler = db
      .prepare('SELECT kod FROM belgeler WHERE evrak_id = ? AND teslim = 1')
      .all(e.id) as { kod: string }[];
    const teslimKodlari = new Set(teslimler.map((t) => t.kod));
    const eksikler = tanimlar.filter((t) => !teslimKodlari.has(t.kod));

    bildirimEkle({
      anahtar: `eksik:${e.id}:${gunAnahtari()}`,
      evrakId: e.id,
      tur: 'eksik',
      kanal: 'sms',
      hedef: e.basvuran_telefon,
      konu: 'Eksik belge',
      govde:
        `${e.no} sayili basvurunuzda ${eksikler.length} eksik belge bulunmaktadir. ` +
        `Ayrinti icin: ${takipAdresi} Takip kodu: ${e.takip_kodu}`,
    });
    return;
  }

  if (KAPALI.includes(yeniDurum) && yeniDurum !== 'arsiv') {
    bildirimEkle({
      anahtar: `sonuc:${e.id}:${yeniDurum}`,
      evrakId: e.id,
      tur: 'sonuc',
      kanal: 'sms',
      hedef: e.basvuran_telefon,
      konu: 'Başvuru sonucu',
      govde:
        `${e.no} sayili basvurunuz ${yeniDurum === 'onaylandi' ? 'onaylanmistir' : 'reddedilmistir'}. ` +
        `Ayrinti icin: ${takipAdresi} Takip kodu: ${e.takip_kodu}`,
    });
  }
}

/** Zamana bağlı tüm kuralları çalıştırır. */
export function kurallariTara(): number {
  let uretilen = sureHatirlatmalari() + gorusHatirlatmalari();
  const simdi = new Date();
  // Haftalık özet pazartesi 08:00'den sonra bir kez üretilir.
  if (simdi.getDay() === 1 && simdi.getHours() >= 8) uretilen += haftalikOzet();
  return uretilen;
}
