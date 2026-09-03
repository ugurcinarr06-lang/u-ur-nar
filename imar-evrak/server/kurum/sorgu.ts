import type { Bulgu } from '../../src/types.js';
import { yeniId } from '../auth.js';
import { db } from '../db.js';
import { saglayiciSec, type SorguGirdisi } from './saglayici.js';
import type { SorguKaydi, SorguTuru } from './tipler.js';

export interface SorguYaniti {
  tur: SorguTuru;
  durum: SorguKaydi['durum'];
  ozet: string;
  bulgular: Bulgu[];
  tarih: string;
}

/** Ad karşılaştırması: büyük/küçük ve Türkçe harf farkları önemsiz. */
const sadelestir = (m: string): string =>
  m
    .toLocaleLowerCase('tr')
    .replace(/[ıİ]/g, 'i')
    .replace(/[şŞ]/g, 's')
    .replace(/[ğĞ]/g, 'g')
    .replace(/[üÜ]/g, 'u')
    .replace(/[öÖ]/g, 'o')
    .replace(/[çÇ]/g, 'c')
    .replace(/\s+/g, ' ')
    .trim();

interface EvrakSatiri {
  id: string;
  durum: string;
  mahalle: string;
  ada: string;
  parsel: string;
  basvuran_ad: string;
}

function kaydet(k: Omit<SorguKaydi, 'id'>): void {
  db.prepare(
    `INSERT INTO kurum_sorgulari (id, evrak_id, tur, girdi, durum, ozet, hata, ham, kullanici, tarih)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    yeniId(),
    k.evrak_id,
    k.tur,
    k.girdi,
    k.durum,
    k.ozet,
    k.hata,
    k.ham,
    k.kullanici,
    k.tarih,
  );
}

/** Belgeyi "kaynağından doğrulandı" olarak işaretler. */
function dogrulandiYaz(evrakId: string, belgeKodu: string, referans: string, kullanici: string) {
  const simdi = new Date().toISOString();
  db.prepare(
    `INSERT INTO belgeler (evrak_id, kod, teslim, dogrulama_kodu, dogrulandi, dogrulayan, dogrulama_tarihi, kullanici, tarih)
     VALUES (?, ?, 1, ?, 1, ?, ?, ?, ?)
     ON CONFLICT (evrak_id, kod) DO UPDATE SET
       dogrulama_kodu = excluded.dogrulama_kodu, dogrulandi = 1,
       dogrulayan = excluded.dogrulayan, dogrulama_tarihi = excluded.dogrulama_tarihi`,
  ).run(evrakId, belgeKodu, referans, kullanici, simdi, kullanici, simdi);
}

function islemYaz(evrakId: string, durum: string, aciklama: string, kullanici: string) {
  db.prepare(
    'INSERT INTO islemler (id, evrak_id, tarih, durum, aciklama, kullanici) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(yeniId(), evrakId, new Date().toISOString(), durum, aciklama, kullanici);
}

/**
 * Bir evrak için kurum sorgusu çalıştırır, sonucu evrak kaydıyla
 * karşılaştırır ve denetim kaydı bırakır. Sorgu sonucu belgeyi kendiliğinden
 * uygun yapmaz; yalnızca "kaynağından doğrulandı" işaretini ve bulguları
 * üretir — karar yine memurundur.
 */
export async function kurumSorgusu(
  evrakId: string,
  tur: SorguTuru,
  belgeNo: string,
  kullanici: string,
): Promise<SorguYaniti> {
  const evrak = db
    .prepare('SELECT id, durum, mahalle, ada, parsel, basvuran_ad FROM evraklar WHERE id = ?')
    .get(evrakId) as EvrakSatiri | undefined;
  if (!evrak) throw new Error('Evrak bulunamadı.');

  const saglayici = saglayiciSec(tur);
  if (!saglayici) {
    throw new Error(
      `${tur.toUpperCase()} bağlantısı kapalı. Kurum protokolü tamamlandığında ortam ayarlarından açılır.`,
    );
  }

  const girdi: SorguGirdisi = {
    il: process.env.IMAR_IL ?? '',
    ilce: process.env.IMAR_ILCE ?? '',
    mahalle: evrak.mahalle,
    ada: evrak.ada,
    parsel: evrak.parsel,
    belgeNo,
  };
  const anahtar = tur === 'takbis' ? `${evrak.ada}/${evrak.parsel}` : belgeNo;
  const tarih = new Date().toISOString();
  const bulgular: Bulgu[] = [];
  const ekle = (seviye: Bulgu['seviye'], baslik: string, ayrinti?: string) =>
    bulgular.push({ seviye, baslik, ayrinti, kaynak: 'kurum' });

  try {
    if (tur === 'takbis') {
      if (!saglayici.tapuSorgula) throw new Error('Sağlayıcı tapu sorgusunu desteklemiyor.');
      const { veri, ham } = await saglayici.tapuSorgula(girdi);

      if (!veri.bulundu) {
        const ozet = `${anahtar} için tapu kaydı bulunamadı.`;
        ekle('engel', 'Tapu kaydı bulunamadı', `Sorgulanan: ${anahtar}`);
        kaydet({
          evrak_id: evrakId,
          tur,
          girdi: anahtar,
          durum: 'bulunamadi',
          ozet,
          hata: '',
          ham: JSON.stringify(ham),
          kullanici,
          tarih,
        });
        islemYaz(evrakId, evrak.durum, `TAKBİS sorgusu: ${ozet}`, kullanici);
        return { tur, durum: 'bulunamadi', ozet, bulgular, tarih };
      }

      if (evrak.ada && veri.ada && veri.ada !== evrak.ada) {
        ekle('engel', 'Ada numarası tutmuyor', `Kurum: ${veri.ada} · kayıt: ${evrak.ada}`);
      }
      if (evrak.parsel && veri.parsel && veri.parsel !== evrak.parsel) {
        ekle('engel', 'Parsel numarası tutmuyor', `Kurum: ${veri.parsel} · kayıt: ${evrak.parsel}`);
      }

      const basvuran = sadelestir(evrak.basvuran_ad);
      const malikler = veri.malikler.map(sadelestir);
      if (basvuran && malikler.length > 0) {
        if (malikler.some((m) => m === basvuran || m.includes(basvuran) || basvuran.includes(m))) {
          ekle('bilgi', 'Başvuran, tapu malikleri arasında');
        } else {
          ekle(
            'uyari',
            'Başvuran malik listesinde görünmüyor',
            `Kurum kaydındaki malik(ler): ${veri.malikler.join(', ')} · başvuran: ${evrak.basvuran_ad}. Vekâlet veya hissedarlık kontrol edilmeli.`,
          );
        }
      }
      if (veri.takyidat?.trim()) {
        ekle('uyari', 'Taşınmaz üzerinde takyidat var', veri.takyidat);
      }

      const ozet =
        `Malik: ${veri.malikler.join(', ') || '—'} · ${veri.nitelik ?? ''} ${veri.yuzolcumu ?? ''}`.trim();
      kaydet({
        evrak_id: evrakId,
        tur,
        girdi: anahtar,
        durum: 'basarili',
        ozet,
        hata: '',
        ham: JSON.stringify(ham),
        kullanici,
        tarih,
      });
      // Engel yoksa tapu belgesi kaynağından doğrulanmış sayılır.
      if (!bulgular.some((b) => b.seviye === 'engel')) {
        dogrulandiYaz(evrakId, 'tapu', `TAKBİS ${anahtar}`, kullanici);
      }
      islemYaz(evrakId, evrak.durum, `TAKBİS sorgusu (${anahtar}): ${ozet}`, kullanici);
      return { tur, durum: 'basarili', ozet, bulgular, tarih };
    }

    // YAMBİS
    if (!saglayici.muteahhitSorgula) throw new Error('Sağlayıcı müteahhit sorgusunu desteklemiyor.');
    if (!belgeNo.trim()) throw new Error('Yetki belgesi numarası gerekli.');
    const { veri, ham } = await saglayici.muteahhitSorgula(girdi);

    if (!veri.bulundu) {
      const ozet = `${belgeNo} numaralı yetki belgesi bulunamadı.`;
      ekle('engel', 'Yetki belgesi bulunamadı', `Sorgulanan: ${belgeNo}`);
      kaydet({
        evrak_id: evrakId,
        tur,
        girdi: anahtar,
        durum: 'bulunamadi',
        ozet,
        hata: '',
        ham: JSON.stringify(ham),
        kullanici,
        tarih,
      });
      islemYaz(evrakId, evrak.durum, `YAMBİS sorgusu: ${ozet}`, kullanici);
      return { tur, durum: 'bulunamadi', ozet, bulgular, tarih };
    }

    const bugun = new Date().toISOString().slice(0, 10);
    if (veri.gecerlilik && veri.gecerlilik < bugun) {
      ekle('engel', 'Yetki belgesinin süresi dolmuş', `Geçerlilik: ${veri.gecerlilik}`);
    }
    if (veri.durum && !/faal/i.test(veri.durum)) {
      ekle('engel', 'Yetki belgesi faal değil', `Kurum kaydı: ${veri.durum}`);
    }
    if (bulgular.length === 0) ekle('bilgi', 'Yetki belgesi geçerli', `Geçerlilik: ${veri.gecerlilik ?? '—'}`);

    const ozet = `${veri.unvan ?? '—'} · ${veri.durum ?? ''} · geçerlilik ${veri.gecerlilik ?? '—'}`;
    kaydet({
      evrak_id: evrakId,
      tur,
      girdi: anahtar,
      durum: 'basarili',
      ozet,
      hata: '',
      ham: JSON.stringify(ham),
      kullanici,
      tarih,
    });
    if (!bulgular.some((b) => b.seviye === 'engel')) {
      dogrulandiYaz(evrakId, 'muteahhit', `YAMBİS ${belgeNo}`, kullanici);
    }
    islemYaz(evrakId, evrak.durum, `YAMBİS sorgusu (${belgeNo}): ${ozet}`, kullanici);
    return { tur, durum: 'basarili', ozet, bulgular, tarih };
  } catch (hata) {
    const mesaj = hata instanceof Error ? hata.message : String(hata);
    kaydet({
      evrak_id: evrakId,
      tur,
      girdi: anahtar,
      durum: 'hata',
      ozet: '',
      hata: mesaj,
      ham: '',
      kullanici,
      tarih,
    });
    throw hata;
  }
}

export const sonSorgular = (adet = 40): SorguKaydi[] =>
  db
    .prepare('SELECT * FROM kurum_sorgulari ORDER BY tarih DESC LIMIT ?')
    .all(adet) as SorguKaydi[];

export const evrakSorgulari = (evrakId: string): SorguKaydi[] =>
  db
    .prepare('SELECT * FROM kurum_sorgulari WHERE evrak_id = ? ORDER BY tarih DESC')
    .all(evrakId) as SorguKaydi[];
