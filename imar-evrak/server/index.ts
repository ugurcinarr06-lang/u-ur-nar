import express, { type NextFunction, type Request, type Response } from 'express';
import multer from 'multer';
import { existsSync, rmSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { COOKIE_ADI, OTURUM_SURESI_MS, sifreDogru, sifreOzeti, yeniId, yeniToken } from './auth.js';
import { EKLER_KLASORU, db, ilkKurulum, oturumTemizle } from './db.js';
import { belgeAdi } from '../src/belgeler.js';
import type { BelgeDurumu, Durum, Ek, Evrak, Tur } from '../src/types.js';

type Rol = 'mudur' | 'memur';
interface Kullanici {
  id: string;
  kullaniciAdi: string;
  ad: string;
  rol: Rol;
}

/** İstek üzerine oturum bilgisi taşımak için. */
interface Istek extends Request {
  kullanici?: Kullanici;
}

interface EvrakSatir {
  id: string;
  no: string;
  konu: string;
  tur: string;
  durum: string;
  gelis_tarihi: string;
  hedef_gun: number;
  basvuran_ad: string;
  basvuran_telefon: string;
  mahalle: string;
  ada: string;
  parsel: string;
  pafta: string;
  sorumlu: string;
  aciklama: string;
}

interface EkSatir {
  id: string;
  evrak_id: string;
  ad: string;
  dosya: string;
  belge_kodu: string;
  tur: string;
  boyut: number;
  yukleyen: string;
  tarih: string;
}

interface BelgeSatir {
  evrak_id: string;
  kod: string;
  teslim: number;
  kullanici: string;
  tarih: string;
}

interface IslemSatir {
  id: string;
  evrak_id: string;
  tarih: string;
  durum: string;
  aciklama: string;
  kullanici: string;
}

ilkKurulum();
oturumTemizle();

const app = express();
app.use(express.json({ limit: '1mb' }));

/* ------------------------------------------------------------------ */
/* Oturum                                                              */
/* ------------------------------------------------------------------ */

function tokenOku(istek: Request): string | null {
  const ham = istek.headers.cookie;
  if (!ham) return null;
  for (const parca of ham.split(';')) {
    const [ad, ...deger] = parca.trim().split('=');
    if (ad === COOKIE_ADI) return decodeURIComponent(deger.join('='));
  }
  return null;
}

function oturumKullanicisi(istek: Request): Kullanici | null {
  const token = tokenOku(istek);
  if (!token) return null;
  const satir = db
    .prepare(
      `SELECT k.id, k.kullanici_adi, k.ad, k.rol, o.bitis
         FROM oturumlar o JOIN kullanicilar k ON k.id = o.kullanici_id
        WHERE o.token = ?`,
    )
    .get(token) as
    | { id: string; kullanici_adi: string; ad: string; rol: Rol; bitis: string }
    | undefined;
  if (!satir) return null;
  if (satir.bitis < new Date().toISOString()) {
    db.prepare('DELETE FROM oturumlar WHERE token = ?').run(token);
    return null;
  }
  return { id: satir.id, kullaniciAdi: satir.kullanici_adi, ad: satir.ad, rol: satir.rol };
}

/** Girişi zorunlu kılar. */
function korumali(istek: Istek, yanit: Response, sonraki: NextFunction): void {
  const k = oturumKullanicisi(istek);
  if (!k) {
    yanit.status(401).json({ hata: 'Oturum açmanız gerekiyor.' });
    return;
  }
  istek.kullanici = k;
  sonraki();
}

/** Sadece müdür rolüne izin verir. */
function sadeceMudur(istek: Istek, yanit: Response, sonraki: NextFunction): void {
  if (istek.kullanici?.rol !== 'mudur') {
    yanit.status(403).json({ hata: 'Bu işlem için müdür yetkisi gerekiyor.' });
    return;
  }
  sonraki();
}

app.post('/api/giris', (istek, yanit) => {
  const { kullaniciAdi, sifre } = istek.body as { kullaniciAdi?: string; sifre?: string };
  const satir = db
    .prepare('SELECT * FROM kullanicilar WHERE kullanici_adi = ?')
    .get((kullaniciAdi ?? '').trim()) as
    | { id: string; kullanici_adi: string; ad: string; rol: Rol; sifre_hash: string }
    | undefined;

  if (!satir || !sifre || !sifreDogru(sifre, satir.sifre_hash)) {
    yanit.status(401).json({ hata: 'Kullanıcı adı veya şifre hatalı.' });
    return;
  }

  const token = yeniToken();
  const bitis = new Date(Date.now() + OTURUM_SURESI_MS).toISOString();
  db.prepare('INSERT INTO oturumlar (token, kullanici_id, bitis) VALUES (?, ?, ?)').run(
    token,
    satir.id,
    bitis,
  );
  yanit.setHeader(
    'Set-Cookie',
    `${COOKIE_ADI}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${OTURUM_SURESI_MS / 1000}`,
  );
  yanit.json({ id: satir.id, kullaniciAdi: satir.kullanici_adi, ad: satir.ad, rol: satir.rol });
});

app.post('/api/cikis', (istek, yanit) => {
  const token = tokenOku(istek);
  if (token) db.prepare('DELETE FROM oturumlar WHERE token = ?').run(token);
  yanit.setHeader('Set-Cookie', `${COOKIE_ADI}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
  yanit.json({ tamam: true });
});

app.get('/api/ben', (istek, yanit) => {
  const k = oturumKullanicisi(istek);
  if (!k) {
    yanit.status(401).json({ hata: 'Oturum yok.' });
    return;
  }
  yanit.json(k);
});

app.post('/api/sifre', korumali, (istek: Istek, yanit) => {
  const { eski, yeni } = istek.body as { eski?: string; yeni?: string };
  if (!yeni || yeni.length < 6) {
    yanit.status(400).json({ hata: 'Yeni şifre en az 6 karakter olmalı.' });
    return;
  }
  const satir = db.prepare('SELECT sifre_hash FROM kullanicilar WHERE id = ?').get(
    istek.kullanici!.id,
  ) as { sifre_hash: string };
  if (!eski || !sifreDogru(eski, satir.sifre_hash)) {
    yanit.status(400).json({ hata: 'Mevcut şifre hatalı.' });
    return;
  }
  db.prepare('UPDATE kullanicilar SET sifre_hash = ? WHERE id = ?').run(
    sifreOzeti(yeni),
    istek.kullanici!.id,
  );
  yanit.json({ tamam: true });
});

/* ------------------------------------------------------------------ */
/* Kullanıcı yönetimi (müdür)                                          */
/* ------------------------------------------------------------------ */

app.get('/api/kullanicilar', korumali, sadeceMudur, (_istek, yanit) => {
  const satirlar = db
    .prepare('SELECT id, kullanici_adi, ad, rol FROM kullanicilar ORDER BY ad')
    .all() as { id: string; kullanici_adi: string; ad: string; rol: Rol }[];
  yanit.json(
    satirlar.map((s) => ({ id: s.id, kullaniciAdi: s.kullanici_adi, ad: s.ad, rol: s.rol })),
  );
});

app.post('/api/kullanicilar', korumali, sadeceMudur, (istek, yanit) => {
  const { kullaniciAdi, ad, rol, sifre } = istek.body as {
    kullaniciAdi?: string;
    ad?: string;
    rol?: Rol;
    sifre?: string;
  };
  if (!kullaniciAdi?.trim() || !ad?.trim() || !sifre || sifre.length < 6) {
    yanit.status(400).json({ hata: 'Kullanıcı adı, ad ve en az 6 karakterli şifre gerekli.' });
    return;
  }
  const varMi = db
    .prepare('SELECT 1 FROM kullanicilar WHERE kullanici_adi = ?')
    .get(kullaniciAdi.trim());
  if (varMi) {
    yanit.status(409).json({ hata: 'Bu kullanıcı adı zaten kayıtlı.' });
    return;
  }
  const id = yeniId();
  db.prepare(
    `INSERT INTO kullanicilar (id, kullanici_adi, ad, rol, sifre_hash, olusturma)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    kullaniciAdi.trim(),
    ad.trim(),
    rol === 'mudur' ? 'mudur' : 'memur',
    sifreOzeti(sifre),
    new Date().toISOString(),
  );
  yanit.status(201).json({ id, kullaniciAdi: kullaniciAdi.trim(), ad: ad.trim(), rol });
});

app.delete('/api/kullanicilar/:id', korumali, sadeceMudur, (istek: Istek, yanit) => {
  if (String(istek.params.id) === istek.kullanici!.id) {
    yanit.status(400).json({ hata: 'Kendi hesabınızı silemezsiniz.' });
    return;
  }
  db.prepare('DELETE FROM kullanicilar WHERE id = ?').run(istek.params.id);
  yanit.json({ tamam: true });
});

/* ------------------------------------------------------------------ */
/* Evraklar                                                            */
/* ------------------------------------------------------------------ */

const ekDon = (e: EkSatir): Ek => ({
  id: e.id,
  belgeKodu: e.belge_kodu ?? '',
  ad: e.ad,
  boyut: e.boyut,
  tur: e.tur,
  yukleyen: e.yukleyen,
  tarih: e.tarih,
});

const belgeDon = (b: BelgeSatir): BelgeDurumu => ({
  kod: b.kod,
  teslim: b.teslim === 1,
  kullanici: b.kullanici,
  tarih: b.tarih,
});

function evrakDon(
  satir: EvrakSatir,
  islemler: IslemSatir[],
  ekler: EkSatir[],
  belgeler: BelgeSatir[],
): Evrak {
  return {
    id: satir.id,
    no: satir.no,
    konu: satir.konu,
    tur: satir.tur as Tur,
    durum: satir.durum as Durum,
    gelisTarihi: satir.gelis_tarihi,
    hedefGun: satir.hedef_gun,
    basvuran: { ad: satir.basvuran_ad, telefon: satir.basvuran_telefon },
    tasinmaz: {
      mahalle: satir.mahalle,
      ada: satir.ada,
      parsel: satir.parsel,
      pafta: satir.pafta,
    },
    sorumlu: satir.sorumlu,
    aciklama: satir.aciklama,
    gecmis: islemler.map((i) => ({
      id: i.id,
      tarih: i.tarih,
      durum: i.durum as Durum,
      not: i.aciklama,
      kullanici: i.kullanici,
    })),
    ekler: ekler.map(ekDon),
    belgeler: belgeler.map(belgeDon),
  };
}

/** Satırları evrak kimliğine göre gruplar. */
function grupla<T extends { evrak_id: string }>(satirlar: T[]): Map<string, T[]> {
  const harita = new Map<string, T[]>();
  for (const s of satirlar) {
    const liste = harita.get(s.evrak_id);
    if (liste) liste.push(s);
    else harita.set(s.evrak_id, [s]);
  }
  return harita;
}

const evrakAlanlari = (e: Partial<Evrak>) => ({
  no: e.no ?? '',
  konu: e.konu ?? '',
  tur: e.tur ?? 'diger',
  durum: e.durum ?? 'yeni',
  gelis_tarihi: e.gelisTarihi ?? new Date().toISOString().slice(0, 10),
  hedef_gun: e.hedefGun ?? 30,
  basvuran_ad: e.basvuran?.ad ?? '',
  basvuran_telefon: e.basvuran?.telefon ?? '',
  mahalle: e.tasinmaz?.mahalle ?? '',
  ada: e.tasinmaz?.ada ?? '',
  parsel: e.tasinmaz?.parsel ?? '',
  pafta: e.tasinmaz?.pafta ?? '',
  sorumlu: e.sorumlu ?? '',
  aciklama: e.aciklama ?? '',
});

app.get('/api/evraklar', korumali, (_istek, yanit) => {
  const evraklar = db.prepare('SELECT * FROM evraklar ORDER BY gelis_tarihi DESC, no DESC').all() as
    | EvrakSatir[];
  const islemler = grupla(db.prepare('SELECT * FROM islemler ORDER BY tarih').all() as IslemSatir[]);
  const ekler = grupla(db.prepare('SELECT * FROM ekler ORDER BY tarih').all() as EkSatir[]);
  const belgeler = grupla(db.prepare('SELECT * FROM belgeler').all() as BelgeSatir[]);
  yanit.json(
    evraklar.map((e) =>
      evrakDon(e, islemler.get(e.id) ?? [], ekler.get(e.id) ?? [], belgeler.get(e.id) ?? []),
    ),
  );
});

app.post('/api/evraklar', korumali, (istek: Istek, yanit) => {
  const gelen = istek.body as Partial<Evrak>;
  if (!gelen.no?.trim() || !gelen.konu?.trim()) {
    yanit.status(400).json({ hata: 'Evrak no ve konu zorunlu.' });
    return;
  }
  if (db.prepare('SELECT 1 FROM evraklar WHERE no = ?').get(gelen.no.trim())) {
    yanit.status(409).json({ hata: `${gelen.no} numaralı evrak zaten kayıtlı.` });
    return;
  }

  const id = yeniId();
  const alan = evrakAlanlari(gelen);
  const simdi = new Date().toISOString();
  db.prepare(
    `INSERT INTO evraklar (id, no, konu, tur, durum, gelis_tarihi, hedef_gun, basvuran_ad,
       basvuran_telefon, mahalle, ada, parsel, pafta, sorumlu, aciklama, olusturma, guncelleme)
     VALUES (@id, @no, @konu, @tur, @durum, @gelis_tarihi, @hedef_gun, @basvuran_ad,
       @basvuran_telefon, @mahalle, @ada, @parsel, @pafta, @sorumlu, @aciklama, @simdi, @simdi)`,
  ).run({ ...alan, id, simdi });
  db.prepare(
    'INSERT INTO islemler (id, evrak_id, tarih, durum, aciklama, kullanici) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(yeniId(), id, simdi, alan.durum, 'Evrak kaydı açıldı.', istek.kullanici!.ad);

  yanit.status(201).json(tekEvrak(id));
});

app.put('/api/evraklar/:id', korumali, (istek: Istek, yanit) => {
  const id = String(istek.params.id);
  if (!db.prepare('SELECT 1 FROM evraklar WHERE id = ?').get(id)) {
    yanit.status(404).json({ hata: 'Evrak bulunamadı.' });
    return;
  }
  const alan = evrakAlanlari(istek.body as Partial<Evrak>);
  const simdi = new Date().toISOString();
  db.prepare(
    `UPDATE evraklar SET no=@no, konu=@konu, tur=@tur, durum=@durum, gelis_tarihi=@gelis_tarihi,
       hedef_gun=@hedef_gun, basvuran_ad=@basvuran_ad, basvuran_telefon=@basvuran_telefon,
       mahalle=@mahalle, ada=@ada, parsel=@parsel, pafta=@pafta, sorumlu=@sorumlu,
       aciklama=@aciklama, guncelleme=@simdi WHERE id=@id`,
  ).run({ ...alan, id, simdi });
  db.prepare(
    'INSERT INTO islemler (id, evrak_id, tarih, durum, aciklama, kullanici) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(yeniId(), id, simdi, alan.durum, 'Kayıt bilgileri güncellendi.', istek.kullanici!.ad);
  yanit.json(tekEvrak(id));
});

app.post('/api/evraklar/:id/islemler', korumali, (istek: Istek, yanit) => {
  const id = String(istek.params.id);
  const { durum, not } = istek.body as { durum?: Durum; not?: string };
  if (!durum) {
    yanit.status(400).json({ hata: 'Durum zorunlu.' });
    return;
  }
  if (!db.prepare('SELECT 1 FROM evraklar WHERE id = ?').get(id)) {
    yanit.status(404).json({ hata: 'Evrak bulunamadı.' });
    return;
  }
  const simdi = new Date().toISOString();
  db.prepare('UPDATE evraklar SET durum = ?, guncelleme = ? WHERE id = ?').run(durum, simdi, id);
  db.prepare(
    'INSERT INTO islemler (id, evrak_id, tarih, durum, aciklama, kullanici) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(yeniId(), id, simdi, durum, not ?? '', istek.kullanici!.ad);
  yanit.json(tekEvrak(id));
});

app.delete('/api/evraklar/:id', korumali, sadeceMudur, (istek, yanit) => {
  db.prepare('DELETE FROM islemler WHERE evrak_id = ?').run(istek.params.id);
  db.prepare('DELETE FROM evraklar WHERE id = ?').run(istek.params.id);
  yanit.json({ tamam: true });
});

function tekEvrak(id: string): Evrak {
  const satir = db.prepare('SELECT * FROM evraklar WHERE id = ?').get(id) as EvrakSatir;
  const islemler = db
    .prepare('SELECT * FROM islemler WHERE evrak_id = ? ORDER BY tarih')
    .all(id) as IslemSatir[];
  const ekler = db
    .prepare('SELECT * FROM ekler WHERE evrak_id = ? ORDER BY tarih')
    .all(id) as EkSatir[];
  const belgeler = db
    .prepare('SELECT * FROM belgeler WHERE evrak_id = ?')
    .all(id) as BelgeSatir[];
  return evrakDon(satir, islemler, ekler, belgeler);
}

app.put('/api/evraklar/:id/belgeler', korumali, (istek: Istek, yanit) => {
  const id = String(istek.params.id);
  const { kod, teslim } = istek.body as { kod?: string; teslim?: boolean };
  if (!kod) {
    yanit.status(400).json({ hata: 'Belge kodu zorunlu.' });
    return;
  }
  if (!db.prepare('SELECT 1 FROM evraklar WHERE id = ?').get(id)) {
    yanit.status(404).json({ hata: 'Evrak bulunamadı.' });
    return;
  }
  // İşaretsiz belge satırı tutulmaz: kaldırınca kayıt silinir.
  if (teslim) {
    db.prepare(
      `INSERT INTO belgeler (evrak_id, kod, teslim, kullanici, tarih)
       VALUES (?, ?, 1, ?, ?)
       ON CONFLICT (evrak_id, kod)
       DO UPDATE SET teslim = 1, kullanici = excluded.kullanici, tarih = excluded.tarih`,
    ).run(id, kod, istek.kullanici!.ad, new Date().toISOString());
  } else {
    db.prepare('DELETE FROM belgeler WHERE evrak_id = ? AND kod = ?').run(id, kod);
  }
  yanit.json(tekEvrak(id));
});

/* ------------------------------------------------------------------ */
/* Evrak ekleri                                                        */
/* ------------------------------------------------------------------ */

/** İmar dosyalarında karşılaşılan biçimler; başkası kabul edilmez. */
const IZINLI_UZANTILAR = new Set([
  '.pdf', '.jpg', '.jpeg', '.png', '.webp', '.gif', '.tif', '.tiff', '.heic',
  '.doc', '.docx', '.xls', '.xlsx', '.txt', '.dwg', '.dxf', '.zip', '.rar',
]);

const EN_BUYUK_DOSYA = 25 * 1024 * 1024;

const yukle = multer({
  storage: multer.diskStorage({
    destination: (_i, _d, gec) => gec(null, EKLER_KLASORU),
    // Dosya adı kullanıcıdan gelmez: disk adı üretilir, özgün ad veritabanında durur.
    filename: (_i, dosya, gec) => gec(null, yeniId() + extname(dosya.originalname).toLowerCase()),
  }),
  limits: { fileSize: EN_BUYUK_DOSYA, files: 10 },
  fileFilter: (_i, dosya, gec) => {
    if (!IZINLI_UZANTILAR.has(extname(dosya.originalname).toLowerCase())) {
      gec(new Error('Bu dosya türü kabul edilmiyor.'));
      return;
    }
    gec(null, true);
  },
});

/**
 * Tarayıcılar dosya adını latin-1 olarak gönderir; Türkçe karakterlerin
 * bozulmaması için utf-8'e çeviriyoruz.
 */
const adiDuzelt = (ad: string): string => Buffer.from(ad, 'latin1').toString('utf8');

app.post(
  '/api/evraklar/:id/ekler',
  korumali,
  (istek: Istek, yanit, sonraki) => {
    yukle.array('dosyalar', 10)(istek, yanit, (hata: unknown) => {
      if (hata) {
        const mesaj =
          hata instanceof Error && hata.message.includes('File too large')
            ? 'Dosya 25 MB sınırını aşıyor.'
            : hata instanceof Error
              ? hata.message
              : 'Dosya yüklenemedi.';
        yanit.status(400).json({ hata: mesaj });
        return;
      }
      sonraki();
    });
  },
  (istek: Istek, yanit) => {
    const id = String(istek.params.id);
    const dosyalar = (istek.files as Express.Multer.File[] | undefined) ?? [];

    const evrak = db.prepare('SELECT durum, tur FROM evraklar WHERE id = ?').get(id) as
      | { durum: string; tur: string }
      | undefined;
    if (!evrak) {
      for (const d of dosyalar) rmSync(d.path, { force: true });
      yanit.status(404).json({ hata: 'Evrak bulunamadı.' });
      return;
    }
    if (dosyalar.length === 0) {
      yanit.status(400).json({ hata: 'Dosya seçilmedi.' });
      return;
    }

    const simdi = new Date().toISOString();
    const durum = evrak.durum;
    // Kontrol listesindeki bir maddeye yükleniyorsa kodu gövdede gelir.
    const belgeKodu = String((istek.body as { belgeKodu?: string }).belgeKodu ?? '').trim();

    const ekle = db.prepare(
      `INSERT INTO ekler (id, evrak_id, ad, dosya, belge_kodu, tur, boyut, yukleyen, tarih)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const belgeIsaretle = db.prepare(
      `INSERT INTO belgeler (evrak_id, kod, teslim, kullanici, tarih)
       VALUES (?, ?, 1, ?, ?)
       ON CONFLICT (evrak_id, kod)
       DO UPDATE SET teslim = 1, kullanici = excluded.kullanici, tarih = excluded.tarih`,
    );
    const islemYaz = db.prepare(
      'INSERT INTO islemler (id, evrak_id, tarih, durum, aciklama, kullanici) VALUES (?, ?, ?, ?, ?, ?)',
    );

    const adlar: string[] = [];
    db.transaction(() => {
      for (const d of dosyalar) {
        const ad = adiDuzelt(d.originalname);
        adlar.push(ad);
        ekle.run(
          yeniId(),
          id,
          ad,
          d.filename,
          belgeKodu,
          d.mimetype,
          d.size,
          istek.kullanici!.ad,
          simdi,
        );
      }
      // Belgeye yüklenen dosya, o maddeyi teslim alınmış sayar.
      if (belgeKodu) belgeIsaretle.run(id, belgeKodu, istek.kullanici!.ad, simdi);
      islemYaz.run(
        yeniId(),
        id,
        simdi,
        durum,
        belgeKodu
          ? `${belgeAdi(evrak.tur as Tur, belgeKodu)} teslim alındı: ${adlar.join(', ')}`
          : `Dosya eklendi: ${adlar.join(', ')}`,
        istek.kullanici!.ad,
      );
    })();

    yanit.status(201).json(tekEvrak(id));
  },
);

app.get('/api/ekler/:id', korumali, (istek, yanit) => {
  const ek = db.prepare('SELECT * FROM ekler WHERE id = ?').get(String(istek.params.id)) as
    | EkSatir
    | undefined;
  if (!ek) {
    yanit.status(404).json({ hata: 'Ek bulunamadı.' });
    return;
  }
  const yol = join(EKLER_KLASORU, ek.dosya);
  if (!existsSync(yol)) {
    yanit.status(410).json({ hata: 'Dosya diskte bulunamadı.' });
    return;
  }
  // inline: PDF ve görseller tarayıcıda açılsın, indirme kullanıcıya kalsın.
  yanit.type(ek.tur || 'application/octet-stream');
  yanit.setHeader(
    'Content-Disposition',
    `inline; filename*=UTF-8''${encodeURIComponent(ek.ad)}`,
  );
  yanit.sendFile(yol);
});

app.delete('/api/ekler/:id', korumali, (istek: Istek, yanit) => {
  const ek = db.prepare('SELECT * FROM ekler WHERE id = ?').get(String(istek.params.id)) as
    | EkSatir
    | undefined;
  if (!ek) {
    yanit.status(404).json({ hata: 'Ek bulunamadı.' });
    return;
  }
  // Eki yükleyen kişi veya müdür silebilir.
  if (istek.kullanici!.rol !== 'mudur' && ek.yukleyen !== istek.kullanici!.ad) {
    yanit.status(403).json({ hata: 'Bu eki yalnızca yükleyen kişi veya müdür silebilir.' });
    return;
  }
  const simdi = new Date().toISOString();
  const evrak = db.prepare('SELECT durum, tur FROM evraklar WHERE id = ?').get(ek.evrak_id) as {
    durum: string;
    tur: string;
  };
  const durum = evrak.durum;
  db.prepare('DELETE FROM ekler WHERE id = ?').run(ek.id);
  rmSync(join(EKLER_KLASORU, ek.dosya), { force: true });

  // Bir belgenin son dosyası da silindiyse madde yeniden eksik sayılır.
  let isaretKalkti = false;
  if (ek.belge_kodu) {
    const kalan = db
      .prepare('SELECT COUNT(*) AS n FROM ekler WHERE evrak_id = ? AND belge_kodu = ?')
      .get(ek.evrak_id, ek.belge_kodu) as { n: number };
    if (kalan.n === 0) {
      db.prepare('DELETE FROM belgeler WHERE evrak_id = ? AND kod = ?').run(
        ek.evrak_id,
        ek.belge_kodu,
      );
      isaretKalkti = true;
    }
  }

  db.prepare(
    'INSERT INTO islemler (id, evrak_id, tarih, durum, aciklama, kullanici) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(
    yeniId(),
    ek.evrak_id,
    simdi,
    durum,
    `Dosya silindi: ${ek.ad}${
      isaretKalkti
        ? ` — ${belgeAdi(evrak.tur as Tur, ek.belge_kodu)} yeniden eksik sayıldı`
        : ''
    }`,
    istek.kullanici!.ad,
  );
  yanit.json(tekEvrak(ek.evrak_id));
});

/* ------------------------------------------------------------------ */
/* Derlenmiş arayüz                                                    */
/* ------------------------------------------------------------------ */

const arayuz = resolve('dist');
if (existsSync(arayuz)) {
  app.use(express.static(arayuz));
  app.get(/^\/(?!api\/).*/, (_istek, yanit) => yanit.sendFile(resolve(arayuz, 'index.html')));
}

const port = Number(process.env.PORT ?? 3200);
app.listen(port, () => {
  console.log(`İmar Evrak sunucusu: http://localhost:${port}`);
  if (!existsSync(arayuz)) {
    console.log('(arayüz derlenmemiş — geliştirme için ayrı terminalde: npm run dev)');
  }
});
