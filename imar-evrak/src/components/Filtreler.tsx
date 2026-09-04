import { DURUMLAR, TURLER } from '../data';
import type { Filtre } from '../types';

interface Props {
  filtre: Filtre;
  sorumlular: string[];
  onDegis: (f: Filtre) => void;
}

const secim = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm';

export function Filtreler({ filtre, sorumlular, onDegis }: Props) {
  const guncelle = (yama: Partial<Filtre>) => onDegis({ ...filtre, ...yama });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="search"
        value={filtre.arama}
        onChange={(e) => guncelle({ arama: e.target.value })}
        placeholder="Evrak no, konu, ada/parsel, başvuran…"
        className={`${secim} min-w-[16rem] flex-1`}
        aria-label="Ara"
      />

      <select
        value={filtre.durum}
        onChange={(e) => guncelle({ durum: e.target.value as Filtre['durum'] })}
        className={secim}
        aria-label="Durum"
      >
        <option value="hepsi">Tüm durumlar</option>
        {DURUMLAR.map((d) => (
          <option key={d.deger} value={d.deger}>
            {d.ad}
          </option>
        ))}
      </select>

      <select
        value={filtre.tur}
        onChange={(e) => guncelle({ tur: e.target.value as Filtre['tur'] })}
        className={secim}
        aria-label="Evrak türü"
      >
        <option value="hepsi">Tüm türler</option>
        {TURLER.map((t) => (
          <option key={t.deger} value={t.deger}>
            {t.ad}
          </option>
        ))}
      </select>

      <select
        value={filtre.sorumlu}
        onChange={(e) => guncelle({ sorumlu: e.target.value })}
        className={secim}
        aria-label="Sorumlu personel"
      >
        <option value="hepsi">Tüm personel</option>
        {sorumlular.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
        <input
          type="checkbox"
          checked={filtre.sadeceGeciken}
          onChange={(e) => guncelle({ sadeceGeciken: e.target.checked })}
          className="h-4 w-4 accent-rose-600"
        />
        Sadece süresi geçenler
      </label>
    </div>
  );
}
