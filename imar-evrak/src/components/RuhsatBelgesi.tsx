import { useState } from 'react';
import { paraGoster } from '../harc';
import type { Evrak } from '../types';
import { bugun, tarihGoster } from '../utils';
import { RUHSAT_ZORUNLU, eksikAlanlar, katOzeti, katSayisi, sayiGoster, sayiOku } from '../yapi';
import { BelgeBasligi, BelgeBolumu, BelgeKatmani, BelgeSatiri } from './Belge';

/**
 * Yapı ruhsatı çıktısı. Alanlar dosyadaki yapı bilgilerinden doldurulur;
 * memur yalnızca ruhsat numarasını ve tarihini girer. Belge, imzalanana kadar
 * bir taslaktır — sistem ruhsat vermez, memurun imzası verir.
 */
export function RuhsatBelgesi({ evrak, onKapat }: { evrak: Evrak; onKapat: () => void }) {
  const [belgeNo, setBelgeNo] = useState(evrak.no);
  const [belgeTarihi, setBelgeTarihi] = useState(bugun());
  const y = evrak.yapi;
  const eksikler = eksikAlanlar(y, RUHSAT_ZORUNLU);

  const adres = [
    y.cadde,
    y.kapiNo && `No: ${y.kapiNo}`,
    evrak.tasinmaz.mahalle && `${evrak.tasinmaz.mahalle} Mah.`,
    y.ilce,
    y.il,
  ]
    .filter(Boolean)
    .join(', ');

  const alan = (kod: string, birim = 'm²'): string =>
    sayiOku(y[kod]) ? `${sayiGoster(sayiOku(y[kod]))} ${birim}` : '';

  return (
    <BelgeKatmani
      onKapat={onKapat}
      arac={
        <>
          <input
            value={belgeNo}
            onChange={(e) => setBelgeNo(e.target.value)}
            className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            aria-label="Ruhsat no"
            placeholder="Ruhsat no"
          />
          <input
            type="date"
            value={belgeTarihi}
            onChange={(e) => setBelgeTarihi(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            aria-label="Ruhsat tarihi"
          />
        </>
      }
    >
      {eksikler.length > 0 && (
        <p className="no-print mb-6 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 ring-1 ring-amber-200">
          Şu alanlar boş: {eksikler.join(', ')}. Dosya detayındaki{' '}
          <strong>Yapı ve proje bilgileri</strong> bölümünden doldurabilirsiniz.
        </p>
      )}

      <BelgeBasligi baslik="YAPI RUHSATI" />

      <div className="mt-6 flex justify-between text-sm">
        <p>
          <span className="text-slate-600">Ruhsat no</span>:{' '}
          <span className="font-medium">{belgeNo}</span>
        </p>
        <p>
          <span className="text-slate-600">Ruhsat tarihi</span>:{' '}
          <span className="font-medium">{tarihGoster(belgeTarihi)}</span>
        </p>
        <p>
          <span className="text-slate-600">Ruhsat türü</span>:{' '}
          <span className="font-medium">{y.ruhsatTuru || 'Yeni'}</span>
        </p>
      </div>

      <BelgeBolumu baslik="Yapının yeri">
        <BelgeSatiri ad="Adres" deger={adres} />
        <BelgeSatiri ad="Mahalle" deger={evrak.tasinmaz.mahalle} />
        <BelgeSatiri ad="Pafta / ada / parsel" deger={[evrak.tasinmaz.pafta, evrak.tasinmaz.ada, evrak.tasinmaz.parsel].filter(Boolean).join(' / ')} />
        <BelgeSatiri ad="Arsa alanı" deger={alan('arsaAlani')} />
        <BelgeSatiri ad="Malik / hisse" deger={y.hisse || evrak.basvuran.ad} />
        <BelgeSatiri ad="Plandaki fonksiyon" deger={y.fonksiyon} />
        <BelgeSatiri ad="Yapı nizamı" deger={y.nizam} />
        <BelgeSatiri ad="TAKS / KAKS" deger={[y.taks, y.kaks].filter(Boolean).join(' / ')} />
      </BelgeBolumu>

      <BelgeBolumu baslik="Yapıya ait bilgiler">
        <BelgeSatiri ad="Kullanım amacı" deger={y.kullanimAmaci} />
        <BelgeSatiri ad="Yapı sınıfı / grubu" deger={y.yapiSinifi} />
        <BelgeSatiri ad="Taşıyıcı sistem" deger={y.tasiyiciSistem} />
        <BelgeSatiri
          ad="Kat adedi"
          deger={katOzeti(y) ? `${katOzeti(y)} (toplam ${katSayisi(y)} kat)` : ''}
        />
        <BelgeSatiri ad="Yapı yüksekliği" deger={y.yapiYuksekligi} />
        <BelgeSatiri ad="Taban alanı" deger={alan('tabanAlani')} />
        <BelgeSatiri ad="Toplam inşaat alanı" deger={alan('toplamAlan')} />
        <BelgeSatiri ad="Emsale konu alan" deger={alan('emsalAlan')} />
        <BelgeSatiri
          ad="Bağımsız bölüm"
          deger={
            sayiOku(y.bbKonut) + sayiOku(y.bbTicari)
              ? `${sayiOku(y.bbKonut)} konut, ${sayiOku(y.bbTicari)} işyeri`
              : ''
          }
        />
        <BelgeSatiri
          ad="Otopark"
          deger={
            sayiOku(y.otoparkAdedi)
              ? `${sayiOku(y.otoparkAdedi)} adet (parselde ${sayiOku(y.otoparkParselde)})`
              : ''
          }
        />
      </BelgeBolumu>

      <BelgeBolumu baslik="Yapı sahibi ve müteahhit">
        <BelgeSatiri ad="Yapı sahibi" deger={evrak.basvuran.ad} />
        <BelgeSatiri ad="Yapı müteahhidi" deger={y.muteahhitAd} />
        <BelgeSatiri ad="T.C. / vergi no" deger={y.muteahhitNo} />
        <BelgeSatiri ad="Yetki belge no" deger={y.muteahhitYambis} />
        <BelgeSatiri ad="Şantiye şefi" deger={y.sefAd} />
        <BelgeSatiri ad="Yapı denetim kuruluşu" deger={y.denetimAd} />
        <BelgeSatiri ad="İzin belge no" deger={y.denetimBelgeNo} />
        <BelgeSatiri
          ad="Denetim sözleşmesi"
          deger={y.denetimSozlesme ? tarihGoster(y.denetimSozlesme) : ''}
        />
      </BelgeBolumu>

      <BelgeBolumu baslik="Proje müellifleri">
        <BelgeSatiri
          ad="Mimari"
          deger={[y.mimar, y.mimarSicil && `(sicil ${y.mimarSicil})`].filter(Boolean).join(' ')}
        />
        <BelgeSatiri
          ad="Statik"
          deger={[y.statikci, y.statikSicil && `(sicil ${y.statikSicil})`].filter(Boolean).join(' ')}
        />
        <BelgeSatiri
          ad="Mekanik tesisat"
          deger={[y.mekanikci, y.mekanikSicil && `(sicil ${y.mekanikSicil})`]
            .filter(Boolean)
            .join(' ')}
        />
        <BelgeSatiri
          ad="Elektrik tesisat"
          deger={[y.elektrikci, y.elektrikSicil && `(sicil ${y.elektrikSicil})`]
            .filter(Boolean)
            .join(' ')}
        />
        <BelgeSatiri ad="Zemin etüdü" deger={y.zeminci} />
      </BelgeBolumu>

      {evrak.tahakkuk && (
        <BelgeBolumu baslik="Harç ve ücretler">
          <BelgeSatiri ad="Tahakkuk toplamı" deger={paraGoster(evrak.tahakkuk.toplam)} />
          <BelgeSatiri
            ad="Tahsilat"
            deger={
              evrak.tahakkuk.makbuzNo
                ? `Makbuz no ${evrak.tahakkuk.makbuzNo}${
                    evrak.tahakkuk.odemeTarihi
                      ? ` · ${tarihGoster(evrak.tahakkuk.odemeTarihi)}`
                      : ''
                  }`
                : 'Tahsil edilmedi'
            }
          />
        </BelgeBolumu>
      )}

      <p className="mt-6 text-sm">
        Bu ruhsat, 3194 sayılı İmar Kanunu ve ilgili yönetmelikler uyarınca, ekindeki onaylı
        projelere uygun yapılmak şartıyla verilmiştir. Ruhsat tarihinden itibaren{' '}
        <strong>iki yıl içinde yapıya başlanmaması</strong> veya{' '}
        <strong>beş yıl içinde bitirilmemesi</strong> hâlinde ruhsat hükümsüz sayılır. Projesine
        aykırı yapılan imalatlardan yapı sahibi, müteahhit ve şantiye şefi müteselsilen sorumludur.
      </p>

      <div className="mt-12 grid grid-cols-3 gap-6 text-center text-sm">
        {[
          { rol: 'Yapı sahibi', ad: evrak.basvuran.ad },
          { rol: 'Yapı müteahhidi', ad: y.muteahhitAd },
          { rol: 'Şantiye şefi', ad: y.sefAd },
        ].map((k) => (
          <div key={k.rol}>
            <p className="text-slate-600">{k.rol}</p>
            <p className="mt-10 border-t border-slate-300 pt-1">{k.ad || '…………………'}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 text-center text-sm">
        <p className="text-slate-600">İmar ve Şehircilik Müdürü</p>
        <p className="mt-10">…………………………</p>
      </div>

      <footer className="mt-8 border-t border-slate-200 pt-3 text-xs text-slate-500">
        {evrak.no} sayılı evrak dosyasından üretilmiştir. İmzalanmadan hüküm ifade etmez.
      </footer>
    </BelgeKatmani>
  );
}
