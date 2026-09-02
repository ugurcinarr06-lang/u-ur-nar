import { KAPALI_DURUMLAR, turAdi } from '../data';
import type { Evrak } from '../types';
import { kalanGun, tarihGoster } from '../utils';
import { DurumRozeti, GecikmeRozeti } from './Rozet';

interface Props {
  evraklar: Evrak[];
  seciliId: string | null;
  onSec: (id: string) => void;
}

export function EvrakListesi({ evraklar, seciliId, onSec }: Props) {
  if (evraklar.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
        Bu filtrelerle eşleşen evrak yok.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-[52rem] border-collapse text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">Evrak No</th>
            <th className="px-4 py-3 font-medium">Konu / Tür</th>
            <th className="px-4 py-3 font-medium">Taşınmaz</th>
            <th className="px-4 py-3 font-medium">Geliş</th>
            <th className="px-4 py-3 font-medium">Durum</th>
            <th className="px-4 py-3 font-medium">Süre</th>
            <th className="px-4 py-3 font-medium">Sorumlu</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {evraklar.map((e) => (
            <tr
              key={e.id}
              onClick={() => onSec(e.id)}
              className={`cursor-pointer align-top transition hover:bg-slate-50 ${
                seciliId === e.id ? 'bg-sky-50' : ''
              }`}
            >
              <td className="whitespace-nowrap px-4 py-3 font-mono font-medium">{e.no}</td>
              <td className="px-4 py-3">
                <div className="font-medium text-slate-900">{e.konu}</div>
                <div className="text-xs text-slate-500">{turAdi(e.tur)}</div>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                {e.tasinmaz.mahalle} mah.
                <div className="text-xs text-slate-500">
                  Ada {e.tasinmaz.ada} / Parsel {e.tasinmaz.parsel}
                </div>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                {tarihGoster(e.gelisTarihi)}
              </td>
              <td className="px-4 py-3">
                <DurumRozeti durum={e.durum} />
              </td>
              <td className="px-4 py-3">
                {KAPALI_DURUMLAR.includes(e.durum) ? (
                  <span className="text-xs text-slate-400">sonuçlandı</span>
                ) : (
                  <GecikmeRozeti kalan={kalanGun(e)} />
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">{e.sorumlu || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
