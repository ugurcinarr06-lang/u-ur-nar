import { useState, type FormEvent } from 'react';
import { girisYap, type Oturum } from '../veri/depo';

export function Giris({ onGiris }: { onGiris: (oturum: Oturum) => void }) {
  const [kullaniciAdi, setKullaniciAdi] = useState('');
  const [sifre, setSifre] = useState('');
  const [hata, setHata] = useState<string | null>(null);
  const [bekliyor, setBekliyor] = useState(false);

  const gonder = async (e: FormEvent) => {
    e.preventDefault();
    setBekliyor(true);
    setHata(null);
    try {
      onGiris(await girisYap(kullaniciAdi, sifre));
    } catch (h) {
      setHata(h instanceof Error ? h.message : 'Giriş yapılamadı.');
      setBekliyor(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={(e) => void gonder(e)}
        className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"
      >
        <h1 className="text-xl font-semibold">Yapı Kontrol Müdürlüğü İmar Evrak Takip</h1>
        <p className="mt-1 text-sm text-slate-500">Devam etmek için giriş yapın.</p>

        <label className="mt-6 block">
          <span className="block text-xs font-medium uppercase tracking-wide text-slate-500">
            Kullanıcı adı
          </span>
          <input
            value={kullaniciAdi}
            onChange={(e) => setKullaniciAdi(e.target.value)}
            autoFocus
            required
            autoComplete="username"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="mt-4 block">
          <span className="block text-xs font-medium uppercase tracking-wide text-slate-500">
            Şifre
          </span>
          <input
            type="password"
            value={sifre}
            onChange={(e) => setSifre(e.target.value)}
            required
            autoComplete="current-password"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        {hata && (
          <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800 ring-1 ring-rose-200">
            {hata}
          </p>
        )}

        <button
          type="submit"
          disabled={bekliyor}
          className="mt-6 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:bg-slate-400"
        >
          {bekliyor ? 'Giriş yapılıyor…' : 'Giriş yap'}
        </button>
      </form>
    </div>
  );
}
