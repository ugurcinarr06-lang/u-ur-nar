import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { EKLER_KLASORU } from '../db.js';

/** Dil verisi buraya konur; kurum ağı kapalıysa dosya elle kopyalanabilir. */
const DIL_YOLU = resolve(process.env.IMAR_OCR_DIL_YOLU ?? join(dirname(EKLER_KLASORU), 'tessdata'));
const DIL = process.env.IMAR_OCR_DIL ?? 'tur';
const AZAMI_SAYFA = Number(process.env.IMAR_OCR_SAYFA ?? 3);
const KAPALI = (process.env.IMAR_OCR ?? '').toLowerCase() === 'kapali';

export const ocrHazirMi = (): boolean =>
  !KAPALI && existsSync(join(DIL_YOLU, `${DIL}.traineddata`));

export const ocrDilYolu = (): string => DIL_YOLU;

type Isci = { recognize: (g: unknown) => Promise<{ data: { text: string } }> };

let isciSozu: Promise<Isci> | null = null;

/** Tesseract işçisi ağır açılır; bir kez açıp yeniden kullanırız. */
async function isciAl(): Promise<Isci> {
  if (!isciSozu) {
    isciSozu = (async () => {
      const { createWorker } = await import('tesseract.js');
      return (await createWorker(DIL, 1, {
        langPath: DIL_YOLU,
        gzip: false,
        logger: () => undefined,
      })) as unknown as Isci;
    })();
  }
  return isciSozu;
}

/** Görüntü dosyasından metin okur. */
export async function goruntuMetni(yol: string): Promise<string> {
  const isci = await isciAl();
  const { data } = await isci.recognize(await readFile(yol));
  return data.text.replace(/\s+/g, ' ').trim();
}

/**
 * Metin katmanı olmayan PDF'in ilk sayfalarını görüntüye çevirip okur.
 * Tüm sayfalar okunmaz: uzun projelerde süre kabul edilemez olurdu.
 */
export async function pdfOcrMetni(yol: string): Promise<string> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const { createCanvas } = await import('@napi-rs/canvas');
  const belge = await pdfjs.getDocument({
    data: new Uint8Array(await readFile(yol)),
    useWorkerFetch: false,
  }).promise;

  const isci = await isciAl();
  const parcalar: string[] = [];
  const sayfaSayisi = Math.min(belge.numPages, AZAMI_SAYFA);

  for (let i = 1; i <= sayfaSayisi; i++) {
    const sayfa = await belge.getPage(i);
    // 2 kat ölçek: tarama kalitesi düşük belgelerde tanımayı belirgin iyileştirir.
    const gorunum = sayfa.getViewport({ scale: 2 });
    const tuval = createCanvas(gorunum.width, gorunum.height);
    await sayfa.render({
      canvasContext: tuval.getContext('2d') as unknown as CanvasRenderingContext2D,
      viewport: gorunum,
      canvas: tuval as unknown as HTMLCanvasElement,
    }).promise;
    const { data } = await isci.recognize(tuval.toBuffer('image/png'));
    parcalar.push(data.text.replace(/\s+/g, ' ').trim());
  }

  const eksikSayfa = belge.numPages - sayfaSayisi;
  return (
    parcalar.join('\n') +
    (eksikSayfa > 0 ? `\n[İlk ${sayfaSayisi} sayfa okundu, ${eksikSayfa} sayfa atlandı.]` : '')
  );
}
