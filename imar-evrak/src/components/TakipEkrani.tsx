import { useState, type FormEvent } from 'react';
import { turAdi } from '../data';
import type { Durum, TakipSonucu } from '../types';
import { tarihGoster, tarihSaatGoster } from '../utils';

/** Vatandaşa gösterilen durum metinleri; iç terimler kullanılmaz. */
const DURUM_METNI: Record<Durum, { ad: string; aciklama: string; renk: string }> = {
  yeni: {
    ad: 'Başvurunuz alındı',
    aciklama: 'Başvurunuz kaydedildi, sıraya alındı.',
    renk: 'bg-sky-100 text-sky-900 ring-sky-300',
  },
  incelemede: {
    ad: 'İnceleniyor',
    aciklama: 'Dosyanız müdürlüğümüzce incelenmektedir.',
    renk: 'bg-amber-100 text-amber-900 ring-amber-300',
  },
  eksik: {
    ad: 'Eksik belge var',
    aciklama: 'Aşağıdaki belgeler tamamlanmadan işlem sürdürülemiyor.',
    renk: 'bg-orange-100 text-orange-900 ring-orange-300',
  },
  onaylandi: {
    ad: 'Onaylandı',
    aciklama: 'Başvurunuz olumlu sonuçlanmıştır. Belgenizi müdürlükten alabilirsiniz.',
    renk: 'bg-emerald-100 text-emerald-900 ring-emerald-300',
  },
  reddedildi: {
    ad: 'Reddedildi',
    aciklama: 'Başvurunuz reddedilmiştir. Gerekçe için müdürlüğümüze başvurun.',
    renk: 'bg-rose-100 text-rose-900 ring-rose-300',
  },
  arsiv: {
    ad: 'İşlem tamamlandı',
    aciklama: 'Dosyanız arşive alınmıştır.',
    renk: 'bg-slate-200 text-slate-800 ring-slate-300',
  },
};

export function TakipEkrani() {
  const [kod, setKod] = useState('');
  const [sonDort, setSonDort] = useState('');
  const [sonuc, setSonuc] = useState<TakipSonucu | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [bekliyor, setBekliyor] = useState(false);

  const sorgula = async (e: FormEvent) => {
    e.preventDefault();
    setBekliyor(true);
    setHata(null);
    setSonuc(null);
    try {
      const yanit = await fetch('/api/takip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kod, sonDort }),
      });
      const govde = (await yanit.json()) as TakipSonucu & { hata?: string };
      if (!yanit.ok) setHata(govde.hata ?? 'Sorgulama yapılamadı.');
      else setSonuc(govde);
    } catch {
      setHata('Bağlantı kurulamadı. Lütfen sonra tekrar deneyin.');
    } finally {
      setBekliyor(false);
    }
  };

  const durum = sonuc ? DURUM_METNI[sonuc.durum] : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <header>
        <h1 className="text-2xl font-semibold">İmar Başvuru Takibi</h1>
        <p className="mt-1 text-slate-600">
          Başvuru sırasında size verilen alındı belgesindeki <strong>takip kodu</strong> ile
          dosyanızın durumunu öğrenebilirsiniz.
        </p>
      </header>

      <form
        onSubmit={(e) => void sorgula(e)}
        className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <label className="block">
          <span className="block text-sm font-medium text-slate-700">Takip kodu</span>
          <input
            value={kod}
            onChange={(e) => setKod(e.target.value.toUpperCase())}
            placeholder="ABCD-EFGH-JKLM"
            required
            autoFocus
            className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-3 font-mono text-lg tracking-wider"
          />
        </label>

        <label className="mt-4 block">
          <span className="block text-sm font-medium text-slate-700">
            Telefon numaranızın son 4 hanesi
          </span>
          <input
            value={sonDort}
            onChange={(e) => setSonDort(e.target.value.replace(/\D/g, '').slice(0, 4))}
            inputMode="numeric"
            placeholder="1234"
            className="mt-1 w-40 rounded-lg border border-slate-300 px-4 py-3 text-lg tracking-widest"
          />
        </label>

        <button
          type="submit"
          disabled={bekliyor}
          className="mt-5 w-full rounded-lg bg-slate-900 px-5 py-3 text-base font-medium text-white hover:bg-slate-800 disabled:bg-slate-400"
        >
          {bekliyor ? 'Sorgulanıyor…' : 'Sorgula'}
        </button>

        {hata && (
          <p className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-900 ring-1 ring-rose-200">
            {hata}
          </p>
        )}
      </form>

      {sonuc && durum && (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-sm text-slate-500">{sonuc.no}</p>
              <h2 className="text-lg font-semibold">{sonuc.konu}</h2>
              <p className="text-sm text-slate-600">{turAdi(sonuc.tur)}</p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ring-1 ring-inset ${durum.renk}`}
            >
              {durum.ad}
            </span>
          </div>

          <p className="mt-4 text-slate-800">{durum.aciklama}</p>

          {sonuc.eksikBelgeler.length > 0 && (
            <div className="mt-4 rounded-xl bg-orange-50 p-4 ring-1 ring-orange-200">
              <h3 className="text-sm font-semibold text-orange-900">Tamamlanması gereken belgeler</h3>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-orange-900">
                {sonuc.eksikBelgeler.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ol>
            </div>
          )}

          {sonuc.uygunsuzBelgeler.length > 0 && (
            <div className="mt-3 rounded-xl bg-rose-50 p-4 ring-1 ring-rose-200">
              <h3 className="text-sm font-semibold text-rose-900">Yenilenmesi gereken belgeler</h3>
              <ul className="mt-2 space-y-1 pl-5 text-sm text-rose-900">
                {sonuc.uygunsuzBelgeler.map((b) => (
                  <li key={b.ad} className="list-disc">
                    {b.ad}
                    {b.neden ? ` — ${b.neden}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {sonuc.beklenenGorusler?.length > 0 && (
            <div className="mt-3 rounded-xl bg-sky-50 p-4 ring-1 ring-sky-200">
              <h3 className="text-sm font-semibold text-sky-900">Kurum görüşü bekleniyor</h3>
              <p className="mt-1 text-sm text-sky-900">
                Başvurunuz için aşağıdaki kurumlardan görüş istenmiştir; cevap gelene kadar işlem
                sürmektedir.
              </p>
              <ul className="mt-2 space-y-1 pl-5 text-sm text-sky-900">
                {sonuc.beklenenGorusler.map((k) => (
                  <li key={k} className="list-disc">
                    {k}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-200 pt-4 text-sm">
            <div>
              <dt className="text-slate-500">Başvuru tarihi</dt>
              <dd className="mt-0.5 font-medium">{tarihGoster(sonuc.gelisTarihi)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Son işlem</dt>
              <dd className="mt-0.5 font-medium">{tarihSaatGoster(sonuc.sonGuncelleme)}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-slate-500">Süre</dt>
              <dd className="mt-0.5 font-medium">
                {['onaylandi', 'reddedildi', 'arsiv'].includes(sonuc.durum)
                  ? 'Sonuçlandı'
                  : sonuc.kalanGun >= 0
                    ? `Tahmini sonuçlanma: ${sonuc.kalanGun} gün içinde (${sonuc.hedefGun} günlük hedef süre)`
                    : `Hedef süre ${Math.abs(sonuc.kalanGun)} gün aşıldı`}
              </dd>
            </div>
          </dl>

          <p className="mt-4 text-xs text-slate-500">
            Bu ekran bilgilendirme amaçlıdır. Resmi bilgi ve belgeler için İmar ve Şehircilik
            Müdürlüğü'ne başvurunuz.
          </p>
        </section>
      )}
    </div>
  );
}
