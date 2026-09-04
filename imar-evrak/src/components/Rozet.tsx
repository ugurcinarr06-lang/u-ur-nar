import { durumAdi, durumRengi } from '../data';
import type { Durum } from '../types';

export function DurumRozeti({ durum }: { durum: Durum }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${durumRengi(durum)}`}
    >
      {durumAdi(durum)}
    </span>
  );
}

export function GecikmeRozeti({ kalan }: { kalan: number }) {
  if (kalan < 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-rose-600 px-2.5 py-0.5 text-xs font-semibold text-white">
        {Math.abs(kalan)} gün gecikme
      </span>
    );
  }
  const acil = kalan <= 3;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
        acil
          ? 'bg-amber-100 text-amber-800 ring-amber-300'
          : 'bg-slate-100 text-slate-600 ring-slate-300'
      }`}
    >
      {kalan} gün kaldı
    </span>
  );
}
