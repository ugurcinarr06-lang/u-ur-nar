/**
 * Veritabanı ve ek dosyalarının yedeğini alır.
 *
 *   npm run yedek                  → veri/yedekler/2026-09-03T0400/
 *   npm run yedek -- /mnt/yedek    → başka bir sürücüye
 *
 * Sunucu ÇALIŞIRKEN güvenlidir: SQLite'ın kendi yedekleme işlevi kullanılır,
 * yarım yazılmış bir dosya kopyalanmaz.
 */
import Database from 'better-sqlite3';
import { cp, mkdir, readdir, rm, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

const DB_YOLU = resolve(process.env.IMAR_DB ?? 'veri/imar-evrak.db');
const VERI_KLASORU = dirname(DB_YOLU);
const HEDEF_KOK = resolve(process.argv[2] ?? join(VERI_KLASORU, 'yedekler'));
/** Kaç yedek saklanacak (eskiler silinir). */
const SAKLANACAK = Number(process.env.IMAR_YEDEK_ADEDI ?? 14);

// 20260903T0350 biçimi: klasörler tarihe göre sıralanır, eskiler silinebilir.
const damga = new Date().toISOString().slice(0, 16).replace(/[-:]/g, '');
const hedef = join(HEDEF_KOK, damga);

const varMi = await stat(DB_YOLU).catch(() => null);
if (!varMi) {
  console.error(`Veritabanı bulunamadı: ${DB_YOLU}`);
  process.exit(1);
}

await mkdir(hedef, { recursive: true });

// 1) Veritabanı — çalışan sunucuyu etkilemeden tutarlı kopya
const db = new Database(DB_YOLU, { readonly: true });
await db.backup(join(hedef, 'imar-evrak.db'));
db.close();

// 2) Ekler ve OCR dil verisi
for (const klasor of ['ekler', 'tessdata']) {
  const kaynak = join(VERI_KLASORU, klasor);
  if (await stat(kaynak).catch(() => null)) {
    await cp(kaynak, join(hedef, klasor), { recursive: true });
  }
}

// 3) Eski yedekleri temizle
const hepsi = (await readdir(HEDEF_KOK)).filter((a) => /^\d{8}T\d{4}$/.test(a)).sort();
for (const eski of hepsi.slice(0, Math.max(0, hepsi.length - SAKLANACAK))) {
  await rm(join(HEDEF_KOK, eski), { recursive: true, force: true });
}

console.log(`Yedek alındı: ${hedef}`);
console.log(`Saklanan yedek sayısı: ${Math.min(hepsi.length, SAKLANACAK)}`);
