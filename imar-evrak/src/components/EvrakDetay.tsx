import { useRef, useState } from 'react';
import { DOGRULANABILIR, belgeListesi } from '../belgeler';
import { DURUMLAR, turAdi } from '../data';
import { hazirlikDurumu } from '../hazirlik';
import { ayniParsel } from '../parsel';
import type { Durum, Ek, Evrak } from '../types';
import { boyutGoster, gunFarki, tarihGoster, tarihSaatGoster } from '../utils';
import { HazirlikKutusu } from './HazirlikKutusu';
import { IncelemeKutusu } from './Inceleme';
import { DurumRozeti } from './Rozet';

interface Props {
  evrak: Evrak;
  /** Aynı parseldeki diğer kayıtları göstermek için tüm liste. */
  evraklar: Evrak[];
  /** Parsel geçmişinden başka bir evraka geçiş. */
  onEvrakSec: (id: string) => void;
  /** Bu parselin kayıtlarını ana listede süzer. */
  onParselFiltre: () => void;
  onKapat: () => void;
  onDuzenle: () => void;
  onSil: () => void;
  /** Silme yetkisi yoksa düğme gizlenir (sunucu kipinde sadece müdür siler). */
  silinebilir: boolean;
  /** Durum değişikliği veya sadece not ekleme. */
  onIslem: (durum: Durum, not: string) => void;
  /** Ek yükleme yalnızca sunucu kipinde vardır; yoksa bölüm bilgi verir. */
  onEkYukle?: (dosyalar: File[], belgeKodu: string) => void;
  onEkSil?: (ekId: string) => void;
  ekAdresi?: (ekId: string) => string;
  /** Eki silme yetkisi (yükleyen kişi veya müdür). */
  ekSilinebilir?: (ek: Ek) => boolean;
  onBelgeIsaretle: (kod: string, teslim: boolean) => void;
  /** Memurun içerik kararı; sunucu kipinde vardır. */
  onBelgeKarar?: (kod: string, karar: 'uygun' | 'uygunsuz' | '', not: string) => void;
  onBelgeDogrulama?: (kod: string, dogrulamaKodu: string, dogrulandi: boolean) => void;
  /** TAKBİS/YAMBİS sorgusu — bağlantı açıksa verilir. */
  onKurumSorgu?: (tur: 'takbis' | 'yambis', belgeNo: string) => void;
  /** Bu evrak için yapılmış kurum sorguları (en yeni önce). */
  kurumGecmisi?: { tur: string; durum: string; ozet: string; hata: string; kullanici: string; tarih: string }[];
  onIncelemeYenile?: (ekId: string) => void;
  /** Alındı belgesini açar; yalnızca takip kodu olan kayıtlarda vardır. */
  onAlindiBelgesi?: () => void;
  /** Eksik belge yazısını açar; eksik yoksa çağrılmaz. */
  onEksikYazi: () => void;
}

function Satir({ ad, deger }: { ad: string; deger: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-500">{ad}</dt>
      <dd className="mt-0.5 text-slate-900">{deger || '—'}</dd>
    </div>
  );
}

export function EvrakDetay({
  evrak,
  evraklar,
  onEvrakSec,
  onParselFiltre,
  onKapat,
  onDuzenle,
  onSil,
  onIslem,
  silinebilir,
  onEkYukle,
  onEkSil,
  ekAdresi,
  ekSilinebilir,
  onBelgeIsaretle,
  onBelgeKarar,
  onBelgeDogrulama,
  onKurumSorgu,
  kurumGecmisi,
  onIncelemeYenile,
  onAlindiBelgesi,
  onEksikYazi,
}: Props) {
  const [durum, setDurum] = useState<Durum>(evrak.durum);
  const [not, setNot] = useState('');
  const dosyaGirdisi = useRef<HTMLInputElement>(null);
  /** Dosya seçme penceresinin hangi belge için açıldığı; boş: genel ek. */
  const secilenKod = useRef('');

  const parselGecmisi = ayniParsel(evraklar, evrak);
  const tanimlar = belgeListesi(evrak.tur);
  const teslimMi = (kod: string) => evrak.belgeler.some((b) => b.kod === kod && b.teslim);
  const belgeninEkleri = (kod: string) => evrak.ekler.filter((e) => e.belgeKodu === kod);
  const genelEkler = evrak.ekler.filter((e) => !e.belgeKodu);
  const zorunlular = tanimlar.filter((b) => b.zorunlu);
  const eksikSayisi = zorunlular.filter((b) => !teslimMi(b.kod)).length;
  const tamam = zorunlular.length - eksikSayisi;

  /** Kontrol listesi maddesini ilgili kurum servisine bağlar. */
  const KURUM_SERVISI: Record<string, { tur: 'takbis' | 'yambis'; ad: string }> = {
    tapu: { tur: 'takbis', ad: 'TAKBİS' },
    muteahhit: { tur: 'yambis', ad: 'YAMBİS' },
  };

  const dosyaSec = (kod: string) => {
    secilenKod.current = kod;
    dosyaGirdisi.current?.click();
  };

  const isle = () => {
    if (durum === evrak.durum && !not.trim()) return;
    onIslem(durum, not.trim());
    setNot('');
  };

  /** Bir belgeye veya genel eke bağlı dosya satırı. */
  const EkSatiri = ({ ek }: { ek: Ek }) => (
    <li>
      <div className="flex items-center justify-between gap-3">
        <a href={ekAdresi?.(ek.id)} target="_blank" rel="noreferrer" className="min-w-0 flex-1">
          <span className="block truncate text-sm text-slate-900 underline decoration-slate-300 underline-offset-2">
            {ek.ad}
          </span>
          <span className="block text-xs text-slate-500">
            {boyutGoster(ek.boyut)} · {ek.yukleyen} · {tarihGoster(ek.tarih)}
          </span>
        </a>
        {onEkSil && (ekSilinebilir?.(ek) ?? true) && (
          <button
            type="button"
            onClick={() => onEkSil(ek.id)}
            className="shrink-0 text-xs font-medium text-rose-700 hover:underline"
          >
            sil
          </button>
        )}
      </div>
      <IncelemeKutusu
        inceleme={ek.inceleme}
        onYenile={onIncelemeYenile ? () => onIncelemeYenile(ek.id) : undefined}
      />
    </li>
  );

  return (
    <aside className="flex h-full w-full flex-col bg-white shadow-xl sm:max-w-xl">
      <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
        <div>
          <div className="font-mono text-sm text-slate-500">{evrak.no}</div>
          <h2 className="text-lg font-semibold leading-tight">{evrak.konu}</h2>
          <div className="mt-2 flex items-center gap-2">
            <DurumRozeti durum={evrak.durum} />
            <span className="text-xs text-slate-500">
              {gunFarki(evrak.gelisTarihi)} gündür işlemde
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onKapat}
          className="rounded-lg px-2 py-1 text-2xl leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Kapat"
        >
          ×
        </button>
      </header>

      {onEkYukle && (
        <input
          ref={dosyaGirdisi}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            const secilen = Array.from(e.target.files ?? []);
            if (secilen.length) onEkYukle(secilen, secilenKod.current);
            e.target.value = '';
            secilenKod.current = '';
          }}
        />
      )}

      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-4">
        <HazirlikKutusu hazirlik={hazirlikDurumu(evrak)} />

        <dl className="grid grid-cols-2 gap-4 text-sm">
          <Satir ad="Evrak türü" deger={turAdi(evrak.tur)} />
          <Satir ad="Geliş tarihi" deger={tarihGoster(evrak.gelisTarihi)} />
          <Satir ad="Hedef süre" deger={`${evrak.hedefGun} gün`} />
          <Satir ad="Sorumlu" deger={evrak.sorumlu} />
          <Satir ad="Başvuran" deger={evrak.basvuran.ad} />
          <Satir ad="Telefon" deger={evrak.basvuran.telefon} />
          <Satir ad="Mahalle" deger={evrak.tasinmaz.mahalle} />
          <Satir ad="Pafta" deger={evrak.tasinmaz.pafta} />
          <Satir ad="Ada" deger={evrak.tasinmaz.ada} />
          <Satir ad="Parsel" deger={evrak.tasinmaz.parsel} />
        </dl>

        {parselGecmisi.length > 0 && (
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-wide text-slate-500">
                Bu parseldeki diğer evraklar ({parselGecmisi.length})
              </h3>
              <button
                type="button"
                onClick={onParselFiltre}
                className="text-xs font-medium text-slate-700 underline"
              >
                listede göster
              </button>
            </div>
            <ul className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200">
              {parselGecmisi.map((e) => (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => onEvrakSec(e.id)}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-slate-50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-slate-900">{e.konu}</span>
                      <span className="block text-xs text-slate-500">
                        <span className="font-mono">{e.no}</span> · {turAdi(e.tur)} ·{' '}
                        {tarihGoster(e.gelisTarihi)}
                      </span>
                    </span>
                    <DurumRozeti durum={e.durum} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {evrak.takipKodu && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
            <span className="text-xs uppercase tracking-wide text-slate-500">
              Vatandaş takip kodu
            </span>
            <span className="font-mono text-sm font-medium tracking-wider">{evrak.takipKodu}</span>
            {onAlindiBelgesi && (
              <button
                type="button"
                onClick={onAlindiBelgesi}
                className="text-xs font-medium text-slate-700 underline"
              >
                alındı belgesi
              </button>
            )}
          </div>
        )}

        {evrak.aciklama && (
          <div>
            <h3 className="text-xs uppercase tracking-wide text-slate-500">Açıklama</h3>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{evrak.aciklama}</p>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-xs uppercase tracking-wide text-slate-500">Belge kontrol listesi</h3>
            <button
              type="button"
              onClick={onEksikYazi}
              disabled={eksikSayisi === 0}
              className="text-xs font-medium text-slate-700 underline disabled:text-slate-400 disabled:no-underline"
            >
              eksik belge yazısı
            </button>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full ${eksikSayisi === 0 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: `${zorunlular.length ? (tamam / zorunlular.length) * 100 : 0}%` }}
              />
            </div>
            <span className="text-xs tabular-nums text-slate-600">
              {tamam}/{zorunlular.length} zorunlu belge
            </span>
          </div>

          <ul className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200">
            {tanimlar.map((b) => {
              const kayit = evrak.belgeler.find((x) => x.kod === b.kod);
              const dosyalar = belgeninEkleri(b.kod);
              return (
                <li key={b.kod} className="px-3 py-2.5 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <label className="flex flex-1 cursor-pointer items-start gap-2">
                      <input
                        type="checkbox"
                        checked={teslimMi(b.kod)}
                        onChange={(e) => onBelgeIsaretle(b.kod, e.target.checked)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-600"
                      />
                      <span className={teslimMi(b.kod) ? 'text-slate-500' : ''}>
                        {b.ad}
                        {!b.zorunlu && (
                          <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                            koşullu
                          </span>
                        )}
                      </span>
                    </label>
                    {onEkYukle && (
                      <button
                        type="button"
                        onClick={() => dosyaSec(b.kod)}
                        className="shrink-0 text-xs font-medium text-slate-700 underline"
                      >
                        {dosyalar.length ? 'dosya ekle' : 'dosya yükle'}
                      </button>
                    )}
                  </div>

                  {dosyalar.length > 0 && (
                    <ul className="ml-6 mt-1.5 space-y-1.5">
                      {dosyalar.map((ek) => (
                        <EkSatiri key={ek.id} ek={ek} />
                      ))}
                    </ul>
                  )}

                  {dosyalar.length === 0 && kayit?.kullanici && (
                    <span className="ml-6 block text-xs text-slate-400">
                      elle işaretlendi · {kayit.kullanici}
                      {kayit.tarih ? ` · ${tarihGoster(kayit.tarih)}` : ''}
                    </span>
                  )}

                  {onKurumSorgu && KURUM_SERVISI[b.kod] && (
                    <div className="ml-6 mt-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          const servis = KURUM_SERVISI[b.kod];
                          const no =
                            servis.tur === 'yambis'
                              ? (prompt('Müteahhit yetki belgesi numarası:') ?? '').trim()
                              : '';
                          if (servis.tur === 'yambis' && !no) return;
                          onKurumSorgu(servis.tur, no);
                        }}
                        className="rounded-lg border border-sky-300 px-2 py-0.5 font-medium text-sky-800 hover:bg-sky-50"
                      >
                        {KURUM_SERVISI[b.kod].ad}'ten sorgula
                      </button>
                      {(kurumGecmisi ?? [])
                        .filter((k) => k.tur === KURUM_SERVISI[b.kod].tur)
                        .slice(0, 1)
                        .map((k) => (
                          <span key={k.tarih} className="ml-2 text-slate-600">
                            {k.durum === 'hata' ? k.hata : k.ozet} · {k.kullanici} ·{' '}
                            {tarihGoster(k.tarih)}
                          </span>
                        ))}
                    </div>
                  )}

                  {onBelgeDogrulama && teslimMi(b.kod) && DOGRULANABILIR.has(b.kod) && (
                    <div className="ml-6 mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                      {kayit?.dogrulandi ? (
                        <>
                          <span className="inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 font-medium text-sky-800 ring-1 ring-inset ring-sky-300">
                            Kaynağından doğrulandı
                          </span>
                          <span className="text-slate-500">
                            {kayit.dogrulayan}
                            {kayit.dogrulamaTarihi ? ` · ${tarihGoster(kayit.dogrulamaTarihi)}` : ''}
                            {kayit.dogrulamaKodu ? ` · kod ${kayit.dogrulamaKodu}` : ''}
                          </span>
                          <button
                            type="button"
                            onClick={() => onBelgeDogrulama(b.kod, kayit.dogrulamaKodu ?? '', false)}
                            className="text-slate-500 underline"
                          >
                            geri al
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="text-slate-500">Doğrulama kodu:</span>
                          <input
                            defaultValue={kayit?.dogrulamaKodu ?? ''}
                            placeholder="belgedeki barkod / kod"
                            onBlur={(e) => {
                              const deger = e.target.value.trim();
                              if (deger !== (kayit?.dogrulamaKodu ?? '')) {
                                onBelgeDogrulama(b.kod, deger, false);
                              }
                            }}
                            className="w-44 rounded border border-slate-300 px-2 py-0.5"
                          />
                          <a
                            href="https://www.turkiye.gov.tr/belge-dogrulama"
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-600 underline"
                          >
                            e-Devlet'te sorgula
                          </a>
                          <button
                            type="button"
                            onClick={() =>
                              onBelgeDogrulama(b.kod, kayit?.dogrulamaKodu ?? '', true)
                            }
                            className="rounded-lg border border-sky-300 px-2 py-0.5 font-medium text-sky-800 hover:bg-sky-50"
                          >
                            doğrulandı
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {onBelgeKarar && teslimMi(b.kod) && (
                    <div className="ml-6 mt-1.5 flex flex-wrap items-center gap-2">
                      {kayit?.karar ? (
                        <>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                              kayit.karar === 'uygun'
                                ? 'bg-emerald-100 text-emerald-800 ring-emerald-300'
                                : 'bg-rose-100 text-rose-800 ring-rose-300'
                            }`}
                          >
                            {kayit.karar === 'uygun' ? 'Uygun bulundu' : 'Uygun bulunmadı'}
                          </span>
                          <span className="text-xs text-slate-500">
                            {kayit.kararVeren}
                            {kayit.kararTarihi ? ` · ${tarihGoster(kayit.kararTarihi)}` : ''}
                            {kayit.kararNotu ? ` — ${kayit.kararNotu}` : ''}
                          </span>
                          <button
                            type="button"
                            onClick={() => onBelgeKarar(b.kod, '', '')}
                            className="text-xs text-slate-500 underline"
                          >
                            kararı geri al
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="text-xs text-slate-500">Memur kararı:</span>
                          <button
                            type="button"
                            onClick={() => onBelgeKarar(b.kod, 'uygun', '')}
                            className="rounded-lg border border-emerald-300 px-2 py-0.5 text-xs font-medium text-emerald-800 hover:bg-emerald-50"
                          >
                            uygun
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const neden = prompt('Neden uygun bulunmadı?') ?? '';
                              if (neden.trim()) onBelgeKarar(b.kod, 'uygunsuz', neden.trim());
                            }}
                            className="rounded-lg border border-rose-300 px-2 py-0.5 text-xs font-medium text-rose-800 hover:bg-rose-50"
                          >
                            uygun değil
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-xs uppercase tracking-wide text-slate-500">
              Diğer ekler{genelEkler.length > 0 && ` (${genelEkler.length})`}
            </h3>
            {onEkYukle && (
              <button
                type="button"
                onClick={() => dosyaSec('')}
                className="text-xs font-medium text-slate-700 underline"
              >
                dosya ekle
              </button>
            )}
          </div>

          {onEkYukle ? (
            genelEkler.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">
                Kontrol listesine girmeyen belgeler (tutanak, yazışma, fotoğraf) buraya eklenir.
              </p>
            ) : (
              <ul className="mt-2 space-y-2 rounded-lg border border-slate-200 px-3 py-2">
                {genelEkler.map((ek) => (
                  <EkSatiri key={ek.id} ek={ek} />
                ))}
              </ul>
            )
          ) : (
            <p className="mt-2 text-sm text-slate-500">
              Dosya ekleri yalnızca ortak sunucu kipinde saklanabiliyor.
            </p>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-medium">İşlem yap</h3>
          <div className="mt-3 space-y-2">
            <select
              value={durum}
              onChange={(e) => setDurum(e.target.value as Durum)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              aria-label="Yeni durum"
            >
              {DURUMLAR.map((d) => (
                <option key={d.deger} value={d.deger}>
                  {d.ad}
                </option>
              ))}
            </select>
            <textarea
              value={not}
              onChange={(e) => setNot(e.target.value)}
              rows={2}
              placeholder="Not (örn. eksik belge listesi tebliğ edildi)"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={isle}
              disabled={durum === evrak.durum && !not.trim()}
              className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Kaydet
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-xs uppercase tracking-wide text-slate-500">İşlem geçmişi</h3>
          <ol className="mt-2 space-y-3 border-l-2 border-slate-200 pl-4">
            {[...evrak.gecmis].reverse().map((i) => (
              <li key={i.id} className="relative">
                <span className="absolute -left-[1.3rem] top-1.5 h-2 w-2 rounded-full bg-slate-400" />
                <div className="flex flex-wrap items-center gap-2">
                  <DurumRozeti durum={i.durum} />
                  <span className="text-xs text-slate-500">{tarihSaatGoster(i.tarih)}</span>
                </div>
                {i.not && <p className="mt-1 text-sm text-slate-800">{i.not}</p>}
                <p className="text-xs text-slate-500">{i.kullanici}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <footer className="flex gap-2 border-t border-slate-200 px-5 py-3">
        <button
          type="button"
          onClick={onDuzenle}
          className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          Düzenle
        </button>
        {silinebilir && (
          <button
            type="button"
            onClick={onSil}
            className="rounded-lg border border-rose-300 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
          >
            Sil
          </button>
        )}
      </footer>
    </aside>
  );
}
