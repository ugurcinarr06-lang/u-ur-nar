import { useState, type FormEvent } from 'react';
import type { Evrak } from '../types';
import { yapiGruplari, type YapiBilgisi } from '../yapi';

interface Props {
  evrak: Evrak;
  onKapat: () => void;
  onKaydet: (yapi: YapiBilgisi) => void;
}

const alan = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm';
const etiket = 'block text-xs font-medium uppercase tracking-wide text-slate-500';

/**
 * Ruhsat, iskân ve imar durumu belgelerini dolduran yapı/parsel bilgileri.
 * Alanlar src/yapi.ts içindeki tanımdan üretilir: belediyenizin formu
 * farklıysa orayı düzenlemek yeter, bu ekran kendiliğinden değişir.
 */
export function YapiBilgileri({ evrak, onKapat, onKaydet }: Props) {
  const [deger, setDeger] = useState<YapiBilgisi>(evrak.yapi ?? {});
  const gruplar = yapiGruplari(evrak.tur);

  const yaz = (kod: string, v: string) => setDeger((o) => ({ ...o, [kod]: v }));

  const gonder = (e: FormEvent) => {
    e.preventDefault();
    onKaydet(
      Object.fromEntries(
        Object.entries(deger)
          .map(([k, v]) => [k, v.trim()])
          .filter(([, v]) => v),
      ),
    );
  };

  return (
    <div className="fixed inset-0 z-30 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4">
      <form onSubmit={gonder} className="my-6 w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold">Yapı ve proje bilgileri — {evrak.no}</h2>
        <p className="mt-1 text-sm text-slate-500">
          Buraya girilen bilgiler yapı ruhsatı, yapı kullanma izni ve imar durumu belgelerini
          doldurur; harç hesabı da bu alanlardan yapılır.
        </p>

        {gruplar.map((grup) => (
          <fieldset key={grup.kod} className="mt-6">
            <legend className="text-sm font-semibold text-slate-800">{grup.ad}</legend>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {grup.alanlar.map((a) => (
                <label key={a.kod} className={a.tip === 'uzun' ? 'sm:col-span-3' : ''}>
                  <span className={etiket}>
                    {a.ad}
                    {a.birim && <span className="ml-1 normal-case text-slate-400">({a.birim})</span>}
                  </span>
                  {a.tip === 'secim' ? (
                    <select
                      value={deger[a.kod] ?? ''}
                      onChange={(e) => yaz(a.kod, e.target.value)}
                      className={alan}
                    >
                      <option value="">—</option>
                      {a.secenekler?.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  ) : a.tip === 'uzun' ? (
                    <textarea
                      value={deger[a.kod] ?? ''}
                      onChange={(e) => yaz(a.kod, e.target.value)}
                      rows={3}
                      className={alan}
                    />
                  ) : (
                    <input
                      type={a.tip === 'tarih' ? 'date' : 'text'}
                      inputMode={a.tip === 'sayi' ? 'decimal' : undefined}
                      value={deger[a.kod] ?? ''}
                      onChange={(e) => yaz(a.kod, e.target.value)}
                      className={alan}
                    />
                  )}
                  {a.ipucu && <span className="mt-0.5 block text-xs text-slate-400">{a.ipucu}</span>}
                </label>
              ))}
            </div>
          </fieldset>
        ))}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onKapat}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium"
          >
            Vazgeç
          </button>
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            Kaydet
          </button>
        </div>
      </form>
    </div>
  );
}
