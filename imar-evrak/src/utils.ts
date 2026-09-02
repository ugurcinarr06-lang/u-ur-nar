import { KAPALI_DURUMLAR } from './data';
import type { Evrak } from './types';

export const yeniId = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const bugun = (): string => new Date().toISOString().slice(0, 10);

/** "2026-03-04" → "04.03.2026" */
export function tarihGoster(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** "…T09:00:00Z" → "04.03.2026 12:00" */
export function tarihSaatGoster(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** İki tarih arasındaki tam gün sayısı (geçmiş tarih için pozitif). */
export function gunFarki(iso: string, referans = bugun()): number {
  const a = new Date(`${iso.slice(0, 10)}T00:00:00`);
  const b = new Date(`${referans.slice(0, 10)}T00:00:00`);
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/** Evrak açık ve hedef süresi dolmuşsa true. */
export function gecikmisMi(e: Evrak): boolean {
  if (KAPALI_DURUMLAR.includes(e.durum)) return false;
  return gunFarki(e.gelisTarihi) > e.hedefGun;
}

/** Hedef süreye kalan gün; negatifse aşım. */
export const kalanGun = (e: Evrak): number => e.hedefGun - gunFarki(e.gelisTarihi);

/** Yıl bazlı sıradaki evrak numarası: 2026/0044 */
export function sonrakiEvrakNo(evraklar: Evrak[], yil = new Date().getFullYear()): string {
  const onek = `${yil}/`;
  const enBuyuk = evraklar
    .filter((e) => e.no.startsWith(onek))
    .map((e) => Number.parseInt(e.no.slice(onek.length), 10))
    .filter((n) => Number.isFinite(n))
    .reduce((a, b) => Math.max(a, b), 0);
  return `${onek}${String(enBuyuk + 1).padStart(4, '0')}`;
}

/** Excel'in Türkçe yerelinde sorunsuz açılması için ; ayraçlı ve BOM'lu CSV. */
export function csvOlustur(evraklar: Evrak[]): string {
  const basliklar = [
    'Evrak No',
    'Konu',
    'Tür',
    'Durum',
    'Geliş Tarihi',
    'Hedef Gün',
    'Başvuran',
    'Telefon',
    'Mahalle',
    'Ada',
    'Parsel',
    'Pafta',
    'Sorumlu',
    'Açıklama',
  ];
  const alan = (v: string): string => `"${(v ?? '').replace(/"/g, '""')}"`;
  const satirlar = evraklar.map((e) =>
    [
      e.no,
      e.konu,
      e.tur,
      e.durum,
      e.gelisTarihi,
      String(e.hedefGun),
      e.basvuran.ad,
      e.basvuran.telefon,
      e.tasinmaz.mahalle,
      e.tasinmaz.ada,
      e.tasinmaz.parsel,
      e.tasinmaz.pafta,
      e.sorumlu,
      e.aciklama,
    ]
      .map(alan)
      .join(';'),
  );
  return `﻿${basliklar.map(alan).join(';')}\n${satirlar.join('\n')}`;
}

/** Tarayıcıda dosya indirir. */
export function dosyaIndir(adi: string, icerik: string, tip: string): void {
  const url = URL.createObjectURL(new Blob([icerik], { type: tip }));
  const a = document.createElement('a');
  a.href = url;
  a.download = adi;
  a.click();
  URL.revokeObjectURL(url);
}
