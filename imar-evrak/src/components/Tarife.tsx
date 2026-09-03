import { Fragment, useState } from 'react';
import { TURLER } from '../data';
import { TABANLAR, paraGoster, type HarcKalemi, type Tarife, type Taban } from '../harc';
import type { Tur } from '../types';
import { YAPI_SINIFLARI } from '../yapi';

interface Props {
  tarife: Tarife;
  /** Müdür değilse alanlar salt okunur açılır. */
  duzenlenebilir: boolean;
  onKapat: () => void;
  onKaydet: (tarife: Tarife) => void;
}

const alan = 'w-full rounded-lg border border-slate-300 px-2 py-1 text-sm';

/**
 * Harç tarifesi ekranı. Tutarlar kanunda değil, belediye meclisinin tarife
 * cetvelinde yazar; bu yüzden birim fiyatları müdür girer ve "onaylandı"
 * kutusunu işaretler. Onaylanmadan üretilen tahakkuklar "örnek" sayılır.
 */
export function TarifeEkrani({ tarife, duzenlenebilir, onKapat, onKaydet }: Props) {
  const [taslak, setTaslak] = useState<Tarife>(tarife);
  const [acikKalem, setAcikKalem] = useState<string | null>(null);

  const kalemYaz = (kod: string, yama: Partial<HarcKalemi>) =>
    setTaslak((t) => ({
      ...t,
      kalemler: t.kalemler.map((k) => (k.kod === kod ? { ...k, ...yama } : k)),
    }));

  const turDegis = (kalem: HarcKalemi, tur: Tur) =>
    kalemYaz(kalem.kod, {
      turler: kalem.turler.includes(tur)
        ? kalem.turler.filter((t) => t !== tur)
        : [...kalem.turler, tur],
    });

  const kalemEkle = () => {
    const kod = `ozel-${Date.now().toString(36)}`;
    setTaslak((t) => ({
      ...t,
      kalemler: [
        ...t.kalemler,
        {
          kod,
          ad: 'Yeni kalem',
          taban: 'sabit',
          birimFiyat: 0,
          turler: ['ruhsat'],
          aciklama: '',
          aktif: true,
        },
      ],
    }));
    setAcikKalem(kod);
  };

  return (
    <div className="fixed inset-0 z-30 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4">
      <div className="my-6 w-full max-w-4xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Harç ve ücret tarifesi</h2>
            <p className="mt-1 text-sm text-slate-500">
              Tutarlar belediye meclisinin tarife cetvelinden girilir. Sistem yalnızca hesap
              yöntemini bilir; rakamlar sizindir.
            </p>
          </div>
          <button
            type="button"
            onClick={onKapat}
            className="rounded-lg px-2 py-1 text-2xl leading-none text-slate-400 hover:bg-slate-100"
            aria-label="Kapat"
          >
            ×
          </button>
        </div>

        {!duzenlenebilir && (
          <p className="mt-4 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">
            Tarifeyi yalnızca müdür değiştirebilir. Aşağıdaki değerler bilgi amaçlıdır.
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-4">
          <label className="text-sm">
            <span className="mr-2 text-slate-600">Tarife yılı</span>
            <input
              type="number"
              value={taslak.yil}
              disabled={!duzenlenebilir}
              onChange={(e) => setTaslak((t) => ({ ...t, yil: Number(e.target.value) || t.yil }))}
              className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={taslak.onaylandi}
              disabled={!duzenlenebilir}
              onChange={(e) => setTaslak((t) => ({ ...t, onaylandi: e.target.checked }))}
              className="h-4 w-4 accent-emerald-600"
            />
            <span>
              Bu tarife belediyemizin yürürlükteki cetvelidir
              <span className="block text-xs text-slate-500">
                İşaretlenmezse üretilen tahakkuk fişlerinde “bilgi amaçlıdır” notu çıkar.
              </span>
            </span>
          </label>
          {taslak.onaylayan && (
            <span className="text-xs text-slate-500">Onaylayan: {taslak.onaylayan}</span>
          )}
        </div>

        <h3 className="mt-6 text-sm font-semibold">Harç ve ücret kalemleri</h3>
        <div className="mt-2 overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Kalem</th>
                <th className="px-3 py-2">Hesap tabanı</th>
                <th className="px-3 py-2 text-right">Birim fiyat</th>
                <th className="px-3 py-2 text-center">Aktif</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {taslak.kalemler.map((k) => (
                <Fragment key={k.kod}>
                  <tr>
                    <td className="px-3 py-1.5">
                      <input
                        value={k.ad}
                        disabled={!duzenlenebilir}
                        onChange={(e) => kalemYaz(k.kod, { ad: e.target.value })}
                        className={alan}
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <select
                        value={k.taban}
                        disabled={!duzenlenebilir}
                        onChange={(e) => kalemYaz(k.kod, { taban: e.target.value as Taban })}
                        className={alan}
                      >
                        {TABANLAR.map((t) => (
                          <option key={t.deger} value={t.deger}>
                            {t.ad}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={k.birimFiyat}
                        disabled={!duzenlenebilir}
                        onChange={(e) =>
                          kalemYaz(k.kod, { birimFiyat: Number(e.target.value) || 0 })
                        }
                        className="w-28 rounded-lg border border-slate-300 px-2 py-1 text-right text-sm tabular-nums"
                      />
                      <span className="ml-1 text-xs text-slate-500">
                        {k.taban === 'maliyet-yuzdesi' ? '%' : 'TL'}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-center">
                      <input
                        type="checkbox"
                        checked={k.aktif}
                        disabled={!duzenlenebilir}
                        onChange={(e) => kalemYaz(k.kod, { aktif: e.target.checked })}
                        className="h-4 w-4 accent-emerald-600"
                      />
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      <button
                        type="button"
                        onClick={() => setAcikKalem(acikKalem === k.kod ? null : k.kod)}
                        className="text-xs font-medium text-slate-700 underline"
                      >
                        {acikKalem === k.kod ? 'kapat' : 'ayrıntı'}
                      </button>
                    </td>
                  </tr>
                  {acikKalem === k.kod && (
                    <tr className="bg-slate-50">
                      <td colSpan={5} className="px-3 py-3">
                        <span className="text-xs uppercase tracking-wide text-slate-500">
                          Hangi evrak türlerinde çıksın
                        </span>
                        <div className="mt-1.5 flex flex-wrap gap-2">
                          {TURLER.map((t) => (
                            <label
                              key={t.deger}
                              className={`cursor-pointer rounded-full px-2.5 py-1 text-xs ring-1 ring-inset ${
                                k.turler.includes(t.deger)
                                  ? 'bg-sky-100 text-sky-800 ring-sky-300'
                                  : 'bg-white text-slate-600 ring-slate-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={k.turler.includes(t.deger)}
                                disabled={!duzenlenebilir}
                                onChange={() => turDegis(k, t.deger)}
                                className="sr-only"
                              />
                              {t.ad}
                            </label>
                          ))}
                        </div>
                        <label className="mt-3 block">
                          <span className="text-xs uppercase tracking-wide text-slate-500">
                            Açıklama (fişte görünür)
                          </span>
                          <input
                            value={k.aciklama}
                            disabled={!duzenlenebilir}
                            onChange={(e) => kalemYaz(k.kod, { aciklama: e.target.value })}
                            className={alan}
                          />
                        </label>
                        {duzenlenebilir && (
                          <button
                            type="button"
                            onClick={() =>
                              setTaslak((t) => ({
                                ...t,
                                kalemler: t.kalemler.filter((x) => x.kod !== k.kod),
                              }))
                            }
                            className="mt-3 text-xs font-medium text-rose-700 underline"
                          >
                            bu kalemi sil
                          </button>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {duzenlenebilir && (
          <button
            type="button"
            onClick={kalemEkle}
            className="mt-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium"
          >
            + Kalem ekle
          </button>
        )}

        <h3 className="mt-6 text-sm font-semibold">
          Yapı sınıfına göre m² birim maliyeti
          <span className="ml-2 font-normal text-slate-500">
            (Bakanlık tebliğinden; “yapı maliyetinin yüzdesi” tabanlı kalemlerde kullanılır)
          </span>
        </h3>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {YAPI_SINIFLARI.map((s) => (
            <label key={s} className="flex items-center gap-2 text-sm">
              <span className="w-12 text-slate-600">{s}</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={taslak.birimMaliyet[s] ?? 0}
                disabled={!duzenlenebilir}
                onChange={(e) =>
                  setTaslak((t) => ({
                    ...t,
                    birimMaliyet: { ...t.birimMaliyet, [s]: Number(e.target.value) || 0 },
                  }))
                }
                className="w-full rounded-lg border border-slate-300 px-2 py-1 text-right text-sm tabular-nums"
              />
            </label>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Etkin kalem toplamı:{' '}
            {paraGoster(
              taslak.kalemler.filter((k) => k.aktif && k.taban === 'sabit').reduce((a, k) => a + k.birimFiyat, 0),
            )}{' '}
            sabit ücret
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onKapat}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium"
            >
              Kapat
            </button>
            {duzenlenebilir && (
              <button
                type="button"
                onClick={() => onKaydet(taslak)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
              >
                Tarifeyi kaydet
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
