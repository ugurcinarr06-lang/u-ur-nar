/**
 * Şifre sıfırlama — sunucuya erişimi olan yönetici içindir.
 *
 *   npm run sifre-sifirla                      → kullanıcıları listeler
 *   npm run sifre-sifirla -- admin             → rastgele şifre üretir
 *   npm run sifre-sifirla -- admin YeniSifre1  → verilen şifreyi atar
 *
 * Bu betiği çalıştırabilen kişi zaten veritabanı dosyasını okuyabilir;
 * ek bir yetki açığı yaratmaz. Sıfırlanan hesabın açık oturumları kapatılır.
 */
import { randomBytes } from 'node:crypto';
import { sifreOzeti } from '../server/auth.js';
import { db } from '../server/db.js';

interface Kullanici {
  id: string;
  kullanici_adi: string;
  ad: string;
  rol: string;
}

const kullanicilar = db
  .prepare('SELECT id, kullanici_adi, ad, rol FROM kullanicilar ORDER BY rol, ad')
  .all() as Kullanici[];

if (kullanicilar.length === 0) {
  console.error('Veritabanında hiç kullanıcı yok. Sunucuyu bir kez başlatın;');
  console.error('ilk açılışta "admin" hesabı oluşturulur ve şifresi konsola yazılır.');
  process.exit(1);
}

const hedefAdi = process.argv[2];

if (!hedefAdi) {
  console.log('Kayıtlı kullanıcılar:\n');
  for (const k of kullanicilar) {
    console.log(`  ${k.kullanici_adi.padEnd(16)} ${k.ad.padEnd(24)} ${k.rol}`);
  }
  console.log('\nŞifre sıfırlamak için: npm run sifre-sifirla -- <kullanıcı-adı> [yeni-şifre]');
  process.exit(0);
}

const hedef = kullanicilar.find((k) => k.kullanici_adi === hedefAdi);
if (!hedef) {
  console.error(`"${hedefAdi}" adlı kullanıcı yok. Listeyi görmek için argümansız çalıştırın.`);
  process.exit(1);
}

const verilen = process.argv[3];
if (verilen && verilen.length < 6) {
  console.error('Şifre en az 6 karakter olmalı.');
  process.exit(1);
}
// Rastgele şifre: okunması kolay olsun diye karışan harfler yok.
const yeniSifre =
  verilen ??
  [...randomBytes(9)].map((b) => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 32]).join('');

db.prepare('UPDATE kullanicilar SET sifre_hash = ? WHERE id = ?').run(
  sifreOzeti(yeniSifre),
  hedef.id,
);
// Eski oturumlar düşsün: şifreyi bilmeyen biri açık oturumla devam etmesin.
const dusen = db.prepare('DELETE FROM oturumlar WHERE kullanici_id = ?').run(hedef.id);

console.log('─'.repeat(58));
console.log(`Şifre değiştirildi: ${hedef.ad} (${hedef.kullanici_adi}, ${hedef.rol})`);
console.log(`  Yeni şifre : ${yeniSifre}`);
console.log(`  Kapatılan açık oturum: ${dusen.changes}`);
console.log('  Girdikten sonra Hesap → Şifremi değiştir ile kendi şifrenizi koyun.');
console.log('─'.repeat(58));
