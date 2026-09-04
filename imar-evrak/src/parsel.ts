import type { Evrak } from './types';

/** Ada/parsel karşılaştırması için: boşluk ve baştaki sıfırlar önemsiz. */
const sade = (deger: string): string => deger.trim().replace(/^0+(?=\d)/, '').toLocaleLowerCase('tr');

export const parselAnahtari = (e: Evrak): string =>
  `${sade(e.tasinmaz.ada)}/${sade(e.tasinmaz.parsel)}`;

/**
 * Aynı ada/parseldeki diğer evraklar — yeni bir başvuru geldiğinde
 * "bu parselde daha önce ne olmuş" sorusunun yanıtı.
 */
export function ayniParsel(evraklar: Evrak[], evrak: Evrak): Evrak[] {
  if (!evrak.tasinmaz.ada.trim() || !evrak.tasinmaz.parsel.trim()) return [];
  const anahtar = parselAnahtari(evrak);
  return evraklar
    .filter((e) => e.id !== evrak.id && parselAnahtari(e) === anahtar)
    .sort((a, b) => b.gelisTarihi.localeCompare(a.gelisTarihi));
}
