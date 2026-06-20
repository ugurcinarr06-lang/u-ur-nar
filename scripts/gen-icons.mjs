// PWA ikonlarını public/icon-source.svg dosyasından üretir.
// Çalıştırma: node scripts/gen-icons.mjs
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(root, 'public', 'icon-source.svg'));
const pub = join(root, 'public');

const targets = [
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'maskable-512x512.png', size: 512 },
  { name: 'apple-touch-icon-180x180.png', size: 180 },
  { name: 'favicon-32x32.png', size: 32 },
];

for (const t of targets) {
  await sharp(src, { density: 384 })
    .resize(t.size, t.size)
    .png()
    .toFile(join(pub, t.name));
  console.log('✓', t.name);
}
console.log('İkonlar üretildi.');
