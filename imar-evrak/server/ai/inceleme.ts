import { join } from 'node:path';
import { belgeAdi } from '../../src/belgeler.js';
import type { Bulgu, Inceleme, Tur } from '../../src/types.js';
import { EKLER_KLASORU, db } from '../db.js';
import { kurallariUygula, type IncelemeGirdisi } from './kurallar.js';
import { metinCikar } from './metin.js';
import { saglayiciSec } from './saglayici.js';

interface EkKaydi {
  id: string;
  evrak_id: string;
  ad: string;
  dosya: string;
  belge_kodu: string;
  boyut: number;
  hash: string;
}

interface EvrakKaydi {
  no: string;
  tur: string;
  konu: string;
  gelis_tarihi: string;
  basvuran_ad: string;
  mahalle: string;
  ada: string;
  parsel: string;
  pafta: string;
}

/** Bulgulardan tek bir sonuç çıkarır. */
function sonucBelirle(bulgular: Bulgu[]): 'uygun' | 'kontrol' | 'uygunsuz' {
  if (bulgular.some((b) => b.seviye === 'engel')) return 'uygunsuz';
  if (bulgular.some((b) => b.seviye === 'uyari')) return 'kontrol';
  return 'uygun';
}

function yaz(ekId: string, inceleme: Inceleme): void {
  db.prepare(
    `INSERT INTO incelemeler (ek_id, durum, sonuc, ozet, bulgular, model, tarih)
     VALUES (@ek_id, @durum, @sonuc, @ozet, @bulgular, @model, @tarih)
     ON CONFLICT (ek_id) DO UPDATE SET
       durum = excluded.durum, sonuc = excluded.sonuc, ozet = excluded.ozet,
       bulgular = excluded.bulgular, model = excluded.model, tarih = excluded.tarih`,
  ).run({
    ek_id: ekId,
    durum: inceleme.durum,
    sonuc: inceleme.sonuc ?? null,
    ozet: inceleme.ozet ?? '',
    bulgular: JSON.stringify(inceleme.bulgular),
    model: inceleme.model ?? '',
    tarih: inceleme.tarih ?? new Date().toISOString(),
  });
}

/** Tek bir eki inceler: metin çıkar → kurallar → (varsa) model. */
async function ekiIncele(ekId: string): Promise<void> {
  const ek = db.prepare('SELECT * FROM ekler WHERE id = ?').get(ekId) as EkKaydi | undefined;
  if (!ek) return;
  const evrak = db
    .prepare(
      `SELECT no, tur, konu, gelis_tarihi, basvuran_ad, mahalle, ada, parsel, pafta
         FROM evraklar WHERE id = ?`,
    )
    .get(ek.evrak_id) as EvrakKaydi | undefined;
  if (!evrak) return;

  yaz(ekId, { durum: 'inceleniyor', bulgular: [] });

  const metin = await metinCikar(join(EKLER_KLASORU, ek.dosya));
  const kopya = ek.hash
    ? (
        db
          .prepare('SELECT COUNT(*) AS n FROM ekler WHERE evrak_id = ? AND hash = ? AND id <> ?')
          .get(ek.evrak_id, ek.hash, ek.id) as { n: number }
      ).n > 0
    : false;

  const girdi: IncelemeGirdisi = {
    belgeKodu: ek.belge_kodu,
    belgeAdi: ek.belge_kodu ? belgeAdi(evrak.tur as Tur, ek.belge_kodu) : '',
    dosyaAdi: ek.ad,
    boyut: ek.boyut,
    kopyaMi: kopya,
    metin,
    evrak: {
      no: evrak.no,
      tur: evrak.tur,
      konu: evrak.konu,
      gelisTarihi: evrak.gelis_tarihi,
      basvuran: evrak.basvuran_ad,
      mahalle: evrak.mahalle,
      ada: evrak.ada,
      parsel: evrak.parsel,
      pafta: evrak.pafta,
    },
  };

  const bulgular = kurallariUygula(girdi);
  let ozet = '';
  let model = 'kural';

  const saglayici = saglayiciSec();
  // Metin yoksa modele göndermenin anlamı yok; kural bulguları yeterli.
  if (saglayici && metin.metin.length > 40) {
    try {
      const yanit = await saglayici.incele(girdi);
      bulgular.push(...yanit.bulgular);
      ozet = yanit.ozet;
      model = `kural + ${yanit.model}`;
    } catch (hata) {
      bulgular.push({
        seviye: 'bilgi',
        baslik: 'Yapay zekâ incelemesi yapılamadı',
        ayrinti: hata instanceof Error ? hata.message : 'Model yanıt vermedi.',
        kaynak: 'kural',
      });
      model = 'kural (model hatası)';
    }
  }

  yaz(ekId, {
    durum: 'tamam',
    sonuc: sonucBelirle(bulgular),
    ozet,
    bulgular,
    model,
    tarih: new Date().toISOString(),
  });
}

/** Aynı anda tek inceleme: model çağrıları sunucuyu boğmasın. */
let sira: Promise<void> = Promise.resolve();

/** İncelemeyi kuyruğa alır; yükleme isteği beklemez. */
export function incelemeyeAl(ekId: string): void {
  yaz(ekId, { durum: 'bekliyor', bulgular: [] });
  sira = sira
    .then(() => ekiIncele(ekId))
    .catch((hata: unknown) => {
      yaz(ekId, {
        durum: 'hata',
        bulgular: [
          {
            seviye: 'bilgi',
            baslik: 'İnceleme tamamlanamadı',
            ayrinti: hata instanceof Error ? hata.message : String(hata),
            kaynak: 'kural',
          },
        ],
        tarih: new Date().toISOString(),
      });
    });
}

/** Kuyruğun boşalmasını bekler (testler için). */
export const siraBitsin = (): Promise<void> => sira;

interface IncelemeSatir {
  ek_id: string;
  durum: string;
  sonuc: string | null;
  ozet: string;
  bulgular: string;
  model: string;
  tarih: string;
}

export function incelemeOku(ekId: string): Inceleme | undefined {
  const s = db.prepare('SELECT * FROM incelemeler WHERE ek_id = ?').get(ekId) as
    | IncelemeSatir
    | undefined;
  if (!s) return undefined;
  return {
    durum: s.durum as Inceleme['durum'],
    sonuc: (s.sonuc ?? undefined) as Inceleme['sonuc'],
    ozet: s.ozet,
    bulgular: JSON.parse(s.bulgular) as Bulgu[],
    model: s.model,
    tarih: s.tarih,
  };
}

/** Tüm incelemeleri ek kimliğine göre döndürür (liste ucu için). */
export function incelemeHaritasi(): Map<string, Inceleme> {
  const satirlar = db.prepare('SELECT * FROM incelemeler').all() as IncelemeSatir[];
  return new Map(
    satirlar.map((s) => [
      s.ek_id,
      {
        durum: s.durum as Inceleme['durum'],
        sonuc: (s.sonuc ?? undefined) as Inceleme['sonuc'],
        ozet: s.ozet,
        bulgular: JSON.parse(s.bulgular) as Bulgu[],
        model: s.model,
        tarih: s.tarih,
      },
    ]),
  );
}
