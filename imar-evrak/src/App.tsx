import { useEffect, useMemo, useRef, useState } from 'react';
import { AlindiBelgesi } from './components/AlindiBelgesi';
import { EksikBelgeYazisi } from './components/EksikBelgeYazisi';
import { EvrakDetay } from './components/EvrakDetay';
import { EvrakFormu } from './components/EvrakFormu';
import { EvrakListesi } from './components/EvrakListesi';
import { Filtreler } from './components/Filtreler';
import { Giris } from './components/Giris';
import { Kullanicilar } from './components/Kullanicilar';
import { Ozet } from './components/Ozet';
import { belgeListesi } from './belgeler';
import { KAPALI_DURUMLAR } from './data';
import { yedekCoz, yedekOlustur } from './storage';
import type { Durum, Evrak, Filtre, Taslak } from './types';
import { csvOlustur, dosyaIndir, gecikmisMi, sonrakiEvrakNo } from './utils';
import {
  baslangicBelirle,
  cikisYap,
  type Baslangic,
  type Depo,
  type KurumSorgusu,
  type Oturum,
} from './veri/depo';

const BOS_FILTRE: Filtre = {
  arama: '',
  durum: 'hepsi',
  tur: 'hepsi',
  sorumlu: 'hepsi',
  sadeceGeciken: false,
  sadeceAcik: false,
};

export default function App() {
  const [baslangic, setBaslangic] = useState<Baslangic | null>(null);
  const [oturum, setOturum] = useState<Oturum | null>(null);
  const [evraklar, setEvraklar] = useState<Evrak[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [filtre, setFiltre] = useState<Filtre>(BOS_FILTRE);
  const [seciliId, setSeciliId] = useState<string | null>(null);
  /** null: form kapalı · 'yeni': yeni kayıt · Evrak: düzenleme */
  const [form, setForm] = useState<'yeni' | Evrak | null>(null);
  const [hesapAcik, setHesapAcik] = useState(false);
  /** Eksik belge yazısı açık olan evrakın kimliği. */
  const [yaziId, setYaziId] = useState<string | null>(null);
  /** Alındı belgesi açık olan evrakın kimliği. */
  const [alindiId, setAlindiId] = useState<string | null>(null);
  /** Seçili evrakın kurum sorgu geçmişi. */
  const [kurumGecmisi, setKurumGecmisi] = useState<KurumSorgusu[]>([]);
  const [uyari, setUyari] = useState<string | null>(null);
  const dosyaGirdisi = useRef<HTMLInputElement>(null);

  const depo: Depo | null = baslangic?.depo ?? null;
  const sunucuKipi = depo?.kip === 'sunucu';
  /** Sunucu kipinde giriş yapılmadan liste okunamaz. */
  const hazir = depo !== null && (!sunucuKipi || oturum !== null);

  useEffect(() => {
    baslangicBelirle()
      .then((b) => {
        setBaslangic(b);
        setOturum(b.oturum);
      })
      .catch(() => setUyari('Uygulama başlatılamadı.'));
  }, []);

  useEffect(() => {
    if (!depo || !hazir) return;
    let iptal = false;
    setYukleniyor(true);
    depo
      .liste()
      .then((liste) => {
        if (!iptal) setEvraklar(liste);
      })
      .catch((h: unknown) => setUyari(h instanceof Error ? h.message : 'Kayıtlar alınamadı.'))
      .finally(() => {
        if (!iptal) setYukleniyor(false);
      });
    return () => {
      iptal = true;
    };
  }, [depo, hazir]);

  const secili = evraklar.find((e) => e.id === seciliId) ?? null;
  const yazi = evraklar.find((e) => e.id === yaziId) ?? null;
  const alindi = evraklar.find((e) => e.id === alindiId) ?? null;

  /** İnceleme arka planda sürdüğü için biten sonuçları yoklayarak alırız. */
  const bekleyenInceleme = evraklar.some((e) =>
    e.ekler.some((x) => x.inceleme?.durum === 'bekliyor' || x.inceleme?.durum === 'inceleniyor'),
  );

  useEffect(() => {
    if (!depo || !bekleyenInceleme) return;
    const zamanlayici = setInterval(() => {
      depo
        .liste()
        .then(setEvraklar)
        .catch(() => undefined);
    }, 3000);
    return () => clearInterval(zamanlayici);
  }, [depo, bekleyenInceleme]);

  const sorumlular = useMemo(
    () => [...new Set(evraklar.map((e) => e.sorumlu).filter(Boolean))].sort(),
    [evraklar],
  );

  const listelenen = useMemo(() => {
    const q = filtre.arama.trim().toLocaleLowerCase('tr');
    return evraklar
      .filter((e) => {
        if (filtre.durum !== 'hepsi' && e.durum !== filtre.durum) return false;
        if (filtre.tur !== 'hepsi' && e.tur !== filtre.tur) return false;
        if (filtre.sorumlu !== 'hepsi' && e.sorumlu !== filtre.sorumlu) return false;
        if (filtre.sadeceAcik && KAPALI_DURUMLAR.includes(e.durum)) return false;
        if (filtre.sadeceGeciken && !gecikmisMi(e)) return false;
        if (!q) return true;
        return [
          e.no,
          e.konu,
          e.basvuran.ad,
          e.sorumlu,
          e.tasinmaz.mahalle,
          `${e.tasinmaz.ada}/${e.tasinmaz.parsel}`,
          e.tasinmaz.pafta,
        ]
          .join(' ')
          .toLocaleLowerCase('tr')
          .includes(q);
      })
      .sort((a, b) => b.gelisTarihi.localeCompare(a.gelisTarihi) || b.no.localeCompare(a.no));
  }, [evraklar, filtre]);

  const filtreAktif = JSON.stringify(filtre) !== JSON.stringify(BOS_FILTRE);

  /** Sunucu hatalarını tek yerde uyarıya çevirir. */
  const calistir = async (is: () => Promise<void>) => {
    try {
      await is();
      setUyari(null);
    } catch (hata) {
      setUyari(hata instanceof Error ? hata.message : 'İşlem tamamlanamadı.');
    }
  };

  const kaydet = (taslak: Taslak) =>
    void calistir(async () => {
      if (!depo) return;
      if (form === 'yeni') {
        const yeni = await depo.ekle(taslak);
        setEvraklar((ö) => [yeni, ...ö]);
        setSeciliId(yeni.id);
      } else if (form) {
        const guncel = await depo.guncelle(form.id, taslak);
        setEvraklar((ö) => ö.map((e) => (e.id === guncel.id ? guncel : e)));
      }
      setForm(null);
    });

  const islemEkle = (id: string, durum: Durum, not: string) =>
    void calistir(async () => {
      if (!depo) return;
      const guncel = await depo.islemEkle(id, durum, not);
      setEvraklar((ö) => ö.map((e) => (e.id === guncel.id ? guncel : e)));
    });

  const sil = (id: string) =>
    void calistir(async () => {
      if (!depo) return;
      const e = evraklar.find((x) => x.id === id);
      if (!e || !confirm(`${e.no} numaralı evrak kalıcı olarak silinsin mi?`)) return;
      await depo.sil(id);
      setEvraklar((ö) => ö.filter((x) => x.id !== id));
      setSeciliId(null);
    });

  const belgeIsaretle = (evrakId: string, kod: string, teslim: boolean) =>
    void calistir(async () => {
      if (!depo) return;
      const guncel = await depo.belgeIsaretle(evrakId, kod, teslim);
      setEvraklar((ö) => ö.map((e) => (e.id === guncel.id ? guncel : e)));
    });

  const ekYukle = (evrakId: string, dosyalar: File[], belgeKodu: string) =>
    void calistir(async () => {
      if (!depo?.ekYukle) return;
      const guncel = await depo.ekYukle(evrakId, dosyalar, belgeKodu);
      setEvraklar((ö) => ö.map((e) => (e.id === guncel.id ? guncel : e)));
    });

  const belgeKarar = (
    evrakId: string,
    kod: string,
    karar: 'uygun' | 'uygunsuz' | '',
    not: string,
  ) =>
    void calistir(async () => {
      if (!depo?.belgeKarar) return;
      const guncel = await depo.belgeKarar(evrakId, kod, karar, not);
      setEvraklar((ö) => ö.map((e) => (e.id === guncel.id ? guncel : e)));
    });

  useEffect(() => {
    if (!depo?.kurumGecmisi || !seciliId) {
      setKurumGecmisi([]);
      return;
    }
    depo
      .kurumGecmisi(seciliId)
      .then(setKurumGecmisi)
      .catch(() => setKurumGecmisi([]));
  }, [depo, seciliId]);

  const kurumSorgula = (evrakId: string, tur: 'takbis' | 'yambis', belgeNo: string) =>
    void calistir(async () => {
      if (!depo?.kurumSorgula || !depo.kurumGecmisi) return;
      const { evrak } = await depo.kurumSorgula(evrakId, tur, belgeNo);
      setEvraklar((ö) => ö.map((e) => (e.id === evrak.id ? evrak : e)));
      setKurumGecmisi(await depo.kurumGecmisi(evrakId));
    });

  const belgeDogrulama = (
    evrakId: string,
    kod: string,
    dogrulamaKodu: string,
    dogrulandi: boolean,
  ) =>
    void calistir(async () => {
      if (!depo?.belgeDogrulama) return;
      const guncel = await depo.belgeDogrulama(evrakId, kod, dogrulamaKodu, dogrulandi);
      setEvraklar((ö) => ö.map((e) => (e.id === guncel.id ? guncel : e)));
    });

  const incelemeYenile = (ekId: string) =>
    void calistir(async () => {
      if (!depo?.incelemeYenile) return;
      const guncel = await depo.incelemeYenile(ekId);
      setEvraklar((ö) => ö.map((e) => (e.id === guncel.id ? guncel : e)));
    });

  const ekSil = (ekId: string) =>
    void calistir(async () => {
      if (!depo?.ekSil || !confirm('Bu dosya kalıcı olarak silinsin mi?')) return;
      const guncel = await depo.ekSil(ekId);
      setEvraklar((ö) => ö.map((e) => (e.id === guncel.id ? guncel : e)));
    });

  const cikis = () =>
    void calistir(async () => {
      await cikisYap();
      setOturum(null);
      setEvraklar([]);
      setSeciliId(null);
    });

  /** İndirme kullanıcı onayına bağlı olabilir; reddedilirse sessizce geçilir. */
  const indir = async (adi: string, icerik: string, tip: string) => {
    try {
      await dosyaIndir(adi, icerik, tip);
      setUyari(null);
    } catch (hata) {
      const kod = (hata as { code?: string } | null)?.code;
      if (kod === 'declined') return;
      setUyari(
        kod === 'too_large'
          ? 'Dosya çok büyük, indirilemedi.'
          : 'Dosya indirilemedi. Tarayıcı bu sayfada indirmeye izin vermiyor olabilir.',
      );
    }
  };

  const yedekAl = () =>
    indir(
      `imar-evrak-yedek-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(yedekOlustur(evraklar), null, 2),
      'application/json',
    );

  const yedekYukle = async (dosya: File) => {
    try {
      const gelen = yedekCoz(await dosya.text());
      if (!depo?.topluYaz) return;
      if (!confirm(`${gelen.length} kayıt yüklenecek. Mevcut liste değiştirilsin mi?`)) return;
      await depo.topluYaz(gelen);
      setEvraklar(gelen);
      setSeciliId(null);
      setUyari(null);
    } catch (hata) {
      setUyari(hata instanceof Error ? hata.message : 'Yedek okunamadı.');
    }
  };

  const dugme =
    'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50';

  if (!baslangic) {
    return <p className="p-10 text-center text-slate-500">Yükleniyor…</p>;
  }

  if (sunucuKipi && !oturum) {
    return <Giris onGiris={setOturum} />;
  }

  return (
    <div className="min-h-screen">
      <header className="no-print border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <h1 className="text-xl font-semibold">İmar Evrak Takip</h1>
            <p className="text-sm text-slate-500">
              {sunucuKipi
                ? `${oturum?.ad} · ${oturum?.rol === 'mudur' ? 'Müdür' : 'Memur'} — kayıtlar ortak veritabanında`
                : 'Kayıt, durum takibi ve süre kontrolü — veriler bu tarayıcıda saklanır.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setForm('yeni')}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              + Yeni evrak
            </button>
            <button
              type="button"
              className={dugme}
              onClick={() =>
                void indir(
                  `imar-evrak-${new Date().toISOString().slice(0, 10)}.csv`,
                  csvOlustur(listelenen),
                  'text/csv;charset=utf-8',
                )
              }
            >
              CSV indir
            </button>
            <button type="button" className={dugme} onClick={() => void yedekAl()}>
              Yedek al
            </button>
            {depo?.topluYaz && (
              <button type="button" className={dugme} onClick={() => dosyaGirdisi.current?.click()}>
                Yedek yükle
              </button>
            )}
            <button type="button" className={dugme} onClick={() => window.print()}>
              Yazdır
            </button>
            {sunucuKipi && (
              <>
                <button type="button" className={dugme} onClick={() => setHesapAcik(true)}>
                  Hesap
                </button>
                <button type="button" className={dugme} onClick={cikis}>
                  Çıkış
                </button>
              </>
            )}
            <input
              ref={dosyaGirdisi}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                const d = e.target.files?.[0];
                if (d) void yedekYukle(d);
                e.target.value = '';
              }}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-5 px-4 py-6">
        {uyari && (
          <div className="no-print flex items-center justify-between rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-800 ring-1 ring-rose-200">
            {uyari}
            <button type="button" onClick={() => setUyari(null)} className="font-medium">
              Kapat
            </button>
          </div>
        )}

        <div className="no-print">
          <Ozet
            evraklar={evraklar}
            onFiltre={(tur) =>
              setFiltre({
                ...BOS_FILTRE,
                sadeceAcik: tur === 'acik',
                sadeceGeciken: tur === 'geciken',
                durum: tur === 'eksik' ? 'eksik' : 'hepsi',
              })
            }
          />
        </div>

        <div className="no-print space-y-2">
          <Filtreler filtre={filtre} sorumlular={sorumlular} onDegis={setFiltre} />
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span>
              {yukleniyor
                ? 'Kayıtlar alınıyor…'
                : `${listelenen.length} kayıt gösteriliyor${
                    listelenen.length !== evraklar.length ? ` (toplam ${evraklar.length})` : ''
                  }`}
            </span>
            {filtreAktif && (
              <button
                type="button"
                onClick={() => setFiltre(BOS_FILTRE)}
                className="font-medium text-slate-700 underline"
              >
                filtreleri temizle
              </button>
            )}
          </div>
        </div>

        <EvrakListesi evraklar={listelenen} seciliId={seciliId} onSec={setSeciliId} />
      </main>

      {secili && (
        <div
          className="no-print fixed inset-0 z-20 flex justify-end bg-slate-900/40"
          onClick={() => setSeciliId(null)}
        >
          <div className="h-full w-full sm:max-w-xl" onClick={(e) => e.stopPropagation()}>
            <EvrakDetay
              key={secili.id}
              evrak={secili}
              evraklar={evraklar}
              onEvrakSec={setSeciliId}
              onParselFiltre={() =>
                setFiltre({
                  ...BOS_FILTRE,
                  arama: `${secili.tasinmaz.ada}/${secili.tasinmaz.parsel}`,
                })
              }
              silinebilir={!sunucuKipi || oturum?.rol === 'mudur'}
              onKapat={() => setSeciliId(null)}
              onDuzenle={() => setForm(secili)}
              onSil={() => sil(secili.id)}
              onIslem={(durum, not) => islemEkle(secili.id, durum, not)}
              onEkYukle={
                depo?.ekYukle
                  ? (dosyalar, belgeKodu) => ekYukle(secili.id, dosyalar, belgeKodu)
                  : undefined
              }
              onEkSil={depo?.ekSil ? ekSil : undefined}
              ekAdresi={depo?.ekAdresi}
              ekSilinebilir={(ek) => oturum?.rol === 'mudur' || ek.yukleyen === oturum?.ad}
              onBelgeIsaretle={(kod, teslim) => belgeIsaretle(secili.id, kod, teslim)}
              onBelgeKarar={
                depo?.belgeKarar
                  ? (kod, karar, not) => belgeKarar(secili.id, kod, karar, not)
                  : undefined
              }
              onBelgeDogrulama={
                depo?.belgeDogrulama
                  ? (kod, dogrulamaKodu, dogrulandi) =>
                      belgeDogrulama(secili.id, kod, dogrulamaKodu, dogrulandi)
                  : undefined
              }
              onKurumSorgu={
                depo?.kurumSorgula
                  ? (tur, belgeNo) => kurumSorgula(secili.id, tur, belgeNo)
                  : undefined
              }
              kurumGecmisi={kurumGecmisi}
              onIncelemeYenile={depo?.incelemeYenile ? incelemeYenile : undefined}
              onEksikYazi={() => setYaziId(secili.id)}
              onAlindiBelgesi={() => setAlindiId(secili.id)}
            />
          </div>
        </div>
      )}

      {form && (
        <EvrakFormu
          key={form === 'yeni' ? 'yeni' : form.id}
          evrak={form === 'yeni' ? null : form}
          sonrakiNo={sonrakiEvrakNo(evraklar)}
          onKapat={() => setForm(null)}
          onKaydet={kaydet}
        />
      )}

      {hesapAcik && oturum && <Kullanicilar ben={oturum} onKapat={() => setHesapAcik(false)} />}

      {alindi && <AlindiBelgesi evrak={alindi} onKapat={() => setAlindiId(null)} />}

      {yazi && (
        <EksikBelgeYazisi
          evrak={yazi}
          eksikler={belgeListesi(yazi.tur).filter(
            (b) => b.zorunlu && !yazi.belgeler.some((x) => x.kod === b.kod && x.teslim),
          )}
          onKapat={() => setYaziId(null)}
        />
      )}
    </div>
  );
}
