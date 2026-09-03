import { useEffect, useMemo, useRef, useState } from 'react';
import { AlindiBelgesi } from './components/AlindiBelgesi';
import { EksikBelgeYazisi } from './components/EksikBelgeYazisi';
import { EvrakDetay, type CiktiTuru } from './components/EvrakDetay';
import { EvrakFormu } from './components/EvrakFormu';
import { EvrakListesi } from './components/EvrakListesi';
import { Filtreler } from './components/Filtreler';
import { Giris } from './components/Giris';
import { GorusYazisi } from './components/GorusYazisi';
import { HarcTahakkuk } from './components/HarcTahakkuk';
import { ImarDurumuBelgesi } from './components/ImarDurumuBelgesi';
import { IskanBelgesi } from './components/IskanBelgesi';
import { Kullanicilar } from './components/Kullanicilar';
import { Panel } from './components/Panel';
import { RuhsatBelgesi } from './components/RuhsatBelgesi';
import { TarifeEkrani } from './components/Tarife';
import { YapiBilgileri } from './components/YapiBilgileri';
import { belgeListesi } from './belgeler';
import { KAPALI_DURUMLAR } from './data';
import { bekliyorMu } from './gorus';
import { VARSAYILAN_TARIFE, type Tarife } from './harc';
import { hazirlikDurumu } from './hazirlik';
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
  sadeceHazir: false,
  sadeceGorusBekleyen: false,
  sadeceOdenmemis: false,
};

/** Panelin ayrıntı bölümü açık mı — tarayıcıda hatırlanır. */
const PANEL_ANAHTARI = 'imar-evrak/panel-acik';

const panelAcikOku = (): boolean => {
  try {
    return localStorage.getItem(PANEL_ANAHTARI) !== '0';
  } catch {
    return true;
  }
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
  /** Yapı bilgileri formu açık olan evrak. */
  const [yapiId, setYapiId] = useState<string | null>(null);
  /** Açık resmî çıktı: hangi evrak, hangi belge. */
  const [cikti, setCikti] = useState<{ id: string; tur: CiktiTuru } | null>(null);
  /** Harç tahakkuk fişi açık olan evrak. */
  const [fisId, setFisId] = useState<string | null>(null);
  /** Görüş isteme yazısı açık olan kayıt. */
  const [gorusYazi, setGorusYazi] = useState<{ evrakId: string; gorusId: string } | null>(null);
  const [tarife, setTarife] = useState<Tarife>(VARSAYILAN_TARIFE);
  const [tarifeAcik, setTarifeAcik] = useState(false);
  const [panelAcik, setPanelAcik] = useState(panelAcikOku);
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
  const yapiEvraki = evraklar.find((e) => e.id === yapiId) ?? null;
  const ciktiEvraki = evraklar.find((e) => e.id === cikti?.id) ?? null;
  const fisEvraki = evraklar.find((e) => e.id === fisId) ?? null;
  const gorusEvraki = evraklar.find((e) => e.id === gorusYazi?.evrakId) ?? null;
  const acikGorus = gorusEvraki?.gorusler.find((g) => g.id === gorusYazi?.gorusId) ?? null;

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
        if (filtre.sadeceHazir && !(!KAPALI_DURUMLAR.includes(e.durum) && hazirlikDurumu(e).hazir)) {
          return false;
        }
        if (filtre.sadeceGorusBekleyen && !e.gorusler.some(bekliyorMu)) return false;
        if (filtre.sadeceOdenmemis && !(e.tahakkuk && !e.tahakkuk.makbuzNo)) return false;
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

  /** Sunucudan/yerelden tarifeyi bir kez alır; tahakkuk ekranları kullanır. */
  useEffect(() => {
    if (!depo || !hazir) return;
    depo
      .tarifeGetir()
      .then(setTarife)
      .catch(() => setTarife(VARSAYILAN_TARIFE));
  }, [depo, hazir]);

  /** Güncellenen evrakı listeye yazan ortak yardımcı. */
  const evrakYaz = (guncel: Evrak) =>
    setEvraklar((ö) => ö.map((e) => (e.id === guncel.id ? guncel : e)));

  const yapiKaydet = (evrakId: string, yapi: Record<string, string>) =>
    void calistir(async () => {
      if (!depo) return;
      evrakYaz(await depo.yapiKaydet(evrakId, yapi));
      setYapiId(null);
    });

  const gorusEkle = (evrakId: string, gorus: Parameters<Depo['gorusEkle']>[1]) =>
    void calistir(async () => {
      if (!depo) return;
      evrakYaz(await depo.gorusEkle(evrakId, gorus));
    });

  const gorusGuncelle = (gorusId: string, gorus: Parameters<Depo['gorusGuncelle']>[1]) =>
    void calistir(async () => {
      if (!depo) return;
      evrakYaz(await depo.gorusGuncelle(gorusId, gorus));
    });

  const gorusSil = (gorusId: string) =>
    void calistir(async () => {
      if (!depo || !confirm('Bu kurum görüşü kaydı silinsin mi?')) return;
      evrakYaz(await depo.gorusSil(gorusId));
    });

  const harcHesapla = (evrakId: string) =>
    void calistir(async () => {
      if (!depo) return;
      evrakYaz(await depo.tahakkukHesapla(evrakId));
    });

  const odemeKaydet = (evrakId: string, makbuzNo: string, odemeTarihi: string) =>
    void calistir(async () => {
      if (!depo) return;
      evrakYaz(await depo.odemeKaydet(evrakId, makbuzNo, odemeTarihi));
    });

  const tarifeKaydet = (yeni: Tarife) =>
    void calistir(async () => {
      if (!depo) return;
      setTarife(await depo.tarifeKaydet(yeni));
      setTarifeAcik(false);
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
            <h1 className="text-xl font-semibold">Yapı Kontrol Müdürlüğü İmar Evrak Takip</h1>
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
          <Panel
            evraklar={evraklar}
            onFiltre={(yama) => setFiltre({ ...BOS_FILTRE, ...yama })}
            onEvrakSec={setSeciliId}
            acik={panelAcik}
            onAcKapa={() => {
              const yeni = !panelAcik;
              setPanelAcik(yeni);
              try {
                localStorage.setItem(PANEL_ANAHTARI, yeni ? '1' : '0');
              } catch {
                // Depolama kapalıysa tercih bu oturumda geçerli olur.
              }
            }}
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
              onYapiDuzenle={() => setYapiId(secili.id)}
              onCikti={(tur) => setCikti({ id: secili.id, tur })}
              onHarcHesapla={() => harcHesapla(secili.id)}
              onHarcOdeme={(makbuzNo, odemeTarihi) =>
                odemeKaydet(secili.id, makbuzNo, odemeTarihi)
              }
              onHarcFisi={() => setFisId(secili.id)}
              onTarife={() => setTarifeAcik(true)}
              onGorusEkle={(gorus) => gorusEkle(secili.id, gorus)}
              onGorusGuncelle={gorusGuncelle}
              onGorusSil={gorusSil}
              onGorusYazisi={(gorusId) => setGorusYazi({ evrakId: secili.id, gorusId })}
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

      {yapiEvraki && (
        <YapiBilgileri
          key={yapiEvraki.id}
          evrak={yapiEvraki}
          onKapat={() => setYapiId(null)}
          onKaydet={(yapi) => yapiKaydet(yapiEvraki.id, yapi)}
        />
      )}

      {ciktiEvraki && cikti?.tur === 'ruhsat' && (
        <RuhsatBelgesi evrak={ciktiEvraki} onKapat={() => setCikti(null)} />
      )}
      {ciktiEvraki && cikti?.tur === 'iskan' && (
        <IskanBelgesi evrak={ciktiEvraki} onKapat={() => setCikti(null)} />
      )}
      {ciktiEvraki && cikti?.tur === 'imar-durumu' && (
        <ImarDurumuBelgesi evrak={ciktiEvraki} onKapat={() => setCikti(null)} />
      )}

      {fisEvraki?.tahakkuk && <HarcTahakkuk evrak={fisEvraki} onKapat={() => setFisId(null)} />}

      {gorusEvraki && acikGorus && (
        <GorusYazisi
          evrak={gorusEvraki}
          gorus={acikGorus}
          onKapat={() => setGorusYazi(null)}
        />
      )}

      {tarifeAcik && (
        <TarifeEkrani
          tarife={tarife}
          duzenlenebilir={!sunucuKipi || oturum?.rol === 'mudur'}
          onKapat={() => setTarifeAcik(false)}
          onKaydet={tarifeKaydet}
        />
      )}

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
