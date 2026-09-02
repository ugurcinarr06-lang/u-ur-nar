import { useEffect, useMemo, useRef, useState } from 'react';
import { EvrakDetay } from './components/EvrakDetay';
import { EvrakFormu } from './components/EvrakFormu';
import { EvrakListesi } from './components/EvrakListesi';
import { Filtreler } from './components/Filtreler';
import { Ozet } from './components/Ozet';
import { KAPALI_DURUMLAR, durumAdi } from './data';
import { evraklariOku, evraklariYaz, yedekCoz, yedekOlustur } from './storage';
import type { Durum, Evrak, Filtre } from './types';
import {
  csvOlustur,
  dosyaIndir,
  gecikmisMi,
  sonrakiEvrakNo,
  yeniId,
} from './utils';

const BOS_FILTRE: Filtre = {
  arama: '',
  durum: 'hepsi',
  tur: 'hepsi',
  sorumlu: 'hepsi',
  sadeceGeciken: false,
  sadeceAcik: false,
};

/** Bu sürümde oturum yok; işlem geçmişine yazılan sabit kullanıcı. */
const KULLANICI = 'İmar Personeli';

export default function App() {
  const [evraklar, setEvraklar] = useState<Evrak[]>(evraklariOku);
  const [filtre, setFiltre] = useState<Filtre>(BOS_FILTRE);
  const [seciliId, setSeciliId] = useState<string | null>(null);
  /** null: form kapalı · 'yeni': yeni kayıt · Evrak: düzenleme */
  const [form, setForm] = useState<'yeni' | Evrak | null>(null);
  const [uyari, setUyari] = useState<string | null>(null);
  const dosyaGirdisi = useRef<HTMLInputElement>(null);

  useEffect(() => evraklariYaz(evraklar), [evraklar]);

  const secili = evraklar.find((e) => e.id === seciliId) ?? null;

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

  const kaydet = (taslak: Omit<Evrak, 'id' | 'gecmis'>) => {
    if (form === 'yeni') {
      const yeni: Evrak = {
        ...taslak,
        id: yeniId(),
        gecmis: [
          {
            id: yeniId(),
            tarih: new Date().toISOString(),
            durum: taslak.durum,
            not: 'Evrak kaydı açıldı.',
            kullanici: KULLANICI,
          },
        ],
      };
      setEvraklar((ö) => [yeni, ...ö]);
      setSeciliId(yeni.id);
    } else if (form) {
      const id = form.id;
      setEvraklar((ö) =>
        ö.map((e) =>
          e.id === id
            ? {
                ...e,
                ...taslak,
                gecmis: [
                  ...e.gecmis,
                  {
                    id: yeniId(),
                    tarih: new Date().toISOString(),
                    durum: taslak.durum,
                    not: 'Kayıt bilgileri güncellendi.',
                    kullanici: KULLANICI,
                  },
                ],
              }
            : e,
        ),
      );
    }
    setForm(null);
  };

  const islemEkle = (id: string, durum: Durum, not: string) => {
    setEvraklar((ö) =>
      ö.map((e) =>
        e.id === id
          ? {
              ...e,
              durum,
              gecmis: [
                ...e.gecmis,
                {
                  id: yeniId(),
                  tarih: new Date().toISOString(),
                  durum,
                  not: not || `Durum "${durumAdi(durum)}" olarak güncellendi.`,
                  kullanici: KULLANICI,
                },
              ],
            }
          : e,
      ),
    );
  };

  const sil = (id: string) => {
    const e = evraklar.find((x) => x.id === id);
    if (!e) return;
    if (!confirm(`${e.no} numaralı evrak kalıcı olarak silinsin mi?`)) return;
    setEvraklar((ö) => ö.filter((x) => x.id !== id));
    setSeciliId(null);
  };

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
      if (!confirm(`${gelen.length} kayıt yüklenecek. Mevcut liste değiştirilsin mi?`)) return;
      setEvraklar(gelen);
      setSeciliId(null);
      setUyari(null);
    } catch (hata) {
      setUyari(hata instanceof Error ? hata.message : 'Yedek okunamadı.');
    }
  };

  const dugme =
    'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50';

  return (
    <div className="min-h-screen">
      <header className="no-print border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <h1 className="text-xl font-semibold">İmar Evrak Takip</h1>
            <p className="text-sm text-slate-500">
              Kayıt, durum takibi ve süre kontrolü — veriler bu tarayıcıda saklanır.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setForm('yeni')}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
              + Yeni evrak
            </button>
            <button type="button" className={dugme}
              onClick={() =>
                void indir(
                  `imar-evrak-${new Date().toISOString().slice(0, 10)}.csv`,
                  csvOlustur(listelenen),
                  'text/csv;charset=utf-8',
                )
              }>
              CSV indir
            </button>
            <button type="button" className={dugme} onClick={() => void yedekAl()}>
              Yedek al
            </button>
            <button type="button" className={dugme} onClick={() => dosyaGirdisi.current?.click()}>
              Yedek yükle
            </button>
            <button type="button" className={dugme} onClick={() => window.print()}>
              Yazdır
            </button>
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
              {listelenen.length} kayıt gösteriliyor
              {listelenen.length !== evraklar.length && ` (toplam ${evraklar.length})`}
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
        <div className="no-print fixed inset-0 z-20 flex justify-end bg-slate-900/40"
          onClick={() => setSeciliId(null)}>
          <div className="h-full w-full sm:max-w-xl" onClick={(e) => e.stopPropagation()}>
            <EvrakDetay
              key={secili.id}
              evrak={secili}
              onKapat={() => setSeciliId(null)}
              onDuzenle={() => setForm(secili)}
              onSil={() => sil(secili.id)}
              onIslem={(durum, not) => islemEkle(secili.id, durum, not)}
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
    </div>
  );
}
