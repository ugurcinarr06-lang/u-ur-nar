import type { Bulgu, Inceleme as IncelemeTipi } from '../types';

const SEVIYE: Record<Bulgu['seviye'], { renk: string; simge: string }> = {
  bilgi: { renk: 'text-slate-600', simge: '·' },
  uyari: { renk: 'text-amber-700', simge: '!' },
  engel: { renk: 'text-rose-700', simge: '×' },
};

const SONUC: Record<string, { ad: string; renk: string }> = {
  uygun: { ad: 'Sorun görülmedi', renk: 'bg-emerald-100 text-emerald-800 ring-emerald-300' },
  kontrol: { ad: 'Kontrol gerekiyor', renk: 'bg-amber-100 text-amber-800 ring-amber-300' },
  uygunsuz: { ad: 'Engel var', renk: 'bg-rose-100 text-rose-800 ring-rose-300' },
};

/** Bir ekin otomatik inceleme sonucu ve bulguları. */
export function IncelemeKutusu({
  inceleme,
  onYenile,
}: {
  inceleme?: IncelemeTipi;
  onYenile?: () => void;
}) {
  if (!inceleme) return null;

  if (inceleme.durum === 'bekliyor' || inceleme.durum === 'inceleniyor') {
    return (
      <p className="mt-1 text-xs text-slate-500">
        {inceleme.durum === 'bekliyor' ? 'İnceleme sırada…' : 'İnceleniyor…'}
      </p>
    );
  }

  const sonuc = inceleme.sonuc ? SONUC[inceleme.sonuc] : undefined;
  const uyariSayisi = inceleme.bulgular.filter((b) => b.seviye !== 'bilgi').length;

  return (
    <div className="mt-1.5 rounded-lg bg-slate-50 px-2.5 py-2">
      <div className="flex flex-wrap items-center gap-2">
        {sonuc && (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${sonuc.renk}`}
          >
            {sonuc.ad}
          </span>
        )}
        <span className="text-xs text-slate-500">
          {uyariSayisi > 0 ? `${uyariSayisi} bulgu` : 'bulgu yok'}
          {inceleme.model ? ` · ${inceleme.model}` : ''}
        </span>
        {onYenile && (
          <button
            type="button"
            onClick={onYenile}
            className="ml-auto text-xs font-medium text-slate-600 underline"
          >
            yeniden incele
          </button>
        )}
      </div>

      {inceleme.ozet && <p className="mt-1 text-xs text-slate-700">{inceleme.ozet}</p>}

      {inceleme.bulgular.length > 0 && (
        <ul className="mt-1.5 space-y-1">
          {inceleme.bulgular.map((b, i) => (
            <li key={`${b.baslik}-${i}`} className="text-xs">
              <span className={`font-medium ${SEVIYE[b.seviye].renk}`}>
                {SEVIYE[b.seviye].simge} {b.baslik}
              </span>
              {b.ayrinti && <span className="text-slate-600"> — {b.ayrinti}</span>}
              {b.kaynak === 'yapay-zeka' && <span className="text-slate-400"> (yapay zekâ)</span>}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-1.5 text-xs text-slate-400">
        Otomatik ön kontrol — belgeyi onaylamaz, kararı siz verirsiniz.
      </p>
    </div>
  );
}
