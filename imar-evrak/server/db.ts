import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { sifreOzeti } from './auth.js';

/**
 * Tüm kayıtlar tek bir SQLite dosyasında tutulur. Yedekleme = bu dosyayı
 * kopyalamak. Yol IMAR_DB ile değiştirilebilir (ör. ağ sürücüsü).
 */
const DOSYA = resolve(process.env.IMAR_DB ?? 'veri/imar-evrak.db');
mkdirSync(dirname(DOSYA), { recursive: true });

/** Evrak ekleri veritabanının yanındaki "ekler" klasöründe tutulur. */
export const EKLER_KLASORU = resolve(dirname(DOSYA), 'ekler');
mkdirSync(EKLER_KLASORU, { recursive: true });

export const db = new Database(DOSYA);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS kullanicilar (
    id           TEXT PRIMARY KEY,
    kullanici_adi TEXT NOT NULL UNIQUE,
    ad           TEXT NOT NULL,
    rol          TEXT NOT NULL CHECK (rol IN ('mudur', 'memur')),
    sifre_hash   TEXT NOT NULL,
    olusturma    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS oturumlar (
    token        TEXT PRIMARY KEY,
    kullanici_id TEXT NOT NULL REFERENCES kullanicilar(id) ON DELETE CASCADE,
    bitis        TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS evraklar (
    id                TEXT PRIMARY KEY,
    no                TEXT NOT NULL UNIQUE,
    konu              TEXT NOT NULL,
    tur               TEXT NOT NULL,
    durum             TEXT NOT NULL,
    gelis_tarihi      TEXT NOT NULL,
    hedef_gun         INTEGER NOT NULL,
    basvuran_ad       TEXT NOT NULL DEFAULT '',
    basvuran_telefon  TEXT NOT NULL DEFAULT '',
    mahalle           TEXT NOT NULL DEFAULT '',
    ada               TEXT NOT NULL DEFAULT '',
    parsel            TEXT NOT NULL DEFAULT '',
    pafta             TEXT NOT NULL DEFAULT '',
    sorumlu           TEXT NOT NULL DEFAULT '',
    aciklama          TEXT NOT NULL DEFAULT '',
    olusturma         TEXT NOT NULL,
    guncelleme        TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS islemler (
    id        TEXT PRIMARY KEY,
    evrak_id  TEXT NOT NULL REFERENCES evraklar(id) ON DELETE CASCADE,
    tarih     TEXT NOT NULL,
    durum     TEXT NOT NULL,
    aciklama  TEXT NOT NULL DEFAULT '',
    kullanici TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS ekler (
    id        TEXT PRIMARY KEY,
    evrak_id  TEXT NOT NULL REFERENCES evraklar(id) ON DELETE CASCADE,
    ad        TEXT NOT NULL,
    dosya     TEXT NOT NULL,
    tur       TEXT NOT NULL DEFAULT '',
    boyut     INTEGER NOT NULL,
    yukleyen  TEXT NOT NULL,
    tarih     TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS ekler_evrak ON ekler(evrak_id, tarih);
  CREATE INDEX IF NOT EXISTS islemler_evrak ON islemler(evrak_id, tarih);
  CREATE INDEX IF NOT EXISTS evraklar_parsel ON evraklar(ada, parsel);
`);

/**
 * İlk çalıştırmada bir müdür hesabı açar. Şifre IMAR_ADMIN_SIFRE ile
 * verilmezse rastgele üretilir ve konsola bir kez yazılır.
 */
export function ilkKurulum(): void {
  const sayi = db.prepare('SELECT COUNT(*) AS n FROM kullanicilar').get() as { n: number };
  if (sayi.n > 0) return;

  const sifre = process.env.IMAR_ADMIN_SIFRE || crypto.randomUUID().slice(0, 12);
  db.prepare(
    `INSERT INTO kullanicilar (id, kullanici_adi, ad, rol, sifre_hash, olusturma)
     VALUES (?, 'admin', 'Sistem Yöneticisi', 'mudur', ?, ?)`,
  ).run(crypto.randomUUID(), sifreOzeti(sifre), new Date().toISOString());

  console.log('─'.repeat(58));
  console.log('İlk kurulum: yönetici hesabı oluşturuldu');
  console.log('  Kullanıcı adı : admin');
  console.log(`  Şifre         : ${sifre}`);
  console.log('  Giriş yaptıktan sonra şifreyi değiştirin.');
  console.log('─'.repeat(58));
}

/** Süresi dolmuş oturumları temizler. */
export function oturumTemizle(): void {
  db.prepare('DELETE FROM oturumlar WHERE bitis < ?').run(new Date().toISOString());
}
