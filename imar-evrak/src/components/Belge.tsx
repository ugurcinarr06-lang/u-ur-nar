import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

/** Antedin kurum adını, yukarıdaki giriş alanıyla birlikte tazelemek için. */
const KurumBaglami = createContext('');

const KURUM_ANAHTARI = 'imar-evrak/kurum';

export const kurumOku = (): string => {
  try {
    return localStorage.getItem(KURUM_ANAHTARI) ?? '';
  } catch {
    return '';
  }
};

const kurumYaz = (deger: string): void => {
  try {
    localStorage.setItem(KURUM_ANAHTARI, deger);
  } catch {
    // Depolama kapalıysa belge yine üretilir.
  }
};

interface Props {
  onKapat: () => void;
  /** Yazdırma düğmesinin yanında gösterilecek ek düğmeler. */
  arac?: ReactNode;
  children: ReactNode;
}

/**
 * Yazdırılabilir resmî belgelerin ortak çerçevesi: kurum adı girişi,
 * yazdır/kapat düğmeleri ve kâğıt görünümü. Yazdırırken sayfadaki diğer her
 * şey gizlenir (index.css içindeki .yazi-katman kuralları).
 */
export function BelgeKatmani({ onKapat, arac, children }: Props) {
  useEffect(() => {
    document.body.classList.add('yazi-modu');
    return () => document.body.classList.remove('yazi-modu');
  }, []);

  const [kurum, setKurum] = useState(kurumOku);

  return (
    <div className="yazi-katman fixed inset-0 z-40 overflow-y-auto bg-slate-900/50 p-4">
      <div className="mx-auto my-6 w-full max-w-3xl">
        <div className="no-print mb-3 flex flex-wrap items-center gap-2">
          <input
            value={kurum}
            onChange={(e) => {
              setKurum(e.target.value);
              kurumYaz(e.target.value);
            }}
            placeholder="Belediye adı (örn. Çeşme Belediye Başkanlığı)"
            className="min-w-[18rem] flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            aria-label="Kurum adı"
          />
          {arac}
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
          <KurumBaglami.Provider value={kurum}>{children}</KurumBaglami.Provider>
        </article>
      </div>
    </div>
  );
}

/** Belgelerin ortak antedi. */
export function BelgeBasligi({ baslik }: { baslik?: string }) {
  const kurum = useContext(KurumBaglami);
  return (
    <header className="text-center">
      <p className="font-semibold">T.C.</p>
      <p className="font-semibold uppercase">{kurum || '……………… BELEDİYE BAŞKANLIĞI'}</p>
      <p>İmar ve Şehircilik Müdürlüğü</p>
      {baslik && <h2 className="mt-6 text-lg font-semibold tracking-wide">{baslik}</h2>}
    </header>
  );
}

/** Belgelerde "etiket: değer" satırı. */
export function BelgeSatiri({ ad, deger }: { ad: string; deger?: string }) {
  return (
    <>
      <dt className="text-slate-600">{ad}</dt>
      <dd className="font-medium">{deger?.trim() ? deger : '…………'}</dd>
    </>
  );
}

/** Belge içinde başlıklı bölüm. */
export function BelgeBolumu({ baslik, children }: { baslik: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h3 className="border-b border-slate-300 pb-1 text-sm font-semibold uppercase tracking-wide">
        {baslik}
      </h3>
      <dl className="mt-2 grid grid-cols-[12rem_1fr] gap-x-4 gap-y-1 text-sm">{children}</dl>
    </section>
  );
}
