import { useState, type FormEvent } from 'react';
import { TURLER, turHedefGun } from '../data';
import type { Evrak, Tur } from '../types';
import { bugun } from '../utils';

interface Props {
  /** Düzenlenecek kayıt; yeni kayıt için null. */
  evrak: Evrak | null;
  sonrakiNo: string;
  onKapat: () => void;
  onKaydet: (taslak: Omit<Evrak, 'id' | 'gecmis'>) => void;
}

const alan = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm';
const etiket = 'block text-xs font-medium uppercase tracking-wide text-slate-500';

export function EvrakFormu({ evrak, sonrakiNo, onKapat, onKaydet }: Props) {
  const [no, setNo] = useState(evrak?.no ?? sonrakiNo);
  const [konu, setKonu] = useState(evrak?.konu ?? '');
  const [tur, setTur] = useState<Tur>(evrak?.tur ?? 'ruhsat');
  const [gelisTarihi, setGelisTarihi] = useState(evrak?.gelisTarihi ?? bugun());
  const [hedefGun, setHedefGun] = useState(evrak?.hedefGun ?? turHedefGun('ruhsat'));
  const [ad, setAd] = useState(evrak?.basvuran.ad ?? '');
  const [telefon, setTelefon] = useState(evrak?.basvuran.telefon ?? '');
  const [mahalle, setMahalle] = useState(evrak?.tasinmaz.mahalle ?? '');
  const [ada, setAda] = useState(evrak?.tasinmaz.ada ?? '');
  const [parsel, setParsel] = useState(evrak?.tasinmaz.parsel ?? '');
  const [pafta, setPafta] = useState(evrak?.tasinmaz.pafta ?? '');
  const [sorumlu, setSorumlu] = useState(evrak?.sorumlu ?? '');
  const [aciklama, setAciklama] = useState(evrak?.aciklama ?? '');

  /** Tür değişince hedef süre o türün varsayılanına döner. */
  const turDegis = (yeni: Tur) => {
    setTur(yeni);
    setHedefGun(turHedefGun(yeni));
  };

  const gonder = (e: FormEvent) => {
    e.preventDefault();
    onKaydet({
      no: no.trim(),
      konu: konu.trim(),
      tur,
      durum: evrak?.durum ?? 'yeni',
      gelisTarihi,
      hedefGun,
      basvuran: { ad: ad.trim(), telefon: telefon.trim() },
      tasinmaz: {
        mahalle: mahalle.trim(),
        ada: ada.trim(),
        parsel: parsel.trim(),
        pafta: pafta.trim(),
      },
      sorumlu: sorumlu.trim(),
      aciklama: aciklama.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-30 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4">
      <form
        onSubmit={gonder}
        className="my-6 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 className="text-lg font-semibold">
          {evrak ? `Evrakı düzenle — ${evrak.no}` : 'Yeni evrak kaydı'}
        </h2>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="sm:col-span-1">
            <span className={etiket}>Evrak no</span>
            <input value={no} onChange={(e) => setNo(e.target.value)} required className={alan} />
          </label>

          <label>
            <span className={etiket}>Geliş tarihi</span>
            <input
              type="date"
              value={gelisTarihi}
              onChange={(e) => setGelisTarihi(e.target.value)}
              required
              className={alan}
            />
          </label>

          <label className="sm:col-span-2">
            <span className={etiket}>Konu</span>
            <input
              value={konu}
              onChange={(e) => setKonu(e.target.value)}
              required
              placeholder="örn. 2 katlı konut için yapı ruhsatı"
              className={alan}
            />
          </label>

          <label>
            <span className={etiket}>Evrak türü</span>
            <select
              value={tur}
              onChange={(e) => turDegis(e.target.value as Tur)}
              className={alan}
            >
              {TURLER.map((t) => (
                <option key={t.deger} value={t.deger}>
                  {t.ad}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className={etiket}>Hedef süre (gün)</span>
            <input
              type="number"
              min={1}
              max={365}
              value={hedefGun}
              onChange={(e) => setHedefGun(Number(e.target.value))}
              className={alan}
            />
          </label>

          <label>
            <span className={etiket}>Başvuran</span>
            <input
              value={ad}
              onChange={(e) => setAd(e.target.value)}
              required
              className={alan}
            />
          </label>

          <label>
            <span className={etiket}>Telefon</span>
            <input value={telefon} onChange={(e) => setTelefon(e.target.value)} className={alan} />
          </label>

          <label>
            <span className={etiket}>Mahalle</span>
            <input value={mahalle} onChange={(e) => setMahalle(e.target.value)} className={alan} />
          </label>

          <label>
            <span className={etiket}>Pafta</span>
            <input value={pafta} onChange={(e) => setPafta(e.target.value)} className={alan} />
          </label>

          <label>
            <span className={etiket}>Ada</span>
            <input value={ada} onChange={(e) => setAda(e.target.value)} className={alan} />
          </label>

          <label>
            <span className={etiket}>Parsel</span>
            <input value={parsel} onChange={(e) => setParsel(e.target.value)} className={alan} />
          </label>

          <label className="sm:col-span-2">
            <span className={etiket}>Sorumlu personel</span>
            <input value={sorumlu} onChange={(e) => setSorumlu(e.target.value)} className={alan} />
          </label>

          <label className="sm:col-span-2">
            <span className={etiket}>Açıklama</span>
            <textarea
              value={aciklama}
              onChange={(e) => setAciklama(e.target.value)}
              rows={3}
              className={alan}
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onKapat}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Vazgeç
          </button>
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            {evrak ? 'Güncelle' : 'Kaydet'}
          </button>
        </div>
      </form>
    </div>
  );
}
