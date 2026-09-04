import { paraGoster } from '../harc';
import type { Evrak } from '../types';
import { tarihGoster } from '../utils';
import { sayiGoster } from '../yapi';

interface Props {
  evrak: Evrak;
  onHesapla: () => void;
  onOdeme: (makbuzNo: string, odemeTarihi: string) => void;
  onFis: () => void;
  /** Tarife ekranı yalnızca müdüre açıktır. */
  onTarife?: () => void;
}

/**
 * Dosyanın harç ve ücret tahakkuku. Tutarlar belediyenin kendi tarifesinden
 * hesaplanır; tarife onaylanmadıysa çıktı "örnek" sayılır ve burada da
 * uyarı görünür.
 */
export function HarcKutusu({ evrak, onHesapla, onOdeme, onFis, onTarife }: Props) {
  const t = evrak.tahakkuk;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-wide text-slate-500">Harç ve ücretler</h3>
        <div className="flex gap-3">
          {onTarife && (
            <button
              type="button"
              onClick={onTarife}
              className="text-xs font-medium text-slate-700 underline"
            >
              tarife
            </button>
          )}
          <button
            type="button"
            onClick={onHesapla}
            className="text-xs font-medium text-slate-700 underline"
          >
            {t ? 'yeniden hesapla' : 'harç hesapla'}
          </button>
        </div>
      </div>

      {!t ? (
        <p className="mt-2 text-sm text-slate-500">
          Yapı bilgileri girildikten sonra “harç hesapla” ile tahakkuk çıkarılır.
        </p>
      ) : (
        <div className="mt-2 rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              {t.satirlar.map((s) => (
                <tr key={s.kod}>
                  <td className="px-3 py-1.5">
                    <span className="block">{s.ad}</span>
                    <span className="block text-xs text-slate-500">
                      {s.taban === 'sabit'
                        ? paraGoster(s.birimFiyat)
                        : `${sayiGoster(s.miktar)} ${s.birim} × ${
                            s.taban === 'maliyet-yuzdesi'
                              ? `%${s.birimFiyat}`
                              : paraGoster(s.birimFiyat)
                          }`}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-1.5 text-right tabular-nums">
                    {paraGoster(s.tutar)}
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-semibold">
                <td className="px-3 py-2">Toplam</td>
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                  {paraGoster(t.toplam)}
                </td>
              </tr>
            </tbody>
          </table>

          {!t.tarifeOnayli && (
            <p className="border-t border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Tarife müdürlükçe onaylanmadı; bu tutarlar bilgi amaçlıdır.
            </p>
          )}

          {t.uyarilar.length > 0 && (
            <ul className="list-disc space-y-0.5 border-t border-slate-200 px-3 py-2 pl-7 text-xs text-slate-600">
              {t.uyarilar.map((u) => (
                <li key={u}>{u}</li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-3 py-2 text-xs">
            {t.makbuzNo ? (
              <>
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-800 ring-1 ring-inset ring-emerald-300">
                  Tahsil edildi
                </span>
                <span className="text-slate-600">
                  Makbuz no {t.makbuzNo}
                  {t.odemeTarihi ? ` · ${tarihGoster(t.odemeTarihi)}` : ''}
                </span>
                <button
                  type="button"
                  onClick={() => onOdeme('', '')}
                  className="text-slate-500 underline"
                >
                  kaydı kaldır
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  const no = (prompt('Tahsilat makbuz numarası:') ?? '').trim();
                  if (no) onOdeme(no, '');
                }}
                className="rounded-lg border border-emerald-300 px-2 py-0.5 font-medium text-emerald-800 hover:bg-emerald-50"
              >
                tahsilat kaydet
              </button>
            )}
            <span className="ml-auto text-slate-500">
              {t.hesaplayan}
              {t.tarih ? ` · ${tarihGoster(t.tarih)}` : ''}
            </span>
            <button type="button" onClick={onFis} className="font-medium text-slate-700 underline">
              tahakkuk fişi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
