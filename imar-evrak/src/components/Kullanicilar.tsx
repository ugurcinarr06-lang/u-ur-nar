import { useEffect, useState, type FormEvent } from 'react';
import {
  bildirimTara,
  bildirimTekrar,
  bildirimleriGetir,
  kullaniciEkle,
  kullaniciSil,
  kullanicilariGetir,
  sifreDegistir,
  type Bildirim,
  type Oturum,
  type Rol,
} from '../veri/depo';
import { tarihSaatGoster } from '../utils';

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
  const [yeniEposta, setYeniEposta] = useState('');
  const [bildirimler, setBildirimler] = useState<Bildirim[]>([]);

  const [eskiSifre, setEskiSifre] = useState('');
  const [yeniSifrem, setYeniSifrem] = useState('');

  const mudur = ben.rol === 'mudur';

  useEffect(() => {
    if (!mudur) return;
    kullanicilariGetir()
      .then(setListe)
      .catch((h: unknown) => setHata(h instanceof Error ? h.message : 'Liste alınamadı.'));
    bildirimleriGetir()
      .then(setBildirimler)
      .catch(() => undefined);
  }, [mudur]);

  const tara = async () => {
    setHata(null);
    try {
      const sonuc = await bildirimTara();
      setBildirimler(await bildirimleriGetir());
      setBilgi(
        `${sonuc.uretilen} yeni bildirim üretildi, ${sonuc.gonderildi} gönderildi` +
          (sonuc.hata ? `, ${sonuc.hata} hata` : '.'),
      );
    } catch (h) {
      setHata(h instanceof Error ? h.message : 'Tarama yapılamadı.');
    }
  };

  const tekrar = async (id: string) => {
    try {
      setBildirimler(await bildirimTekrar(id));
    } catch (h) {
      setHata(h instanceof Error ? h.message : 'Tekrar denenemedi.');
    }
  };

  const ekle = async (e: FormEvent) => {
    e.preventDefault();
    setHata(null);
    try {
      await kullaniciEkle({
        kullaniciAdi: yeniKullaniciAdi,
        ad: yeniAd,
        rol: yeniRol,
        sifre: yeniSifre,
        eposta: yeniEposta,
      });
      setListe(await kullanicilariGetir());
      setYeniAd('');
      setYeniKullaniciAdi('');
      setYeniSifre('');
      setYeniEposta('');
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
                      {k.eposta && <span className="text-slate-400"> · {k.eposta}</span>}
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
                <label className="sm:col-span-2">
                  <span className={etiket}>E-posta (süre hatırlatmaları için)</span>
                  <input
                    type="email"
                    value={yeniEposta}
                    onChange={(e) => setYeniEposta(e.target.value)}
                    placeholder="ad.soyad@belediye.gov.tr"
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
            <section>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Bildirimler</h3>
                <button type="button" onClick={() => void tara()} className="text-xs font-medium text-slate-700 underline">
                  şimdi tara ve gönder
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Kanallar: e-posta {ben.bildirim?.eposta ?? '—'} · SMS {ben.bildirim?.sms ?? '—'}
              </p>
              {bildirimler.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">Henüz bildirim üretilmedi.</p>
              ) : (
                <ul className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200">
                  {bildirimler.map((b) => (
                    <li key={b.id} className="px-3 py-2 text-sm">
                      <div className="flex items-start justify-between gap-3">
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{b.konu}</span>
                          <span className="block text-xs text-slate-500">
                            {b.kanal} · {b.hedef} · {tarihSaatGoster(b.olusturma)}
                          </span>
                          {b.hata && <span className="block text-xs text-rose-700">{b.hata}</span>}
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs ring-1 ring-inset ${
                              b.durum === 'gonderildi'
                                ? 'bg-emerald-100 text-emerald-800 ring-emerald-300'
                                : b.durum === 'hata'
                                  ? 'bg-rose-100 text-rose-800 ring-rose-300'
                                  : 'bg-slate-100 text-slate-700 ring-slate-300'
                            }`}
                          >
                            {b.durum}
                          </span>
                          {b.durum !== 'gonderildi' && (
                            <button
                              type="button"
                              onClick={() => void tekrar(b.id)}
                              className="text-xs text-slate-600 underline"
                            >
                              tekrar
                            </button>
                          )}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
