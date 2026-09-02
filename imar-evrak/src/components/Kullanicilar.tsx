import { useEffect, useState, type FormEvent } from 'react';
import {
  kullaniciEkle,
  kullaniciSil,
  kullanicilariGetir,
  sifreDegistir,
  type Oturum,
  type Rol,
} from '../veri/depo';

const alan = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm';
const etiket = 'block text-xs font-medium uppercase tracking-wide text-slate-500';

/** Müdür için personel yönetimi, herkes için şifre değiştirme. */
export function Kullanicilar({ ben, onKapat }: { ben: Oturum; onKapat: () => void }) {
  const [liste, setListe] = useState<Oturum[]>([]);
  const [hata, setHata] = useState<string | null>(null);
  const [bilgi, setBilgi] = useState<string | null>(null);

  const [yeniAd, setYeniAd] = useState('');
  const [yeniKullaniciAdi, setYeniKullaniciAdi] = useState('');
  const [yeniRol, setYeniRol] = useState<Rol>('memur');
  const [yeniSifre, setYeniSifre] = useState('');

  const [eskiSifre, setEskiSifre] = useState('');
  const [yeniSifrem, setYeniSifrem] = useState('');

  const mudur = ben.rol === 'mudur';

  useEffect(() => {
    if (!mudur) return;
    kullanicilariGetir()
      .then(setListe)
      .catch((h: unknown) => setHata(h instanceof Error ? h.message : 'Liste alınamadı.'));
  }, [mudur]);

  const ekle = async (e: FormEvent) => {
    e.preventDefault();
    setHata(null);
    try {
      await kullaniciEkle({
        kullaniciAdi: yeniKullaniciAdi,
        ad: yeniAd,
        rol: yeniRol,
        sifre: yeniSifre,
      });
      setListe(await kullanicilariGetir());
      setYeniAd('');
      setYeniKullaniciAdi('');
      setYeniSifre('');
      setBilgi('Personel eklendi.');
    } catch (h) {
      setHata(h instanceof Error ? h.message : 'Personel eklenemedi.');
    }
  };

  const sil = async (k: Oturum) => {
    if (!confirm(`${k.ad} hesabı silinsin mi?`)) return;
    try {
      await kullaniciSil(k.id);
      setListe(await kullanicilariGetir());
    } catch (h) {
      setHata(h instanceof Error ? h.message : 'Silinemedi.');
    }
  };

  const sifreGonder = async (e: FormEvent) => {
    e.preventDefault();
    setHata(null);
    try {
      await sifreDegistir(eskiSifre, yeniSifrem);
      setEskiSifre('');
      setYeniSifrem('');
      setBilgi('Şifreniz değiştirildi.');
    } catch (h) {
      setHata(h instanceof Error ? h.message : 'Şifre değiştirilemedi.');
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4">
      <div className="my-6 w-full max-w-2xl space-y-6 rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-semibold">Hesap ve personel</h2>
          <button
            type="button"
            onClick={onKapat}
            className="rounded-lg px-2 py-1 text-2xl leading-none text-slate-400 hover:bg-slate-100"
            aria-label="Kapat"
          >
            ×
          </button>
        </div>

        {hata && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800 ring-1 ring-rose-200">
            {hata}
          </p>
        )}
        {bilgi && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ring-1 ring-emerald-200">
            {bilgi}
          </p>
        )}

        <section>
          <h3 className="text-sm font-medium">Şifremi değiştir</h3>
          <form onSubmit={(e) => void sifreGonder(e)} className="mt-3 flex flex-wrap gap-2">
            <input
              type="password"
              value={eskiSifre}
              onChange={(e) => setEskiSifre(e.target.value)}
              placeholder="Mevcut şifre"
              required
              autoComplete="current-password"
              className={`${alan} flex-1`}
            />
            <input
              type="password"
              value={yeniSifrem}
              onChange={(e) => setYeniSifrem(e.target.value)}
              placeholder="Yeni şifre (en az 6 karakter)"
              required
              autoComplete="new-password"
              className={`${alan} flex-1`}
            />
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              Değiştir
            </button>
          </form>
        </section>

        {mudur && (
          <>
            <section>
              <h3 className="text-sm font-medium">Personel</h3>
              <ul className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200">
                {liste.map((k) => (
                  <li key={k.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span>
                      <span className="font-medium">{k.ad}</span>
                      <span className="text-slate-500"> · {k.kullaniciAdi}</span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ring-1 ring-inset ${
                          k.rol === 'mudur'
                            ? 'bg-sky-100 text-sky-800 ring-sky-300'
                            : 'bg-slate-100 text-slate-700 ring-slate-300'
                        }`}
                      >
                        {k.rol === 'mudur' ? 'Müdür' : 'Memur'}
                      </span>
                      {k.id !== ben.id && (
                        <button
                          type="button"
                          onClick={() => void sil(k)}
                          className="text-xs font-medium text-rose-700 hover:underline"
                        >
                          sil
                        </button>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="text-sm font-medium">Yeni personel ekle</h3>
              <form
                onSubmit={(e) => void ekle(e)}
                className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2"
              >
                <label>
                  <span className={etiket}>Ad soyad</span>
                  <input
                    value={yeniAd}
                    onChange={(e) => setYeniAd(e.target.value)}
                    required
                    className={alan}
                  />
                </label>
                <label>
                  <span className={etiket}>Kullanıcı adı</span>
                  <input
                    value={yeniKullaniciAdi}
                    onChange={(e) => setYeniKullaniciAdi(e.target.value)}
                    required
                    className={alan}
                  />
                </label>
                <label>
                  <span className={etiket}>Yetki</span>
                  <select
                    value={yeniRol}
                    onChange={(e) => setYeniRol(e.target.value as Rol)}
                    className={alan}
                  >
                    <option value="memur">Memur — kayıt açar, işlem yapar</option>
                    <option value="mudur">Müdür — ayrıca siler, personel yönetir</option>
                  </select>
                </label>
                <label>
                  <span className={etiket}>Geçici şifre</span>
                  <input
                    value={yeniSifre}
                    onChange={(e) => setYeniSifre(e.target.value)}
                    required
                    minLength={6}
                    className={alan}
                  />
                </label>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white"
                  >
                    Personeli ekle
                  </button>
                </div>
              </form>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
