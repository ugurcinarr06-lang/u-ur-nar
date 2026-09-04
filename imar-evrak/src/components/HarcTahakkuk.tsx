import { turAdi } from '../data';
import { paraGoster } from '../harc';
import type { Evrak } from '../types';
import { tarihGoster } from '../utils';
import { sayiGoster } from '../yapi';
import { BelgeBasligi, BelgeKatmani } from './Belge';

/** Vatandaşa verilen, ödeme için vezneye götürülen harç tahakkuk fişi. */
export function HarcTahakkuk({ evrak, onKapat }: { evrak: Evrak; onKapat: () => void }) {
  const t = evrak.tahakkuk;
  if (!t) return null;

  const parsel = [
    evrak.tasinmaz.mahalle && `${evrak.tasinmaz.mahalle} Mah.`,
    evrak.tasinmaz.ada && `${evrak.tasinmaz.ada} ada`,
    evrak.tasinmaz.parsel && `${evrak.tasinmaz.parsel} parsel`,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <BelgeKatmani onKapat={onKapat}>
      <BelgeBasligi baslik="HARÇ VE ÜCRET TAHAKKUK FİŞİ" />

      {!t.tarifeOnayli && (
        <p className="mt-6 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
          Bu fiş, müdürlükçe onaylanmamış bir tarife ile hesaplanmıştır; bilgi amaçlıdır, tahsilata
          esas alınamaz.
        </p>
      )}

      <dl className="mt-8 grid grid-cols-[10rem_1fr] gap-y-2 text-sm">
        <dt className="text-slate-600">Evrak no</dt>
        <dd className="font-medium">{evrak.no}</dd>
        <dt className="text-slate-600">Tarih</dt>
        <dd>{tarihGoster(t.tarih ?? new Date().toISOString())}</dd>
        <dt className="text-slate-600">Mükellef</dt>
        <dd>{evrak.basvuran.ad || '—'}</dd>
        <dt className="text-slate-600">İşlem türü</dt>
        <dd>{turAdi(evrak.tur)}</dd>
        <dt className="text-slate-600">Taşınmaz</dt>
        <dd>{parsel || '—'}</dd>
        <dt className="text-slate-600">Tarife yılı</dt>
        <dd>{t.tarifeYili}</dd>
      </dl>

      <table className="mt-8 w-full border-collapse text-sm">
        <thead>
          <tr className="border-y border-slate-300 text-left">
            <th className="py-2 pr-2 font-semibold">Harç / ücret</th>
            <th className="py-2 pr-2 text-right font-semibold">Miktar</th>
            <th className="py-2 pr-2 text-right font-semibold">Birim fiyat</th>
            <th className="py-2 text-right font-semibold">Tutar</th>
          </tr>
        </thead>
        <tbody>
          {t.satirlar.map((s) => (
            <tr key={s.kod} className="border-b border-slate-200 align-top">
              <td className="py-1.5 pr-2">
                {s.ad}
                {s.aciklama && (
                  <span className="block text-xs text-slate-500">{s.aciklama}</span>
                )}
              </td>
              <td className="py-1.5 pr-2 text-right tabular-nums">
                {s.taban === 'sabit' ? '1 adet' : `${sayiGoster(s.miktar)} ${s.birim}`}
              </td>
              <td className="py-1.5 pr-2 text-right tabular-nums">
                {s.taban === 'maliyet-yuzdesi' ? `%${s.birimFiyat}` : paraGoster(s.birimFiyat)}
              </td>
              <td className="py-1.5 text-right tabular-nums">{paraGoster(s.tutar)}</td>
            </tr>
          ))}
          <tr className="border-b-2 border-slate-400 font-semibold">
            <td className="py-2" colSpan={3}>
              GENEL TOPLAM
            </td>
            <td className="py-2 text-right tabular-nums">{paraGoster(t.toplam)}</td>
          </tr>
        </tbody>
      </table>

      {t.makbuzNo ? (
        <p className="mt-6 text-sm">
          <strong>Tahsil edilmiştir.</strong> Makbuz no: {t.makbuzNo}
          {t.odemeTarihi ? ` · ${tarihGoster(t.odemeTarihi)}` : ''}
        </p>
      ) : (
        <p className="mt-6 text-sm">
          Yukarıdaki tutarın belediyemiz veznesine veya banka hesabına yatırılması, makbuzun
          dosyaya eklenmesi gerekmektedir. Ödeme yapılmadan işlem tamamlanmaz.
        </p>
      )}

      <div className="mt-12 flex justify-between text-sm">
        <div>
          <p className="text-slate-600">Tahakkuku düzenleyen</p>
          <p className="mt-10 border-t border-slate-300 pt-1">{t.hesaplayan || '…………………'}</p>
        </div>
        <div className="text-right">
          <p className="text-slate-600">İmar ve Şehircilik Müdürü</p>
          <p className="mt-10 border-t border-slate-300 pt-1">…………………………</p>
        </div>
      </div>

      <footer className="mt-8 border-t border-slate-200 pt-3 text-xs text-slate-500">
        {evrak.no} sayılı evrak dosyasından üretilmiştir.
      </footer>
    </BelgeKatmani>
  );
}
