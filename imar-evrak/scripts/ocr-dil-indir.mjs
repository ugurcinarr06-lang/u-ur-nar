/**
 * OCR dil verisini indirir (varsayılan: Türkçe).
 *
 *   npm run ocr-kur
 *
 * İnterneti kapalı kurumlarda dosya başka bir makinede indirilip
 * veri/tessdata/ altına elle kopyalanabilir; tek ihtiyaç budur.
 */
import { mkdir, writeFile, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

const DIL = process.env.IMAR_OCR_DIL ?? 'tur';
const HEDEF = resolve(
  process.env.IMAR_OCR_DIL_YOLU ??
    join(dirname(resolve(process.env.IMAR_DB ?? 'veri/imar-evrak.db')), 'tessdata'),
);
const KAYNAK = `https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/main/${DIL}.traineddata`;

const dosya = join(HEDEF, `${DIL}.traineddata`);
const varMi = await stat(dosya).catch(() => null);
if (varMi) {
  console.log(`Zaten kurulu: ${dosya} (${Math.round(varMi.size / 1024)} KB)`);
  process.exit(0);
}

console.log(`İndiriliyor: ${KAYNAK}`);
const yanit = await fetch(KAYNAK);
if (!yanit.ok) {
  console.error(`İndirilemedi (${yanit.status}). Dosyayı elle ${HEDEF} altına kopyalayın.`);
  process.exit(1);
}

await mkdir(HEDEF, { recursive: true });
await writeFile(dosya, Buffer.from(await yanit.arrayBuffer()));
const boyut = (await stat(dosya)).size;
console.log(`Kuruldu: ${dosya} (${Math.round(boyut / 1024)} KB)`);
console.log('Sunucuyu yeniden başlatın; taranmış belgeler artık okunacak.');
