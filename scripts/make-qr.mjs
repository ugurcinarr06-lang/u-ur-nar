// Uygulamanın canlı adresi için kurulum QR kodu üretir.
// Kullanım:  node scripts/make-qr.mjs https://<proje>.vercel.app
import QRCode from 'qrcode';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const url = process.argv[2];
if (!url || !/^https?:\/\//.test(url)) {
  console.error('Hata: Geçerli bir URL verin.');
  console.error('Örnek: node scripts/make-qr.mjs https://canli-ceviri.vercel.app');
  process.exit(1);
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'install-qr.png');

// Terminalde ASCII önizleme
const ascii = await QRCode.toString(url, { type: 'terminal', small: true });
console.log(ascii);

// Paylaşılabilir PNG dosyası
await QRCode.toFile(out, url, {
  width: 720,
  margin: 2,
  color: { dark: '#0284c7', light: '#ffffff' },
});

console.log(`QR kodu oluşturuldu: ${out}`);
console.log(`URL: ${url}`);
