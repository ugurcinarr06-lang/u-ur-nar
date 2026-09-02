import { KAPALI_DURUMLAR } from '../data';
import type { Evrak } from '../types';
import { gecikmisMi } from '../utils';

interface Props {
  evraklar: Evrak[];
  /** Karta tıklandığında ilgili filtreye geçilir. */
  onFiltre: (tur: 'hepsi' | 'acik' | 'eksik' | 'geciken') => void;
}

export function Ozet({ evraklar, onFiltre }: Props) {
  const acik = evraklar.filter((e) => !KAPALI_DURUMLAR.includes(e.durum));
  const kartlar = [
    { ad: 'Toplam evrak', sayi: evraklar.length, filtre: 'hepsi' as const, renk: 'text-slate-900' },
    { ad: 'Açık dosya', sayi: acik.length, filtre: 'acik' as const, renk: 'text-sky-700' },
    {
      ad: 'Eksik evrak',
      sayi: evraklar.filter((e) => e.durum === 'eksik').length,
      filtre: 'eksik' as const,
      renk: 'text-orange-700',
    },
    {
      ad: 'Süresi geçen',
      sayi: evraklar.filter(gecikmisMi).length,
      filtre: 'geciken' as const,
      renk: 'text-rose-700',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {kartlar.map((k) => (
        <button
          key={k.ad}
          type="button"
          onClick={() => onFiltre(k.filtre)}
          className="rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-slate-400 hover:shadow-sm"
        >
          <div className="text-sm text-slate-500">{k.ad}</div>
          <div className={`mt-1 text-3xl font-semibold tabular-nums ${k.renk}`}>{k.sayi}</div>
        </button>
      ))}
    </div>
  );
}
