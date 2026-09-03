import { useState } from 'react';
import type { Evrak } from '../types';
import { bugun, tarihGoster } from '../utils';
import { IMAR_DURUMU_ZORUNLU, eksikAlanlar, sayiGoster, sayiOku } from '../yapi';
import { BelgeBasligi, BelgeBolumu, BelgeKatmani, BelgeSatiri } from './Belge';

/** İmar durumu belgesinin varsayılan geçerlilik süresi (gün). */
const GECERLILIK_GUN = 365;

/**
 * İmar durumu (çap) belgesi çıktısı. Parselin plandaki yapılaşma şartları
 * dosyadaki yapı bilgilerinden gelir.
 */
export function ImarDurumuBelgesi({ evrak, onKapat }: { evrak: Evrak; onKapat: () => void }) {
  const [belgeNo, setBelgeNo] = useState(evrak.no);
  const [belgeTarihi, setBelgeTarihi] = useState(bugun());
  const y = evrak.yapi;
  const eksikler = eksikAlanlar(y, IMAR_DURUMU_ZORUNLU);

  const bitis = new Date(`${belgeTarihi}T00:00:00`);
  bitis.setDate(bitis.getDate() + GECERLILIK_GUN);

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

      <BelgeBasligi baslik="İMAR DURUMU BELGESİ" />

      <div className="mt-6 flex justify-between text-sm">
        <p>
          <span className="text-slate-600">Sayı</span>:{' '}
          <span className="font-medium">{belgeNo}</span>
        </p>
        <p>
          <span className="text-slate-600">Tarih</span>:{' '}
          <span className="font-medium">{tarihGoster(belgeTarihi)}</span>
        </p>
      </div>

      <BelgeBolumu baslik="Taşınmaz bilgileri">
        <BelgeSatiri ad="İl / ilçe" deger={[y.il, y.ilce].filter(Boolean).join(' / ')} />
        <BelgeSatiri ad="Mahalle" deger={evrak.tasinmaz.mahalle} />
        <BelgeSatiri ad="Cadde / sokak" deger={[y.cadde, y.kapiNo && `No: ${y.kapiNo}`].filter(Boolean).join(' ')} />
        <BelgeSatiri ad="Pafta" deger={evrak.tasinmaz.pafta} />
        <BelgeSatiri ad="Ada / parsel" deger={[evrak.tasinmaz.ada, evrak.tasinmaz.parsel].filter(Boolean).join(' / ')} />
        <BelgeSatiri
          ad="Yüzölçümü"
          deger={sayiOku(y.arsaAlani) ? `${sayiGoster(sayiOku(y.arsaAlani))} m²` : ''}
        />
        <BelgeSatiri ad="Malik" deger={y.hisse || evrak.basvuran.ad} />
      </BelgeBolumu>

      <BelgeBolumu baslik="Plan ve yapılaşma şartları">
        <BelgeSatiri ad="Uygulama imar planı" deger={y.planAdi} />
        <BelgeSatiri ad="Plandaki fonksiyon" deger={y.fonksiyon} />
        <BelgeSatiri ad="Yapı nizamı" deger={y.nizam} />
        <BelgeSatiri ad="TAKS" deger={y.taks} />
        <BelgeSatiri ad="KAKS (emsal)" deger={y.kaks} />
        <BelgeSatiri ad="Yapı yüksekliği (Hmax)" deger={y.hmax} />
        <BelgeSatiri ad="Ön bahçe mesafesi" deger={y.cekmeOn && `${y.cekmeOn} m`} />
        <BelgeSatiri ad="Yan bahçe mesafesi" deger={y.cekmeYan && `${y.cekmeYan} m`} />
        <BelgeSatiri ad="Arka bahçe mesafesi" deger={y.cekmeArka && `${y.cekmeArka} m`} />
      </BelgeBolumu>

      {y.planNotu && (
        <section className="mt-6">
          <h3 className="border-b border-slate-300 pb-1 text-sm font-semibold uppercase tracking-wide">
            Plan notları
          </h3>
          <p className="mt-2 whitespace-pre-wrap text-sm">{y.planNotu}</p>
        </section>
      )}

      <p className="mt-6 text-sm">
        Yukarıda bilgileri yazılı taşınmazın imar durumu, yürürlükteki uygulama imar planına göre
        düzenlenmiştir. Bu belge <strong>ruhsat yerine geçmez</strong>; yapı ruhsatı için ilgili
        yönetmelikte belirtilen belgelerle müdürlüğümüze ayrıca başvurulması gerekir. Belge,
        düzenlendiği tarihten itibaren <strong>bir yıl</strong> (
        {tarihGoster(bitis.toISOString().slice(0, 10))} tarihine kadar) geçerlidir; bu süre içinde
        planda değişiklik olması hâlinde yeni plan hükümleri uygulanır.
      </p>

      <div className="mt-12 flex justify-between text-sm">
        <div>
          <p className="text-slate-600">Düzenleyen</p>
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
