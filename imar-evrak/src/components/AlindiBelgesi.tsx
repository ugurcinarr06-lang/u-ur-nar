import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
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

/**
 * Başvuru sırasında vatandaşa verilen alındı belgesi. Üzerinde takip kodu
 * ve takip sayfasına götüren kare kod bulunur.
 */
export function AlindiBelgesi({ evrak, onKapat }: { evrak: Evrak; onKapat: () => void }) {
  const [kurum, setKurum] = useState(kurumOku);
  const [kareKod, setKareKod] = useState('');

  const takipAdresi = `${window.location.origin}/takip`;

  useEffect(() => {
    document.body.classList.add('yazi-modu');
    return () => document.body.classList.remove('yazi-modu');
  }, []);

  useEffect(() => {
    // Kare kod yalnızca takip sayfasının adresini taşır; kişisel veri içermez.
    QRCode.toDataURL(takipAdresi, { margin: 1, width: 220 })
      .then(setKareKod)
      .catch(() => setKareKod(''));
  }, [takipAdresi]);

  const kurumYaz = (deger: string) => {
    setKurum(deger);
    try {
      localStorage.setItem(KURUM_ANAHTARI, deger);
    } catch {
      // Depolama kapalıysa belge yine üretilir.
    }
  };

  const parsel = [
    evrak.tasinmaz.mahalle && `${evrak.tasinmaz.mahalle} Mahallesi`,
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
            placeholder="Belediye adı"
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
            <h2 className="mt-6 text-lg font-semibold tracking-wide">BAŞVURU ALINDI BELGESİ</h2>
          </header>

          <dl className="mt-8 grid grid-cols-[10rem_1fr] gap-y-2 text-sm">
            <dt className="text-slate-600">Evrak no</dt>
            <dd className="font-medium">{evrak.no}</dd>
            <dt className="text-slate-600">Başvuru tarihi</dt>
            <dd>{tarihGoster(evrak.gelisTarihi)}</dd>
            <dt className="text-slate-600">Başvuran</dt>
            <dd>{evrak.basvuran.ad || '—'}</dd>
            <dt className="text-slate-600">Konu</dt>
            <dd>{evrak.konu}</dd>
            <dt className="text-slate-600">İşlem türü</dt>
            <dd>{turAdi(evrak.tur)}</dd>
            <dt className="text-slate-600">Taşınmaz</dt>
            <dd>{parsel || '—'}</dd>
            <dt className="text-slate-600">Hedef süre</dt>
            <dd>{evrak.hedefGun} gün</dd>
          </dl>

          <div className="mt-8 flex items-center gap-6 rounded-xl border border-slate-300 p-5">
            <div className="flex-1">
              <p className="text-xs uppercase tracking-wide text-slate-500">Takip kodu</p>
              <p className="mt-1 font-mono text-2xl font-semibold tracking-widest">
                {evrak.takipKodu ?? '—'}
              </p>
              <p className="mt-3 text-sm">
                Başvurunuzun durumunu <strong>{takipAdresi}</strong> adresinden bu kod ve telefon
                numaranızın son dört hanesiyle öğrenebilirsiniz.
              </p>
            </div>
            {kareKod && <img src={kareKod} alt="Takip sayfası kare kodu" className="h-32 w-32" />}
          </div>

          <p className="mt-6 text-sm">
            Bu belge, yukarıda bilgileri yazılı başvurunuzun müdürlüğümüz kayıtlarına alındığını
            gösterir. Eksik belge bildirimi yapılması hâlinde süre, belgelerin tamamlanmasından
            sonra işlemeye devam eder.
          </p>

          <div className="mt-12 flex justify-between text-sm">
            <div>
              <p className="text-slate-600">Başvuran</p>
              <p className="mt-8">…………………………</p>
            </div>
            <div className="text-right">
              <p className="text-slate-600">Kayıt görevlisi</p>
              <p className="mt-8">…………………………</p>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
