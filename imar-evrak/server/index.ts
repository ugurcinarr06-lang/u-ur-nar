import express, { type NextFunction, type Request, type Response } from 'express';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { COOKIE_ADI, OTURUM_SURESI_MS, sifreDogru, sifreOzeti, yeniId, yeniToken } from './auth.js';
import { db, ilkKurulum, oturumTemizle } from './db.js';
import type { Durum, Evrak, Tur } from '../src/types.js';

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

function evrakDon(satir: EvrakSatir, islemler: IslemSatir[]): Evrak {
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
  };
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
  const islemler = db.prepare('SELECT * FROM islemler ORDER BY tarih').all() as IslemSatir[];
  const gruplu = new Map<string, IslemSatir[]>();
  for (const i of islemler) {
    const liste = gruplu.get(i.evrak_id);
    if (liste) liste.push(i);
    else gruplu.set(i.evrak_id, [i]);
  }
  yanit.json(evraklar.map((e) => evrakDon(e, gruplu.get(e.id) ?? [])));
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
  return evrakDon(satir, islemler);
}

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
