import { useEffect, useState } from 'react';
import type { BelgeTanimi } from '../belgeler';
import { turAdi } from '../data';
import type { Evrak } from '../types';
import { tarihGoster } from '../utils';

const KURUM_ANAHTARI = 'imar-evrak/kurum';

const kurumOku = (): string => {
  try {
    return localStorage.getItem(KURUM_ANAHTARI) ?? '';
  } catch {
    return '';
  }
};

interface Props {
  evrak: Evrak;
  eksikler: BelgeTanimi[];
  onKapat: () => void;
}

/**
 * Başvurana verilecek eksik belge bildirimi. Yazdırılırken sayfadaki
 * diğer her şey gizlenir (index.css içindeki .yazi-katman kuralları).
 */
export function EksikBelgeYazisi({ evrak, eksikler, onKapat }: Props) {
  const [kurum, setKurum] = useState(kurumOku);

  useEffect(() => {
    document.body.classList.add('yazi-modu');
    return () => document.body.classList.remove('yazi-modu');
  }, []);

  const kurumYaz = (deger: string) => {
    setKurum(deger);
    try {
      localStorage.setItem(KURUM_ANAHTARI, deger);
    } catch {
      // Depolama kapalıysa yazı yine de üretilir.
    }
  };

  const parsel = [
    evrak.tasinmaz.mahalle && `${evrak.tasinmaz.mahalle} Mahallesi`,
    evrak.tasinmaz.pafta && `${evrak.tasinmaz.pafta} pafta`,
    evrak.tasinmaz.ada && `${evrak.tasinmaz.ada} ada`,
    evrak.tasinmaz.parsel && `${evrak.tasinmaz.parsel} parsel`,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="yazi-katman fixed inset-0 z-40 overflow-y-auto bg-slate-900/50 p-4">
      <div className="mx-auto my-6 w-full max-w-3xl">
        <div className="no-print mb-3 flex flex-wrap items-center gap-2">
          <input
            value={kurum}
            onChange={(e) => kurumYaz(e.target.value)}
            placeholder="Belediye adı (örn. Çeşme Belediye Başkanlığı)"
            className="min-w-[18rem] flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            aria-label="Kurum adı"
          />
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            Yazdır
          </button>
          <button
            type="button"
            onClick={onKapat}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium"
          >
            Kapat
          </button>
        </div>

        <article className="yazi-kagit rounded-xl bg-white p-10 text-[15px] leading-7 text-slate-900 shadow-xl">
          <header className="text-center">
            <p className="font-semibold">T.C.</p>
            <p className="font-semibold uppercase">{kurum || '……………… BELEDİYE BAŞKANLIĞI'}</p>
            <p>İmar ve Şehircilik Müdürlüğü</p>
          </header>

          <div className="mt-8 flex justify-between text-sm">
            <div>
              <p>
                <span className="inline-block w-14">Sayı</span>: {evrak.no}
              </p>
              <p>
                <span className="inline-block w-14">Konu</span>: Eksik belge bildirimi
              </p>
            </div>
            <p>{tarihGoster(new Date().toISOString().slice(0, 10))}</p>
          </div>

          <p className="mt-8 font-medium">Sayın {evrak.basvuran.ad || '……………………'},</p>

          <p className="mt-4">
            {parsel ? `${parsel} sayılı taşınmaza ilişkin ` : ''}
            {tarihGoster(evrak.gelisTarihi)} tarihli ve {evrak.no} sayılı,{' '}
            <strong>“{evrak.konu || turAdi(evrak.tur)}”</strong> konulu başvurunuz müdürlüğümüzce
            incelenmiş; dosyanızda aşağıda belirtilen belgelerin eksik olduğu tespit edilmiştir.
          </p>

          <ol className="mt-4 list-decimal space-y-1 pl-6">
            {eksikler.map((b) => (
              <li key={b.kod}>{b.ad}</li>
            ))}
          </ol>

          <p className="mt-4">
            Eksik belgelerin, bu yazının tebliğ tarihinden itibaren{' '}
            <strong>30 gün içinde</strong> müdürlüğümüze teslim edilmesi; aksi hâlde başvurunuzun
            işlemden kaldırılacağı hususunda bilgilerinizi ve gereğini rica ederim.
          </p>

          <div className="mt-14 text-right">
            <p>{evrak.sorumlu || '…………………………'}</p>
            <p className="text-sm text-slate-600">İmar ve Şehircilik Müdürlüğü</p>
          </div>

          <footer className="mt-10 border-t border-slate-200 pt-3 text-xs text-slate-500">
            Bu yazı {evrak.no} sayılı evrak dosyasından üretilmiştir.
          </footer>
        </article>
      </div>
    </div>
  );
}
