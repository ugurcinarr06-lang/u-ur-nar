import { useMemo } from 'react';
import { paraGoster } from '../harc';
import { panelVerisi, type PanelVerisi } from '../panel';
import type { Evrak, Filtre } from '../types';
import { tarihGoster } from '../utils';

interface Props {
  evraklar: Evrak[];
  /** Karta tıklanınca uygulanacak filtre yaması. */
  onFiltre: (yama: Partial<Filtre>) => void;
  onEvrakSec: (id: string) => void;
  acik: boolean;
  onAcKapa: () => void;
}

interface KartTanimi {
  ad: string;
  sayi: number | string;
  alt?: string;
  renk: string;
  cizgi: string;
  yama: Partial<Filtre>;
}

function Kart({ k, onFiltre }: { k: KartTanimi; onFiltre: Props['onFiltre'] }) {
  return (
    <button
      type="button"
      onClick={() => onFiltre(k.yama)}
      className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-slate-400 hover:shadow-sm"
    >
      <span className={`absolute inset-y-0 left-0 w-1 ${k.cizgi}`} />
      <div className="pl-2">
        <div className="text-sm text-slate-500">{k.ad}</div>
        <div className={`mt-1 text-3xl font-semibold tabular-nums ${k.renk}`}>{k.sayi}</div>
        {k.alt && <div className="mt-0.5 text-xs text-slate-400">{k.alt}</div>}
      </div>
    </button>
  );
}

/** Başlıklı kutu. */
function Kutu({
  baslik,
  sag,
  children,
}: {
  baslik: string;
  sag?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-800">{baslik}</h3>
        {sag}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/** Son altı ayın gelen/sonuçlanan çubukları. */
function AylikGrafik({ aylik }: { aylik: PanelVerisi['aylik'] }) {
  const enBuyuk = Math.max(1, ...aylik.map((a) => Math.max(a.gelen, a.sonuclanan)));
  return (
    <div>
      <div className="flex h-24 items-end gap-3">
        {aylik.map((a) => (
          <div key={a.ay} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-20 w-full items-end justify-center gap-1">
              <div
                className="w-1/2 rounded-t bg-sky-400"
                style={{ height: `${(a.gelen / enBuyuk) * 100}%` }}
                title={`${a.ad}: ${a.gelen} gelen`}
              />
              <div
                className="w-1/2 rounded-t bg-emerald-400"
                style={{ height: `${(a.sonuclanan / enBuyuk) * 100}%` }}
                title={`${a.ad}: ${a.sonuclanan} sonuçlanan`}
              />
            </div>
            <span className="text-xs text-slate-500">{a.ad}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-sm bg-sky-400" /> gelen
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-sm bg-emerald-400" /> sonuçlanan
        </span>
      </div>
    </div>
  );
}

/**
 * Gösterge paneli: sayılar, bugün bakılması gereken dosyalar, kurum
 * görüşleri ve süre performansı. Her kutu tıklanınca listeyi süzer.
 */
export function Panel({ evraklar, onFiltre, onEvrakSec, acik, onAcKapa }: Props) {
  const v = useMemo(() => panelVerisi(evraklar), [evraklar]);

  const kartlar: KartTanimi[] = [
    {
      ad: 'Açık dosya',
      sayi: v.acik,
      alt: `toplam ${v.toplam} kayıt`,
      renk: 'text-slate-900',
      cizgi: 'bg-slate-300',
      yama: { sadeceAcik: true },
    },
    {
      ad: 'Süresi geçen',
      sayi: v.geciken,
      alt: v.geciken ? 'öncelikli' : 'gecikme yok',
      renk: 'text-rose-700',
      cizgi: 'bg-rose-400',
      yama: { sadeceGeciken: true },
    },
    {
      ad: 'Karara hazır',
      sayi: v.kararaHazir,
      alt: 'belgeleri tamam',
      renk: 'text-emerald-700',
      cizgi: 'bg-emerald-400',
      yama: { sadeceHazir: true },
    },
    {
      ad: 'Eksik evrak',
      sayi: v.eksik,
      alt: 'vatandaş bekleniyor',
      renk: 'text-orange-700',
      cizgi: 'bg-orange-400',
      yama: { durum: 'eksik' },
    },
    {
      ad: 'Kurum görüşü',
      sayi: v.gorusBekleyen,
      alt: 'cevap bekleniyor',
      renk: 'text-sky-700',
      cizgi: 'bg-sky-400',
      yama: { sadeceGorusBekleyen: true },
    },
    {
      ad: 'Tahsil edilmemiş harç',
      sayi: v.odenmemisHarc,
      alt: v.odenmemisTutar ? paraGoster(v.odenmemisTutar) : 'bekleyen yok',
      renk: 'text-amber-700',
      cizgi: 'bg-amber-400',
      yama: { sadeceOdenmemis: true },
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {kartlar.map((k) => (
          <Kart key={k.ad} k={k} onFiltre={onFiltre} />
        ))}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onAcKapa}
          className="text-xs font-medium text-slate-600 underline"
        >
          {acik ? 'ayrıntıları gizle' : 'ayrıntıları göster'}
        </button>
      </div>

      {acik && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <Kutu baslik="Önce bunlara bakın">
            {v.acilDosyalar.length === 0 ? (
              <p className="text-sm text-slate-500">Açık dosya yok.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {v.acilDosyalar.map((s) => (
                  <li key={s.evrak.id}>
                    <button
                      type="button"
                      onClick={() => onEvrakSec(s.evrak.id)}
                      className="flex w-full items-start justify-between gap-3 py-2 text-left hover:bg-slate-50"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm text-slate-900">
                          {s.evrak.konu}
                        </span>
                        <span className="block text-xs text-slate-500">
                          <span className="font-mono">{s.evrak.no}</span> · {s.neden}
                          {s.evrak.sorumlu ? ` · ${s.evrak.sorumlu}` : ''}
                        </span>
                      </span>
                      <span
                        className={`shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                          s.kalan < 0
                            ? 'bg-rose-100 text-rose-800 ring-rose-300'
                            : s.kalan <= 3
                              ? 'bg-amber-100 text-amber-800 ring-amber-300'
                              : 'bg-slate-100 text-slate-700 ring-slate-300'
                        }`}
                      >
                        {s.kalan < 0 ? `${Math.abs(s.kalan)} gün gecikme` : `${s.kalan} gün`}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Kutu>

          <Kutu
            baslik="Kurum görüşü bekleyenler"
            sag={
              v.gorusBekleyen > 0 ? (
                <button
                  type="button"
                  onClick={() => onFiltre({ sadeceGorusBekleyen: true })}
                  className="text-xs font-medium text-slate-600 underline"
                >
                  hepsi ({v.gorusBekleyen})
                </button>
              ) : undefined
            }
          >
            {v.gorusler.length === 0 ? (
              <p className="text-sm text-slate-500">Cevap beklenen kurum görüşü yok.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {v.gorusler.map((s) => (
                  <li key={s.gorus.id}>
                    <button
                      type="button"
                      onClick={() => onEvrakSec(s.evrak.id)}
                      className="flex w-full items-start justify-between gap-3 py-2 text-left hover:bg-slate-50"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm text-slate-900">
                          {s.gorus.kurum}
                        </span>
                        <span className="block text-xs text-slate-500">
                          <span className="font-mono">{s.evrak.no}</span>
                          {s.gorus.gonderimTarihi
                            ? ` · çıkış ${tarihGoster(s.gorus.gonderimTarihi)}`
                            : ' · yazı çıkmadı'}
                        </span>
                      </span>
                      <span
                        className={`shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                          s.gun >= 15
                            ? 'bg-rose-100 text-rose-800 ring-rose-300'
                            : 'bg-amber-100 text-amber-800 ring-amber-300'
                        }`}
                      >
                        {s.gun} gün
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Kutu>

          <Kutu baslik="Süre performansı">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-50 p-3">
                <div className="text-xs text-slate-500">Ortalama sonuçlanma</div>
                <div className="mt-0.5 text-2xl font-semibold tabular-nums">
                  {v.ortalamaGun === null ? '—' : `${v.ortalamaGun} gün`}
                </div>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <div className="text-xs text-slate-500">Süresinde biten</div>
                <div className="mt-0.5 text-2xl font-semibold tabular-nums">
                  {v.zamanindaOran === null ? '—' : `%${v.zamanindaOran}`}
                </div>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Bu ay {v.buAyGelen} dosya geldi, {v.buAySonuclanan} dosya sonuçlandı.
            </p>
            <div className="mt-3">
              <AylikGrafik aylik={v.aylik} />
            </div>
          </Kutu>

          <Kutu baslik="Durum dağılımı">
            <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
              {v.durumDagilimi.map((d) => (
                <div
                  key={d.durum}
                  className={d.nokta}
                  style={{ width: `${(d.sayi / Math.max(1, v.toplam)) * 100}%` }}
                  title={`${d.ad}: ${d.sayi}`}
                />
              ))}
            </div>
            <ul className="mt-3 space-y-1 text-sm">
              {v.durumDagilimi.map((d) => (
                <li key={d.durum}>
                  <button
                    type="button"
                    onClick={() => onFiltre({ durum: d.durum })}
                    className="flex w-full items-center justify-between rounded px-1 py-0.5 hover:bg-slate-50"
                  >
                    <span className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-sm ${d.nokta}`} />
                      {d.ad}
                    </span>
                    <span className="tabular-nums text-slate-600">{d.sayi}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Kutu>

          <Kutu baslik="Evrak türleri">
            <ul className="space-y-1.5 text-sm">
              {v.turDagilimi.map((t) => (
                <li key={t.tur}>
                  <button
                    type="button"
                    onClick={() => onFiltre({ tur: t.tur })}
                    className="w-full rounded px-1 py-0.5 text-left hover:bg-slate-50"
                  >
                    <span className="flex items-center justify-between">
                      <span className="truncate">{t.ad}</span>
                      <span className="ml-2 tabular-nums text-slate-600">{t.sayi}</span>
                    </span>
                    <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <span
                        className="block h-full rounded-full bg-slate-400"
                        style={{
                          width: `${(t.sayi / Math.max(1, v.turDagilimi[0]?.sayi ?? 1)) * 100}%`,
                        }}
                      />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Kutu>

          <Kutu baslik="Personel yükü (açık dosya)">
            {v.personel.length === 0 ? (
              <p className="text-sm text-slate-500">Açık dosya yok.</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {v.personel.map((p) => (
                  <li key={p.ad}>
                    <button
                      type="button"
                      onClick={() =>
                        onFiltre({ sorumlu: p.ad === 'Atanmamış' ? 'hepsi' : p.ad, sadeceAcik: true })
                      }
                      className="w-full rounded px-1 py-0.5 text-left hover:bg-slate-50"
                    >
                      <span className="flex items-center justify-between">
                        <span className="truncate">{p.ad}</span>
                        <span className="ml-2 tabular-nums text-slate-600">
                          {p.acik}
                          {p.geciken > 0 && (
                            <span className="ml-1 text-rose-700">({p.geciken} geciken)</span>
                          )}
                        </span>
                      </span>
                      <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <span
                          className="block h-full rounded-full bg-sky-400"
                          style={{
                            width: `${(p.acik / Math.max(1, v.personel[0]?.acik ?? 1)) * 100}%`,
                          }}
                        />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Kutu>
        </div>
      )}
    </div>
  );
}
