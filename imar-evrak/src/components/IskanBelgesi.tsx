import { useState } from 'react';
import { paraGoster } from '../harc';
import type { Evrak } from '../types';
import { bugun, tarihGoster } from '../utils';
import { ISKAN_ZORUNLU, eksikAlanlar, katOzeti, katSayisi, sayiGoster, sayiOku } from '../yapi';
import { BelgeBasligi, BelgeBolumu, BelgeKatmani, BelgeSatiri } from './Belge';

/**
 * Yapı kullanma izin belgesi (iskân) çıktısı. Ruhsat bilgileri, yapı
 * bilgileri ve tamamlanma tarihleri dosyadan gelir.
 */
export function IskanBelgesi({ evrak, onKapat }: { evrak: Evrak; onKapat: () => void }) {
  const [belgeNo, setBelgeNo] = useState(evrak.no);
  const [belgeTarihi, setBelgeTarihi] = useState(bugun());
  const y = evrak.yapi;
  const eksikler = eksikAlanlar(y, ISKAN_ZORUNLU);

  const adres = [
    y.cadde,
    y.kapiNo && `No: ${y.kapiNo}`,
    evrak.tasinmaz.mahalle && `${evrak.tasinmaz.mahalle} Mah.`,
    y.ilce,
    y.il,
  ]
    .filter(Boolean)
    .join(', ');

  const alan = (kod: string): string =>
    sayiOku(y[kod]) ? `${sayiGoster(sayiOku(y[kod]))} m²` : '';

  return (
    <BelgeKatmani
      onKapat={onKapat}
      arac={
        <>
          <input
            value={belgeNo}
            onChange={(e) => setBelgeNo(e.target.value)}
            className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            aria-label="Belge no"
            placeholder="Belge no"
          />
          <input
            type="date"
            value={belgeTarihi}
            onChange={(e) => setBelgeTarihi(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            aria-label="Belge tarihi"
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

      <BelgeBasligi baslik="YAPI KULLANMA İZİN BELGESİ" />

      <div className="mt-6 flex justify-between text-sm">
        <p>
          <span className="text-slate-600">Belge no</span>:{' '}
          <span className="font-medium">{belgeNo}</span>
        </p>
        <p>
          <span className="text-slate-600">Belge tarihi</span>:{' '}
          <span className="font-medium">{tarihGoster(belgeTarihi)}</span>
        </p>
      </div>

      <BelgeBolumu baslik="Yapının yeri ve sahibi">
        <BelgeSatiri ad="Adres" deger={adres} />
        <BelgeSatiri
          ad="Pafta / ada / parsel"
          deger={[evrak.tasinmaz.pafta, evrak.tasinmaz.ada, evrak.tasinmaz.parsel]
            .filter(Boolean)
            .join(' / ')}
        />
        <BelgeSatiri ad="Yapı sahibi" deger={evrak.basvuran.ad} />
        <BelgeSatiri ad="Yapı müteahhidi" deger={y.muteahhitAd} />
        <BelgeSatiri ad="Yapı denetim kuruluşu" deger={y.denetimAd} />
      </BelgeBolumu>

      <BelgeBolumu baslik="Dayanak ruhsat">
        <BelgeSatiri ad="Yapı ruhsatı no" deger={y.ruhsatNo} />
        <BelgeSatiri ad="Ruhsat tarihi" deger={y.ruhsatTarihi ? tarihGoster(y.ruhsatTarihi) : ''} />
        <BelgeSatiri
          ad="Yapıya başlama"
          deger={y.baslamaTarihi ? tarihGoster(y.baslamaTarihi) : ''}
        />
        <BelgeSatiri ad="Yapının bitişi" deger={y.bitisTarihi ? tarihGoster(y.bitisTarihi) : ''} />
      </BelgeBolumu>

      <BelgeBolumu baslik="Yapıya ait bilgiler">
        <BelgeSatiri ad="Kullanım amacı" deger={y.kullanimAmaci} />
        <BelgeSatiri ad="Yapı sınıfı / grubu" deger={y.yapiSinifi} />
        <BelgeSatiri ad="Taşıyıcı sistem" deger={y.tasiyiciSistem} />
        <BelgeSatiri
          ad="Kat adedi"
          deger={katOzeti(y) ? `${katOzeti(y)} (toplam ${katSayisi(y)} kat)` : ''}
        />
        <BelgeSatiri ad="Toplam inşaat alanı" deger={alan('toplamAlan')} />
        <BelgeSatiri
          ad="Bağımsız bölüm"
          deger={
            sayiOku(y.bbKonut) + sayiOku(y.bbTicari)
              ? `${sayiOku(y.bbKonut)} konut, ${sayiOku(y.bbTicari)} işyeri`
              : ''
          }
        />
        <BelgeSatiri ad="Enerji kimlik belgesi sınıfı" deger={y.ekbSinifi} />
        <BelgeSatiri ad="SGK ilişiksizlik yazısı" deger={y.sgkYazi} />
        {y.kismiIskan && <BelgeSatiri ad="Kısmi kullanma izni" deger={y.kismiIskan} />}
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
        Yukarıda bilgileri yazılı yapının, 3194 sayılı İmar Kanunu'nun 30. maddesi uyarınca
        {y.kismiIskan ? ' belirtilen bağımsız bölümlerinin ' : ' tamamının '}
        onaylı projesine ve ruhsatına uygun olarak tamamlandığı, yapı denetim kuruluşunun raporu ve
        müdürlüğümüzce yapılan yerinde inceleme ile tespit edilmiş olup{' '}
        <strong>yapı kullanma izni verilmiştir</strong>.
      </p>

      <div className="mt-12 flex justify-between text-sm">
        <div>
          <p className="text-slate-600">Kontrol eden</p>
          <p className="mt-10 border-t border-slate-300 pt-1">{evrak.sorumlu || '…………………'}</p>
        </div>
        <div className="text-right">
          <p className="text-slate-600">İmar ve Şehircilik Müdürü</p>
          <p className="mt-10 border-t border-slate-300 pt-1">…………………………</p>
        </div>
      </div>

      <footer className="mt-8 border-t border-slate-200 pt-3 text-xs text-slate-500">
        {evrak.no} sayılı evrak dosyasından üretilmiştir. İmzalanmadan hüküm ifade etmez.
      </footer>
    </BelgeKatmani>
  );
}
