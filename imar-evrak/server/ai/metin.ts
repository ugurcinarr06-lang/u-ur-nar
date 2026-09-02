import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';

export interface MetinSonucu {
  metin: string;
  sayfa: number;
  /** PDF'te metin katmanı yoksa belge taranmıştır; OCR gerekir. */
  taranmis: boolean;
  /** PDF içinde imza sözlüğü görülüp görülmediği. */
  eImzali: boolean;
  hata?: string;
}

const BOS: MetinSonucu = { metin: '', sayfa: 0, taranmis: false, eImzali: false };

/**
 * PDF'ten metin çıkarır. pdfjs tarayıcı için yazıldığından Node tarafında
 * "legacy" derlemesi kullanılır ve çalışan (worker) kapatılır.
 */
async function pdfMetni(yol: string): Promise<MetinSonucu> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const veri = new Uint8Array(await readFile(yol));
  const belge = await pdfjs.getDocument({ data: veri, useWorkerFetch: false }).promise;

  const parcalar: string[] = [];
  for (let i = 1; i <= belge.numPages; i++) {
    const sayfa = await belge.getPage(i);
    const icerik = await sayfa.getTextContent();
    parcalar.push(
      icerik.items
        .map((x) => ('str' in x ? x.str : ''))
        .join(' ')
        .replace(/\s+/g, ' '),
    );
  }

  const metin = parcalar.join('\n').trim();
  // İmza alanları belgenin AcroForm sözlüğünde durur.
  let eImzali = false;
  try {
    const alanlar = await belge.getFieldObjects();
    eImzali = Object.values(alanlar ?? {})
      .flat()
      .some((a) => (a as { type?: string }).type === 'signature');
  } catch {
    eImzali = false;
  }

  return {
    metin,
    sayfa: belge.numPages,
    // 30 karakterden az metin: sayfa numarası dışında bir şey yok demektir.
    taranmis: metin.length < 30,
    eImzali,
  };
}

/** Desteklenen dosyalardan düz metin çıkarır; çıkaramazsa boş döner. */
export async function metinCikar(yol: string): Promise<MetinSonucu> {
  const uzanti = extname(yol).toLowerCase();
  try {
    if (uzanti === '.pdf') return await pdfMetni(yol);
    if (uzanti === '.txt') {
      const metin = (await readFile(yol, 'utf8')).trim();
      return { ...BOS, metin, sayfa: 1 };
    }
    // Görseller ve ofis dosyaları: metin katmanı yok, taranmış sayılır.
    return { ...BOS, taranmis: true };
  } catch (hata) {
    return { ...BOS, hata: hata instanceof Error ? hata.message : 'Metin çıkarılamadı.' };
  }
}
