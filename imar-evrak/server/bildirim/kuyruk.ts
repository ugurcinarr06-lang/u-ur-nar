import { db } from '../db.js';
import { yeniId } from '../auth.js';
import { gondericiSec, type Kanal } from './saglayici.js';

export interface BildirimKaydi {
  id: string;
  anahtar: string;
  evrak_id: string | null;
  tur: string;
  kanal: Kanal;
  hedef: string;
  konu: string;
  govde: string;
  durum: 'bekliyor' | 'gonderildi' | 'hata' | 'kanal-kapali';
  hata: string;
  olusturma: string;
  gonderim: string;
}

export interface YeniBildirim {
  /** Aynı bildirimin ikinci kez üretilmesini engelleyen benzersiz anahtar. */
  anahtar: string;
  evrakId?: string;
  tur: string;
  kanal: Kanal;
  hedef: string;
  konu: string;
  govde: string;
}

/**
 * Bildirimi kuyruğa alır. Anahtar daha önce kullanıldıysa hiçbir şey yapmaz —
 * aynı gecikme için her taramada mesaj gitmesin diye.
 */
export function bildirimEkle(b: YeniBildirim): boolean {
  if (!b.hedef.trim()) return false;
  const sonuc = db
    .prepare(
      `INSERT OR IGNORE INTO bildirimler
         (id, anahtar, evrak_id, tur, kanal, hedef, konu, govde, durum, hata, olusturma, gonderim)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'bekliyor', '', ?, '')`,
    )
    .run(
      yeniId(),
      b.anahtar,
      b.evrakId ?? null,
      b.tur,
      b.kanal,
      b.hedef.trim(),
      b.konu,
      b.govde,
      new Date().toISOString(),
    );
  return sonuc.changes > 0;
}

/** Bekleyen bildirimleri sırayla gönderir. */
export async function kuyrugaBak(): Promise<{ gonderildi: number; hata: number }> {
  const bekleyenler = db
    .prepare("SELECT * FROM bildirimler WHERE durum = 'bekliyor' ORDER BY olusturma LIMIT 50")
    .all() as BildirimKaydi[];

  let gonderildi = 0;
  let hata = 0;

  for (const b of bekleyenler) {
    const gonderici = gondericiSec(b.kanal);
    if (!gonderici) {
      // Kanal kapalı: kayıt duruyor, açıldığında elle tekrar denenebilir.
      db.prepare("UPDATE bildirimler SET durum = 'kanal-kapali' WHERE id = ?").run(b.id);
      continue;
    }
    try {
      await gonderici.gonder({ kanal: b.kanal, hedef: b.hedef, konu: b.konu, govde: b.govde });
      db.prepare("UPDATE bildirimler SET durum = 'gonderildi', gonderim = ? WHERE id = ?").run(
        new Date().toISOString(),
        b.id,
      );
      gonderildi++;
    } catch (e) {
      db.prepare("UPDATE bildirimler SET durum = 'hata', hata = ? WHERE id = ?").run(
        e instanceof Error ? e.message : String(e),
        b.id,
      );
      hata++;
    }
  }
  return { gonderildi, hata };
}

/** Gönderilememiş bir bildirimi yeniden kuyruğa alır. */
export function tekrarDene(id: string): boolean {
  const sonuc = db
    .prepare("UPDATE bildirimler SET durum = 'bekliyor', hata = '' WHERE id = ? AND durum <> 'gonderildi'")
    .run(id);
  return sonuc.changes > 0;
}

export const sonBildirimler = (adet = 30): BildirimKaydi[] =>
  db
    .prepare('SELECT * FROM bildirimler ORDER BY olusturma DESC LIMIT ?')
    .all(adet) as BildirimKaydi[];
