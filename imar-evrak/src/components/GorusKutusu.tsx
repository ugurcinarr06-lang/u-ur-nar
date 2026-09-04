import { useState } from 'react';
import {
  GORUS_DURUMLARI,
  HATIRLATMA_GUNU,
  KURUMLAR,
  bekleyenGun,
  gorusDurumRengi,
  type Gorus,
  type GorusDurumu,
} from '../gorus';
import type { Evrak } from '../types';
import { bugun, tarihGoster } from '../utils';

interface Props {
  evrak: Evrak;
  onEkle: (gorus: Partial<Gorus>) => void;
  onGuncelle: (gorusId: string, gorus: Partial<Gorus>) => void;
  onSil: (gorusId: string) => void;
  /** Kuruma gidecek görüş isteme yazısını açar. */
  onYazi: (gorusId: string) => void;
}

const alan = 'w-full rounded-lg border border-slate-300 px-2 py-1 text-sm';

/**
 * Dosyanın başka kurumlardan beklediği görüşler. Dosya burada tıkanıyorsa
 * nedeni ve kaçıncı günde olduğu tek bakışta görünür; cevabı gecikenler için
 * sorumluya hatırlatma da bu kayıtlardan üretilir.
 */
export function GorusKutusu({ evrak, onEkle, onGuncelle, onSil, onYazi }: Props) {
  const [acik, setAcik] = useState(false);
  const [kurum, setKurum] = useState('');
  const [konu, setKonu] = useState('');
  const [sayi, setSayi] = useState('');
  const [gonderimTarihi, setGonderimTarihi] = useState('');

  const ekle = () => {
    if (!kurum.trim()) return;
    onEkle({
      kurum: kurum.trim(),
      konu: konu.trim(),
      sayi: sayi.trim(),
      gonderimTarihi,
      durum: gonderimTarihi ? 'gonderildi' : 'hazirlaniyor',
    });
    setKurum('');
    setKonu('');
    setSayi('');
    setGonderimTarihi('');
    setAcik(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-wide text-slate-500">
          Kurum görüşleri{evrak.gorusler.length > 0 && ` (${evrak.gorusler.length})`}
        </h3>
        <button
          type="button"
          onClick={() => setAcik((a) => !a)}
          className="text-xs font-medium text-slate-700 underline"
        >
          {acik ? 'vazgeç' : 'görüş ekle'}
        </button>
      </div>

      {acik && (
        <div className="mt-2 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <label className="block">
            <span className="text-xs uppercase tracking-wide text-slate-500">Kurum</span>
            <input
              list="kurum-listesi"
              value={kurum}
              onChange={(e) => setKurum(e.target.value)}
              placeholder="Görüş sorulacak kurum"
              className={alan}
            />
            <datalist id="kurum-listesi">
              {KURUMLAR.map((k) => (
                <option key={k} value={k} />
              ))}
            </datalist>
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-wide text-slate-500">Konu</span>
            <input
              value={konu}
              onChange={(e) => setKonu(e.target.value)}
              placeholder="örn. trafo yeri görüşü"
              className={alan}
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-xs uppercase tracking-wide text-slate-500">Giden yazı no</span>
              <input value={sayi} onChange={(e) => setSayi(e.target.value)} className={alan} />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wide text-slate-500">Çıkış tarihi</span>
              <input
                type="date"
                max={bugun()}
                value={gonderimTarihi}
                onChange={(e) => setGonderimTarihi(e.target.value)}
                className={alan}
              />
            </label>
          </div>
          <button
            type="button"
            onClick={ekle}
            disabled={!kurum.trim()}
            className="w-full rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:bg-slate-300"
          >
            Kaydet
          </button>
        </div>
      )}

      {evrak.gorusler.length === 0 ? (
        !acik && (
          <p className="mt-2 text-sm text-slate-500">
            DSİ, Karayolları, TEDAŞ gibi kurumlardan görüş isteniyorsa buraya kaydedin; cevap
            gecikirse hatırlatma gelir.
          </p>
        )
      ) : (
        <ul className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200">
          {evrak.gorusler.map((g) => {
            const gun = bekleyenGun(g);
            return (
              <li key={g.id} className="px-3 py-2 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="block font-medium">{g.kurum}</span>
                    {g.konu && <span className="block text-xs text-slate-600">{g.konu}</span>}
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${gorusDurumRengi(
                      g.durum,
                    )}`}
                  >
                    {GORUS_DURUMLARI.find((d) => d.deger === g.durum)?.ad}
                  </span>
                </div>

                <div className="mt-1 text-xs text-slate-500">
                  {g.sayi && <span>Sayı {g.sayi} · </span>}
                  {g.gonderimTarihi ? (
                    <span>Çıkış {tarihGoster(g.gonderimTarihi)}</span>
                  ) : (
                    <span>Yazı henüz çıkmadı</span>
                  )}
                  {g.cevapTarihi && <span> · Cevap {tarihGoster(g.cevapTarihi)}</span>}
                  {gun !== null && (
                    <span
                      className={`ml-1 font-medium ${
                        gun >= HATIRLATMA_GUNU ? 'text-rose-700' : 'text-amber-700'
                      }`}
                    >
                      · {gun} gündür bekliyor
                    </span>
                  )}
                </div>

                {g.not && <p className="mt-1 text-xs text-slate-700">{g.not}</p>}

                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                  <select
                    value={g.durum}
                    onChange={(e) =>
                      onGuncelle(g.id, {
                        ...g,
                        durum: e.target.value as GorusDurumu,
                        // Yazı çıkışını işaretlerken tarih boşsa bugün sayılır.
                        gonderimTarihi:
                          e.target.value === 'gonderildi' && !g.gonderimTarihi
                            ? bugun()
                            : g.gonderimTarihi,
                      })
                    }
                    className="rounded-lg border border-slate-300 px-2 py-0.5"
                    aria-label={`${g.kurum} görüş durumu`}
                  >
                    {GORUS_DURUMLARI.map((d) => (
                      <option key={d.deger} value={d.deger}>
                        {d.ad}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const not = prompt('Görüş notu / cevabın özeti:', g.not) ?? g.not;
                      const cevapSayisi =
                        g.durum === 'olumlu' || g.durum === 'olumsuz'
                          ? (prompt('Gelen cevabın sayısı:', g.cevapSayisi) ?? g.cevapSayisi)
                          : g.cevapSayisi;
                      onGuncelle(g.id, { ...g, not, cevapSayisi });
                    }}
                    className="font-medium text-slate-700 underline"
                  >
                    not
                  </button>
                  <button
                    type="button"
                    onClick={() => onYazi(g.id)}
                    className="font-medium text-slate-700 underline"
                  >
                    görüş isteme yazısı
                  </button>
                  <button
                    type="button"
                    onClick={() => onSil(g.id)}
                    className="ml-auto font-medium text-rose-700 underline"
                  >
                    sil
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
