import { useState } from 'react';
import { turAdi } from '../data';
import type { Gorus } from '../gorus';
import type { Evrak } from '../types';
import { bugun, tarihGoster } from '../utils';
import { sayiGoster, sayiOku } from '../yapi';
import { BelgeBasligi, BelgeKatmani } from './Belge';

interface Props {
  evrak: Evrak;
  gorus: Gorus;
  onKapat: () => void;
}

/** Kuruma gönderilecek görüş isteme yazısı. */
export function GorusYazisi({ evrak, gorus, onKapat }: Props) {
  const [sayi, setSayi] = useState(gorus.sayi || evrak.no);
  const [tarih, setTarih] = useState(gorus.gonderimTarihi || bugun());

  const parsel = [
    evrak.tasinmaz.mahalle && `${evrak.tasinmaz.mahalle} Mahallesi`,
    evrak.tasinmaz.pafta && `${evrak.tasinmaz.pafta} pafta`,
    evrak.tasinmaz.ada && `${evrak.tasinmaz.ada} ada`,
    evrak.tasinmaz.parsel && `${evrak.tasinmaz.parsel} parsel`,
  ]
    .filter(Boolean)
    .join(', ');

  const arsa = sayiOku(evrak.yapi.arsaAlani);

  return (
    <BelgeKatmani
      onKapat={onKapat}
      arac={
        <>
          <input
            value={sayi}
            onChange={(e) => setSayi(e.target.value)}
            className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            aria-label="Yazı sayısı"
            placeholder="Sayı"
          />
          <input
            type="date"
            value={tarih}
            onChange={(e) => setTarih(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            aria-label="Yazı tarihi"
          />
        </>
      }
    >
      <BelgeBasligi />

      <div className="mt-8 flex justify-between text-sm">
        <div>
          <p>
            <span className="inline-block w-14">Sayı</span>: {sayi}
          </p>
          <p>
            <span className="inline-block w-14">Konu</span>: {gorus.konu || 'Kurum görüşü talebi'}
          </p>
        </div>
        <p>{tarihGoster(tarih)}</p>
      </div>

      <p className="mt-10 font-semibold uppercase">{gorus.kurum}'NE</p>

      <p className="mt-6">
        Müdürlüğümüze {tarihGoster(evrak.gelisTarihi)} tarihinde {evrak.no} sayı ile kayıtlı,{' '}
        <strong>“{evrak.konu || turAdi(evrak.tur)}”</strong> konulu başvuru bulunmaktadır. Başvuruya
        konu taşınmaz {parsel ? `${parsel} ` : ''}
        {arsa ? `olup ${sayiGoster(arsa)} m² yüzölçümlüdür` : 'olarak kayıtlıdır'}.
      </p>

      <p className="mt-4">
        Söz konusu taşınmaz üzerinde yapılacak işlem bakımından, kurumunuzun görev alanına giren
        hususlarda{gorus.konu ? ` (${gorus.konu})` : ''} <strong>görüşünüzün bildirilmesi</strong>{' '}
        hususunda gereğini arz/rica ederim.
      </p>

      <div className="mt-14 text-right">
        <p>…………………………</p>
        <p className="text-sm text-slate-600">İmar ve Şehircilik Müdürü</p>
      </div>

      <section className="mt-10 text-sm">
        <p className="font-medium">EKLER:</p>
        <ol className="mt-1 list-decimal pl-6">
          <li>Başvuru dilekçesi örneği</li>
          <li>Tapu kayıt örneği</li>
          <li>Taşınmazın konumunu gösterir kroki</li>
        </ol>
      </section>

      <footer className="mt-10 border-t border-slate-200 pt-3 text-xs text-slate-500">
        {evrak.no} sayılı evrak dosyasından üretilmiştir.
      </footer>
    </BelgeKatmani>
  );
}
