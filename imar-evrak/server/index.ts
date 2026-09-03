import express, { type NextFunction, type Request, type Response } from 'express';
import multer from 'multer';
import { existsSync, rmSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import {
  COOKIE_ADI,
  OTURUM_SURESI_MS,
  sifreDogru,
  sifreOzeti,
  takipKoduUret,
  yeniId,
  yeniToken,
} from './auth.js';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { EKLER_KLASORU, db, ilkKurulum, oturumTemizle } from './db.js';
import { incelemeHaritasi, incelemeOku, incelemeyeAl } from './ai/inceleme.js';
import { saglayiciAdi } from './ai/saglayici.js';
import { kurallariTara, vatandasaBildir } from './bildirim/kurallar.js';
import { kuyrugaBak, sonBildirimler, tekrarDene } from './bildirim/kuyruk.js';
import { kanalDurumu } from './bildirim/saglayici.js';
import { kurumDurumu } from './kurum/saglayici.js';
import { evrakSorgulari, kurumSorgusu, sonSorgular } from './kurum/sorgu.js';
import type { SorguTuru } from './kurum/tipler.js';
import { belgeAdi } from '../src/belgeler.js';
import { belgeListesi } from '../src/belgeler.js';
import { harcHesapla, tarifeDuzelt, VARSAYILAN_TARIFE, type Tahakkuk } from '../src/harc.js';
import { YAPI_ALAN_KODLARI, type YapiBilgisi } from '../src/yapi.js';
import { BEKLEYEN_DURUMLAR, type Gorus, type GorusDurumu } from '../src/gorus.js';
import type {
  BelgeDurumu,
  Durum,
  Ek,
  Evrak,
  Inceleme,
  TakipSonucu,
  Tur,
} from '../src/types.js';

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
  takip_kodu: string;
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
  yapi: string;
}

interface GorusSatir {
  id: string;
  evrak_id: string;
  kurum: string;
  konu: string;
  durum: string;
  gonderim_tarihi: string;
  cevap_tarihi: string;
  sayi: string;
  cevap_sayisi: string;
  aciklama: string;
  olusturan: string;
  tarih: string;
}

interface TahakkukSatir {
  evrak_id: string;
  satirlar: string;
  toplam: number;
  uyarilar: string;
  tarife_onayli: number;
  tarife_yili: number;
  makbuz_no: string;
  odeme_tarihi: string;
  hesaplayan: string;
  tarih: string;
}

interface EkSatir {
  id: string;
  evrak_id: string;
  yukleyen_id: string;
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
  karar: string;
  karar_notu: string;
  karar_veren: string;
  karar_tarihi: string;
  dogrulama_kodu: string;
  dogrulandi: number;
  dogrulayan: string;
  dogrulama_tarihi: string;
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

/**
 * Ters vekil (nginx) arkasında istemci IP'si X-Forwarded-For başlığından
 * okunur; ayarlanmazsa takip ucundaki deneme sınırı tüm ziyaretçiler için
 * ortak sayılırdı. Değer: "1" (tek vekil) veya vekil IP/ağı.
 */
const vekil = process.env.TRUST_PROXY ?? '';
if (vekil) app.set('trust proxy', /^\d+$/.test(vekil) ? Number(vekil) : vekil);

app.use(express.json({ limit: '1mb' }));

/* ------------------------------------------------------------------ */
/* Oturum                                                              */
/* ------------------------------------------------------------------ */

/**
 * Çerezin Secure bayrağı: HTTPS üzerinden gelen isteklerde konur. Ters vekil
 * arkasında TRUST_PROXY ayarlıysa X-Forwarded-Proto okunur; IMAR_HTTPS=1 ile
 * her zaman zorlanabilir.
 */
const guvenliMi = (istek: Request): boolean =>
  process.env.IMAR_HTTPS === '1' || istek.secure;

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
    `${COOKIE_ADI}=${token}; HttpOnly; SameSite=Lax; Path=/;` +
      `${guvenliMi(istek) ? ' Secure;' : ''} Max-Age=${OTURUM_SURESI_MS / 1000}`,
  );
  yanit.json({
    id: satir.id,
    kullaniciAdi: satir.kullanici_adi,
    ad: satir.ad,
    rol: satir.rol,
    yapayZeka: saglayiciAdi(),
    bildirim: kanalDurumu(),
    kurum: kurumDurumu(),
  });
});

app.post('/api/cikis', (istek, yanit) => {
  const token = tokenOku(istek);
  if (token) db.prepare('DELETE FROM oturumlar WHERE token = ?').run(token);
  yanit.setHeader(
    'Set-Cookie',
    `${COOKIE_ADI}=; HttpOnly; SameSite=Lax; Path=/;${guvenliMi(istek) ? ' Secure;' : ''} Max-Age=0`,
  );
  yanit.json({ tamam: true });
});

app.get('/api/ben', (istek, yanit) => {
  const k = oturumKullanicisi(istek);
  if (!k) {
    yanit.status(401).json({ hata: 'Oturum yok.' });
    return;
  }
  yanit.json({ ...k, yapayZeka: saglayiciAdi(), bildirim: kanalDurumu(), kurum: kurumDurumu() });
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
    .prepare('SELECT id, kullanici_adi, ad, rol, eposta FROM kullanicilar ORDER BY ad')
    .all() as { id: string; kullanici_adi: string; ad: string; rol: Rol; eposta: string }[];
  yanit.json(
    satirlar.map((s) => ({
      id: s.id,
      kullaniciAdi: s.kullanici_adi,
      ad: s.ad,
      rol: s.rol,
      eposta: s.eposta,
    })),
  );
});

app.post('/api/kullanicilar', korumali, sadeceMudur, (istek, yanit) => {
  const { kullaniciAdi, ad, rol, sifre, eposta } = istek.body as {
    kullaniciAdi?: string;
    ad?: string;
    rol?: Rol;
    sifre?: string;
    eposta?: string;
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
    `INSERT INTO kullanicilar (id, kullanici_adi, ad, rol, sifre_hash, eposta, olusturma)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    kullaniciAdi.trim(),
    ad.trim(),
    rol === 'mudur' ? 'mudur' : 'memur',
    sifreOzeti(sifre),
    (eposta ?? '').trim(),
    new Date().toISOString(),
  );
  yanit.status(201).json({
    id,
    kullaniciAdi: kullaniciAdi.trim(),
    ad: ad.trim(),
    rol,
    eposta: (eposta ?? '').trim(),
  });
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

const ekDon = (e: EkSatir, inceleme?: Inceleme): Ek => ({
  id: e.id,
  inceleme,
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
  karar: (b.karar || undefined) as BelgeDurumu['karar'],
  kararNotu: b.karar_notu || undefined,
  kararVeren: b.karar_veren || undefined,
  kararTarihi: b.karar_tarihi || undefined,
  dogrulamaKodu: b.dogrulama_kodu || undefined,
  dogrulandi: b.dogrulandi === 1 || undefined,
  dogrulayan: b.dogrulayan || undefined,
  dogrulamaTarihi: b.dogrulama_tarihi || undefined,
});

const gorusDon = (g: GorusSatir): Gorus => ({
  id: g.id,
  kurum: g.kurum,
  konu: g.konu,
  durum: g.durum as GorusDurumu,
  gonderimTarihi: g.gonderim_tarihi,
  cevapTarihi: g.cevap_tarihi,
  sayi: g.sayi,
  cevapSayisi: g.cevap_sayisi,
  not: g.aciklama,
  olusturan: g.olusturan,
  tarih: g.tarih,
});

const tahakkukDon = (t: TahakkukSatir): Tahakkuk => ({
  satirlar: JSON.parse(t.satirlar) as Tahakkuk['satirlar'],
  toplam: t.toplam,
  uyarilar: JSON.parse(t.uyarilar) as string[],
  tarifeOnayli: t.tarife_onayli === 1,
  tarifeYili: t.tarife_yili,
  tarih: t.tarih,
  hesaplayan: t.hesaplayan,
  makbuzNo: t.makbuz_no || undefined,
  odemeTarihi: t.odeme_tarihi || undefined,
});

/** Yapı bilgisi sütunu bozuk JSON içerse bile kayıt açılabilmeli. */
function yapiCoz(ham: string): YapiBilgisi {
  try {
    const veri = JSON.parse(ham || '{}') as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(veri)
        .filter(([k]) => YAPI_ALAN_KODLARI.has(k))
        .map(([k, v]) => [k, String(v ?? '')]),
    );
  } catch {
    return {};
  }
}

function evrakDon(
  satir: EvrakSatir,
  islemler: IslemSatir[],
  ekler: EkSatir[],
  belgeler: BelgeSatir[],
  incelemeler?: Map<string, Inceleme>,
  gorusler: GorusSatir[] = [],
  tahakkuk?: TahakkukSatir,
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
    takipKodu: satir.takip_kodu,
    gecmis: islemler.map((i) => ({
      id: i.id,
      tarih: i.tarih,
      durum: i.durum as Durum,
      not: i.aciklama,
      kullanici: i.kullanici,
    })),
    ekler: ekler.map((e) => ekDon(e, incelemeler ? incelemeler.get(e.id) : incelemeOku(e.id))),
    belgeler: belgeler.map(belgeDon),
    yapi: yapiCoz(satir.yapi),
    gorusler: gorusler.map(gorusDon),
    tahakkuk: tahakkuk ? tahakkukDon(tahakkuk) : undefined,
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

/** İstemciden gelen durum/tür değerleri sabit listelerle sınırlanır. */
const DURUMLAR: Durum[] = ['yeni', 'incelemede', 'eksik', 'onaylandi', 'reddedildi', 'arsiv'];
const TURLER: Tur[] = [
  'ruhsat',
  'iskan',
  'imar-durumu',
  'kot-kesit',
  'aplikasyon',
  'yapi-kayit',
  'sikayet',
  'diger',
];

const evrakAlanlari = (e: Partial<Evrak>) => ({
  no: e.no ?? '',
  konu: e.konu ?? '',
  tur: e.tur && TURLER.includes(e.tur) ? e.tur : 'diger',
  durum: e.durum && DURUMLAR.includes(e.durum) ? e.durum : 'yeni',
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
  const gorusler = grupla(db.prepare('SELECT * FROM gorusler ORDER BY tarih').all() as GorusSatir[]);
  const tahakkuklar = new Map(
    (db.prepare('SELECT * FROM tahakkuklar').all() as TahakkukSatir[]).map((t) => [t.evrak_id, t]),
  );
  const incelemeler = incelemeHaritasi();
  yanit.json(
    evraklar.map((e) =>
      evrakDon(
        e,
        islemler.get(e.id) ?? [],
        ekler.get(e.id) ?? [],
        belgeler.get(e.id) ?? [],
        incelemeler,
        gorusler.get(e.id) ?? [],
        tahakkuklar.get(e.id),
      ),
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
       basvuran_telefon, mahalle, ada, parsel, pafta, sorumlu, aciklama, takip_kodu, olusturma, guncelleme)
     VALUES (@id, @no, @konu, @tur, @durum, @gelis_tarihi, @hedef_gun, @basvuran_ad,
       @basvuran_telefon, @mahalle, @ada, @parsel, @pafta, @sorumlu, @aciklama, @takip_kodu, @simdi, @simdi)`,
  ).run({ ...alan, id, simdi, takip_kodu: takipKoduUret() });
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
  if (!durum || !DURUMLAR.includes(durum)) {
    yanit.status(400).json({ hata: 'Geçerli bir durum gerekli.' });
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

  // Vatandaşa bilgi: yalnızca eksik belge ve sonuçlanma durumlarında.
  vatandasaBildir(id, durum, TAKIP_ADRESI);
  void kuyrugaBak();

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
  const gorusler = db
    .prepare('SELECT * FROM gorusler WHERE evrak_id = ? ORDER BY tarih')
    .all(id) as GorusSatir[];
  const tahakkuk = db.prepare('SELECT * FROM tahakkuklar WHERE evrak_id = ?').get(id) as
    | TahakkukSatir
    | undefined;
  return evrakDon(satir, islemler, ekler, belgeler, undefined, gorusler, tahakkuk);
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

/** Belgenin kaynağından teyidi: doğrulama kodu ve teyit kaydı. */
app.put('/api/evraklar/:id/belgeler/dogrulama', korumali, (istek: Istek, yanit) => {
  const id = String(istek.params.id);
  const { kod, dogrulamaKodu, dogrulandi } = istek.body as {
    kod?: string;
    dogrulamaKodu?: string;
    dogrulandi?: boolean;
  };
  const evrak = db.prepare('SELECT durum, tur FROM evraklar WHERE id = ?').get(id) as
    | { durum: string; tur: string }
    | undefined;
  if (!kod || !evrak) {
    yanit.status(kod ? 404 : 400).json({ hata: kod ? 'Evrak bulunamadı.' : 'Belge kodu zorunlu.' });
    return;
  }

  const simdi = new Date().toISOString();
  const ad = istek.kullanici!.ad;
  const oncekiDurum = db
    .prepare('SELECT dogrulandi FROM belgeler WHERE evrak_id = ? AND kod = ?')
    .get(id, kod) as { dogrulandi: number } | undefined;

  db.prepare(
    `INSERT INTO belgeler (evrak_id, kod, teslim, dogrulama_kodu, dogrulandi, dogrulayan, dogrulama_tarihi, kullanici, tarih)
     VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (evrak_id, kod) DO UPDATE SET
       dogrulama_kodu = excluded.dogrulama_kodu, dogrulandi = excluded.dogrulandi,
       dogrulayan = excluded.dogrulayan, dogrulama_tarihi = excluded.dogrulama_tarihi`,
  ).run(
    id,
    kod,
    (dogrulamaKodu ?? '').trim(),
    dogrulandi ? 1 : 0,
    dogrulandi ? ad : '',
    dogrulandi ? simdi : '',
    ad,
    simdi,
  );

  // Teyit yalnızca ilk kez verildiğinde geçmişe yazılır.
  if (dogrulandi && oncekiDurum?.dogrulandi !== 1) {
    db.prepare(
      'INSERT INTO islemler (id, evrak_id, tarih, durum, aciklama, kullanici) VALUES (?, ?, ?, ?, ?, ?)',
    ).run(
      yeniId(),
      id,
      simdi,
      evrak.durum,
      `${belgeAdi(evrak.tur as Tur, kod)} kaynağından doğrulandı${
        dogrulamaKodu ? ` (kod: ${dogrulamaKodu.trim()})` : ''
      }`,
      ad,
    );
  }
  yanit.json(tekEvrak(id));
});

/* ------------------------------------------------------------------ */
/* Yapı ve proje bilgileri (ruhsat/iskân/imar durumu belgeleri için)   */
/* ------------------------------------------------------------------ */

/** Bir alana yazılabilecek en uzun metin; plan notu gibi alanlar için geniş. */
const EN_UZUN_ALAN = 2000;

app.put('/api/evraklar/:id/yapi', korumali, (istek: Istek, yanit) => {
  const id = String(istek.params.id);
  const evrak = db.prepare('SELECT durum FROM evraklar WHERE id = ?').get(id) as
    | { durum: string }
    | undefined;
  if (!evrak) {
    yanit.status(404).json({ hata: 'Evrak bulunamadı.' });
    return;
  }
  const gelen = (istek.body as { yapi?: Record<string, unknown> }).yapi ?? {};
  // Yalnızca tanımlı alanlar kaydedilir: istemci kendi anahtarını ekleyemez.
  const temiz: YapiBilgisi = {};
  for (const [kod, deger] of Object.entries(gelen)) {
    if (!YAPI_ALAN_KODLARI.has(kod)) continue;
    const metin = String(deger ?? '').slice(0, EN_UZUN_ALAN).trim();
    if (metin) temiz[kod] = metin;
  }

  const simdi = new Date().toISOString();
  db.prepare('UPDATE evraklar SET yapi = ?, guncelleme = ? WHERE id = ?').run(
    JSON.stringify(temiz),
    simdi,
    id,
  );
  db.prepare(
    'INSERT INTO islemler (id, evrak_id, tarih, durum, aciklama, kullanici) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(yeniId(), id, simdi, evrak.durum, 'Yapı ve proje bilgileri güncellendi.', istek.kullanici!.ad);
  yanit.json(tekEvrak(id));
});

/* ------------------------------------------------------------------ */
/* Kurum görüşleri                                                     */
/* ------------------------------------------------------------------ */

const GORUS_DURUMLARI: GorusDurumu[] = [
  'hazirlaniyor',
  'gonderildi',
  'olumlu',
  'olumsuz',
  'iptal',
];

/** "2026-09-03" biçiminde değilse boş döner; serbest metin tarihe girmesin. */
const tarihTemiz = (deger: unknown): string => {
  const metin = String(deger ?? '').trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(metin) ? metin : '';
};

const kisaMetin = (deger: unknown, sinir = 200): string =>
  String(deger ?? '').slice(0, sinir).trim();

app.post('/api/evraklar/:id/gorusler', korumali, (istek: Istek, yanit) => {
  const id = String(istek.params.id);
  const evrak = db.prepare('SELECT durum FROM evraklar WHERE id = ?').get(id) as
    | { durum: string }
    | undefined;
  if (!evrak) {
    yanit.status(404).json({ hata: 'Evrak bulunamadı.' });
    return;
  }
  const gelen = istek.body as Partial<Gorus>;
  const kurum = kisaMetin(gelen.kurum);
  if (!kurum) {
    yanit.status(400).json({ hata: 'Görüş sorulacak kurum adı zorunlu.' });
    return;
  }

  const simdi = new Date().toISOString();
  const durum = GORUS_DURUMLARI.includes(gelen.durum as GorusDurumu)
    ? (gelen.durum as GorusDurumu)
    : 'hazirlaniyor';
  const gorusId = yeniId();
  db.prepare(
    `INSERT INTO gorusler (id, evrak_id, kurum, konu, durum, gonderim_tarihi, cevap_tarihi,
       sayi, cevap_sayisi, aciklama, olusturan, tarih)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    gorusId,
    id,
    kurum,
    kisaMetin(gelen.konu),
    durum,
    tarihTemiz(gelen.gonderimTarihi),
    tarihTemiz(gelen.cevapTarihi),
    kisaMetin(gelen.sayi, 60),
    kisaMetin(gelen.cevapSayisi, 60),
    kisaMetin(gelen.not, 1000),
    istek.kullanici!.ad,
    simdi,
  );
  db.prepare(
    'INSERT INTO islemler (id, evrak_id, tarih, durum, aciklama, kullanici) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(yeniId(), id, simdi, evrak.durum, `Kurum görüşü kaydı açıldı: ${kurum}`, istek.kullanici!.ad);
  yanit.status(201).json(tekEvrak(id));
});

app.put('/api/gorusler/:id', korumali, (istek: Istek, yanit) => {
  const gorusId = String(istek.params.id);
  const eski = db.prepare('SELECT * FROM gorusler WHERE id = ?').get(gorusId) as
    | GorusSatir
    | undefined;
  if (!eski) {
    yanit.status(404).json({ hata: 'Görüş kaydı bulunamadı.' });
    return;
  }
  const gelen = istek.body as Partial<Gorus>;
  const durum = GORUS_DURUMLARI.includes(gelen.durum as GorusDurumu)
    ? (gelen.durum as GorusDurumu)
    : (eski.durum as GorusDurumu);
  const kurum = kisaMetin(gelen.kurum) || eski.kurum;
  const cevapTarihi = tarihTemiz(gelen.cevapTarihi);
  // Cevap geldi işaretlenip tarih girilmediyse bugünü yazarız.
  const cevapVar = durum === 'olumlu' || durum === 'olumsuz';

  db.prepare(
    `UPDATE gorusler SET kurum = ?, konu = ?, durum = ?, gonderim_tarihi = ?, cevap_tarihi = ?,
       sayi = ?, cevap_sayisi = ?, aciklama = ? WHERE id = ?`,
  ).run(
    kurum,
    kisaMetin(gelen.konu),
    durum,
    tarihTemiz(gelen.gonderimTarihi),
    cevapTarihi || (cevapVar ? new Date().toISOString().slice(0, 10) : ''),
    kisaMetin(gelen.sayi, 60),
    kisaMetin(gelen.cevapSayisi, 60),
    kisaMetin(gelen.not, 1000),
    gorusId,
  );

  // Durum değişimi dosyanın geçmişine düşer: kim ne zaman cevabı işledi.
  if (durum !== eski.durum) {
    const evrak = db.prepare('SELECT durum FROM evraklar WHERE id = ?').get(eski.evrak_id) as {
      durum: string;
    };
    const anlam: Record<GorusDurumu, string> = {
      hazirlaniyor: 'yazı hazırlanıyor',
      gonderildi: 'yazı gönderildi, cevap bekleniyor',
      olumlu: 'olumlu görüş geldi',
      olumsuz: 'olumsuz görüş geldi',
      iptal: 'görüşe gerek kalmadı',
    };
    db.prepare(
      'INSERT INTO islemler (id, evrak_id, tarih, durum, aciklama, kullanici) VALUES (?, ?, ?, ?, ?, ?)',
    ).run(
      yeniId(),
      eski.evrak_id,
      new Date().toISOString(),
      evrak.durum,
      `${kurum}: ${anlam[durum]}`,
      istek.kullanici!.ad,
    );
  }
  yanit.json(tekEvrak(eski.evrak_id));
});

app.delete('/api/gorusler/:id', korumali, (istek: Istek, yanit) => {
  const eski = db.prepare('SELECT * FROM gorusler WHERE id = ?').get(String(istek.params.id)) as
    | GorusSatir
    | undefined;
  if (!eski) {
    yanit.status(404).json({ hata: 'Görüş kaydı bulunamadı.' });
    return;
  }
  db.prepare('DELETE FROM gorusler WHERE id = ?').run(eski.id);
  yanit.json(tekEvrak(eski.evrak_id));
});

/* ------------------------------------------------------------------ */
/* Harç tarifesi ve tahakkuk                                           */
/* ------------------------------------------------------------------ */

const TARIFE_ANAHTARI = 'harc-tarifesi';

function tarifeOku() {
  const satir = db.prepare('SELECT deger FROM ayarlar WHERE anahtar = ?').get(TARIFE_ANAHTARI) as
    | { deger: string }
    | undefined;
  if (!satir) return VARSAYILAN_TARIFE;
  try {
    return tarifeDuzelt(JSON.parse(satir.deger));
  } catch {
    return VARSAYILAN_TARIFE;
  }
}

app.get('/api/tarife', korumali, (_istek, yanit) => {
  yanit.json(tarifeOku());
});

app.put('/api/tarife', korumali, sadeceMudur, (istek: Istek, yanit) => {
  // Tarife düzeltilerek yazılır: bilinmeyen taban/eksik alan kabul edilmez.
  const tarife = tarifeDuzelt(istek.body);
  const simdi = new Date().toISOString();
  const kaydedilecek = {
    ...tarife,
    guncelleme: simdi,
    onaylayan: tarife.onaylandi ? istek.kullanici!.ad : '',
  };
  db.prepare(
    `INSERT INTO ayarlar (anahtar, deger, guncelleyen, tarih) VALUES (?, ?, ?, ?)
     ON CONFLICT (anahtar) DO UPDATE SET deger = excluded.deger,
       guncelleyen = excluded.guncelleyen, tarih = excluded.tarih`,
  ).run(TARIFE_ANAHTARI, JSON.stringify(kaydedilecek), istek.kullanici!.ad, simdi);
  yanit.json(kaydedilecek);
});

/**
 * Tahakkuku SUNUCU hesaplar: tutarlar istemciden alınmaz, kayıtlı yapı
 * bilgileri ile müdürün onayladığı tarifeden yeniden üretilir.
 */
app.post('/api/evraklar/:id/tahakkuk', korumali, (istek: Istek, yanit) => {
  const id = String(istek.params.id);
  const satir = db.prepare('SELECT tur, durum, yapi FROM evraklar WHERE id = ?').get(id) as
    | { tur: string; durum: string; yapi: string }
    | undefined;
  if (!satir) {
    yanit.status(404).json({ hata: 'Evrak bulunamadı.' });
    return;
  }

  const tarife = tarifeOku();
  const sonuc = harcHesapla(satir.tur as Tur, yapiCoz(satir.yapi), tarife);
  const simdi = new Date().toISOString();
  db.prepare(
    `INSERT INTO tahakkuklar (evrak_id, satirlar, toplam, uyarilar, tarife_onayli, tarife_yili,
       hesaplayan, tarih)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (evrak_id) DO UPDATE SET satirlar = excluded.satirlar, toplam = excluded.toplam,
       uyarilar = excluded.uyarilar, tarife_onayli = excluded.tarife_onayli,
       tarife_yili = excluded.tarife_yili, hesaplayan = excluded.hesaplayan, tarih = excluded.tarih`,
  ).run(
    id,
    JSON.stringify(sonuc.satirlar),
    sonuc.toplam,
    JSON.stringify(sonuc.uyarilar),
    sonuc.tarifeOnayli ? 1 : 0,
    sonuc.tarifeYili,
    istek.kullanici!.ad,
    simdi,
  );
  db.prepare(
    'INSERT INTO islemler (id, evrak_id, tarih, durum, aciklama, kullanici) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(
    yeniId(),
    id,
    simdi,
    satir.durum,
    `Harç tahakkuku hesaplandı: ${sonuc.toplam.toFixed(2)} TL`,
    istek.kullanici!.ad,
  );
  yanit.json(tekEvrak(id));
});

/** Tahsilat kaydı: makbuz numarası ve ödeme tarihi. */
app.put('/api/evraklar/:id/tahakkuk/odeme', korumali, (istek: Istek, yanit) => {
  const id = String(istek.params.id);
  const mevcut = db.prepare('SELECT * FROM tahakkuklar WHERE evrak_id = ?').get(id) as
    | TahakkukSatir
    | undefined;
  if (!mevcut) {
    yanit.status(404).json({ hata: 'Önce harç hesaplanmalı.' });
    return;
  }
  const { makbuzNo, odemeTarihi } = istek.body as { makbuzNo?: string; odemeTarihi?: string };
  const no = kisaMetin(makbuzNo, 60);
  const tarih = tarihTemiz(odemeTarihi) || (no ? new Date().toISOString().slice(0, 10) : '');
  db.prepare('UPDATE tahakkuklar SET makbuz_no = ?, odeme_tarihi = ? WHERE evrak_id = ?').run(
    no,
    tarih,
    id,
  );

  const evrak = db.prepare('SELECT durum FROM evraklar WHERE id = ?').get(id) as { durum: string };
  db.prepare(
    'INSERT INTO islemler (id, evrak_id, tarih, durum, aciklama, kullanici) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(
    yeniId(),
    id,
    new Date().toISOString(),
    evrak.durum,
    no ? `Harç tahsil edildi — makbuz no ${no}` : 'Harç tahsilat kaydı kaldırıldı',
    istek.kullanici!.ad,
  );
  yanit.json(tekEvrak(id));
});

/* ------------------------------------------------------------------ */
/* Evrak ekleri                                                        */
/* ------------------------------------------------------------------ */

/**
 * İmar dosyalarında karşılaşılan biçimler; başkası kabul edilmez.
 * İçerik türü uzantıdan belirlenir — istemcinin bildirdiği tür kullanılmaz,
 * yoksa ".txt" adıyla "text/html" gönderilip tarayıcıda çalıştırılabilirdi.
 */
const IZINLI_TURLER: Record<string, { tur: string; onizle: boolean }> = {
  '.pdf': { tur: 'application/pdf', onizle: true },
  '.jpg': { tur: 'image/jpeg', onizle: true },
  '.jpeg': { tur: 'image/jpeg', onizle: true },
  '.png': { tur: 'image/png', onizle: true },
  '.webp': { tur: 'image/webp', onizle: true },
  '.gif': { tur: 'image/gif', onizle: true },
  '.tif': { tur: 'image/tiff', onizle: false },
  '.tiff': { tur: 'image/tiff', onizle: false },
  '.heic': { tur: 'image/heic', onizle: false },
  '.txt': { tur: 'text/plain; charset=utf-8', onizle: true },
  '.doc': { tur: 'application/msword', onizle: false },
  '.docx': {
    tur: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    onizle: false,
  },
  '.xls': { tur: 'application/vnd.ms-excel', onizle: false },
  '.xlsx': {
    tur: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    onizle: false,
  },
  '.dwg': { tur: 'application/acad', onizle: false },
  '.dxf': { tur: 'image/vnd.dxf', onizle: false },
  '.zip': { tur: 'application/zip', onizle: false },
  '.rar': { tur: 'application/vnd.rar', onizle: false },
};

const IZINLI_UZANTILAR = new Set(Object.keys(IZINLI_TURLER));

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
      `INSERT INTO ekler (id, evrak_id, ad, dosya, belge_kodu, hash, tur, boyut, yukleyen, yukleyen_id, tarih)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
    const yeniEkler: string[] = [];
    db.transaction(() => {
      for (const d of dosyalar) {
        const ad = adiDuzelt(d.originalname);
        adlar.push(ad);
        const ekId = yeniId();
        yeniEkler.push(ekId);
        // Aynı dosyanın tekrar yüklenmesini yakalamak için içerik özeti.
        const hash = createHash('sha256').update(readFileSync(d.path)).digest('hex');
        ekle.run(
          ekId,
          id,
          ad,
          d.filename,
          belgeKodu,
          hash,
          d.mimetype,
          d.size,
          istek.kullanici!.ad,
          istek.kullanici!.id,
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

    // İnceleme arka planda yürür; yükleme isteği beklemez.
    for (const ekId of yeniEkler) incelemeyeAl(ekId);

    yanit.status(201).json(tekEvrak(id));
  },
);

/** İncelemeyi yeniden çalıştırır (model sonradan açıldıysa veya hata olduysa). */
app.post('/api/ekler/:id/incele', korumali, (istek, yanit) => {
  const ekId = String(istek.params.id);
  const ek = db.prepare('SELECT evrak_id FROM ekler WHERE id = ?').get(ekId) as
    | { evrak_id: string }
    | undefined;
  if (!ek) {
    yanit.status(404).json({ hata: 'Ek bulunamadı.' });
    return;
  }
  incelemeyeAl(ekId);
  yanit.json(tekEvrak(ek.evrak_id));
});

/** Memurun belge kararı: incelemeyi okuyup uygun/uygunsuz der. */
app.put('/api/evraklar/:id/belgeler/karar', korumali, (istek: Istek, yanit) => {
  const id = String(istek.params.id);
  const { kod, karar, not } = istek.body as {
    kod?: string;
    karar?: 'uygun' | 'uygunsuz' | '';
    not?: string;
  };
  const evrak = db.prepare('SELECT durum, tur FROM evraklar WHERE id = ?').get(id) as
    | { durum: string; tur: string }
    | undefined;
  if (!kod || !evrak) {
    yanit.status(kod ? 404 : 400).json({ hata: kod ? 'Evrak bulunamadı.' : 'Belge kodu zorunlu.' });
    return;
  }

  const simdi = new Date().toISOString();
  const ad = istek.kullanici!.ad;
  db.prepare(
    `INSERT INTO belgeler (evrak_id, kod, teslim, karar, karar_notu, karar_veren, karar_tarihi, kullanici, tarih)
     VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (evrak_id, kod) DO UPDATE SET
       karar = excluded.karar, karar_notu = excluded.karar_notu,
       karar_veren = excluded.karar_veren, karar_tarihi = excluded.karar_tarihi`,
  ).run(id, kod, karar ?? '', not ?? '', karar ? ad : '', karar ? simdi : '', ad, simdi);

  if (karar) {
    db.prepare(
      'INSERT INTO islemler (id, evrak_id, tarih, durum, aciklama, kullanici) VALUES (?, ?, ?, ?, ?, ?)',
    ).run(
      yeniId(),
      id,
      simdi,
      evrak.durum,
      `${belgeAdi(evrak.tur as Tur, kod)} ${karar === 'uygun' ? 'uygun bulundu' : 'uygun bulunmadı'}${
        not ? `: ${not}` : ''
      }`,
      ad,
    );
  }
  yanit.json(tekEvrak(id));
});

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
  // İçerik türü diskteki uzantıdan belirlenir; yüklerken istemcinin bildirdiği
  // tür kullanılmaz. Yalnızca güvenle önizlenebilen biçimler tarayıcıda açılır,
  // kalanlar indirilir. nosniff, tarayıcının türü tahmin etmesini engeller.
  const bicim = IZINLI_TURLER[extname(ek.dosya).toLowerCase()] ?? {
    tur: 'application/octet-stream',
    onizle: false,
  };
  yanit.setHeader('Content-Type', bicim.tur);
  yanit.setHeader('X-Content-Type-Options', 'nosniff');
  yanit.setHeader(
    'Content-Disposition',
    `${bicim.onizle ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(ek.ad)}`,
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
  // Eki yükleyen kişi veya müdür silebilir. Karşılaştırma kullanıcı kimliğiyle
  // yapılır; ad benzersiz değildir, aynı adla açılan hesap yetki almamalı.
  // yukleyen_id'si olmayan eski kayıtlarda ada düşülür.
  const yukleyenKendisi = ek.yukleyen_id
    ? ek.yukleyen_id === istek.kullanici!.id
    : ek.yukleyen === istek.kullanici!.ad;
  if (istek.kullanici!.rol !== 'mudur' && !yukleyenKendisi) {
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
/* Kurum sorguları (TAKBİS / YAMBİS)                                   */
/* ------------------------------------------------------------------ */

app.post('/api/evraklar/:id/kurum-sorgu', korumali, async (istek: Istek, yanit) => {
  const { tur, belgeNo } = istek.body as { tur?: SorguTuru; belgeNo?: string };
  if (tur !== 'takbis' && tur !== 'yambis') {
    yanit.status(400).json({ hata: 'Sorgu türü takbis veya yambis olmalı.' });
    return;
  }
  try {
    const sonuc = await kurumSorgusu(
      String(istek.params.id),
      tur,
      (belgeNo ?? '').trim(),
      istek.kullanici!.ad,
    );
    yanit.json({ sonuc, evrak: tekEvrak(String(istek.params.id)) });
  } catch (hata) {
    yanit.status(400).json({ hata: hata instanceof Error ? hata.message : 'Sorgu yapılamadı.' });
  }
});

app.get('/api/evraklar/:id/kurum-sorgu', korumali, (istek, yanit) => {
  yanit.json(evrakSorgulari(String(istek.params.id)));
});

app.get('/api/kurum-sorgulari', korumali, sadeceMudur, (_istek, yanit) => {
  yanit.json(sonSorgular(40));
});

/* ------------------------------------------------------------------ */
/* Bildirimler                                                         */
/* ------------------------------------------------------------------ */

app.get('/api/bildirimler', korumali, sadeceMudur, (_istek, yanit) => {
  yanit.json(sonBildirimler(40));
});

app.post('/api/bildirimler/tara', korumali, sadeceMudur, async (_istek, yanit) => {
  const uretilen = kurallariTara();
  const sonuc = await kuyrugaBak();
  yanit.json({ uretilen, ...sonuc });
});

app.post('/api/bildirimler/:id/tekrar', korumali, sadeceMudur, async (istek, yanit) => {
  if (!tekrarDene(String(istek.params.id))) {
    yanit.status(404).json({ hata: 'Bildirim bulunamadı veya zaten gönderilmiş.' });
    return;
  }
  await kuyrugaBak();
  yanit.json(sonBildirimler(40));
});

/* ------------------------------------------------------------------ */
/* Vatandaş takip ucu (oturumsuz, salt okunur)                         */
/* ------------------------------------------------------------------ */

/** IP başına deneme sayacı: kod tarama girişimlerini yavaşlatır. */
const denemeler = new Map<string, { sayi: number; sifirlama: number }>();
const DENEME_SINIRI = 20;
const DENEME_PENCERESI_MS = 10 * 60 * 1000;

function denemeHakkiVar(ip: string): boolean {
  const simdi = Date.now();
  const kayit = denemeler.get(ip);
  if (!kayit || kayit.sifirlama < simdi) {
    denemeler.set(ip, { sayi: 1, sifirlama: simdi + DENEME_PENCERESI_MS });
    return true;
  }
  kayit.sayi += 1;
  return kayit.sayi <= DENEME_SINIRI;
}

/**
 * Vatandaşın takip kodu ile başvurusunu sorguladığı tek uç. Personel
 * bilgisi, iç notlar, inceleme bulguları ve dosyalar burada YOKTUR.
 */
app.post('/api/takip', (istek, yanit) => {
  const ip = istek.ip ?? 'bilinmiyor';
  if (!denemeHakkiVar(ip)) {
    yanit.status(429).json({ hata: 'Çok fazla deneme yapıldı. Lütfen sonra tekrar deneyin.' });
    return;
  }

  const { kod, sonDort } = istek.body as { kod?: string; sonDort?: string };
  // Hangi kodun var olduğu sızmasın diye tüm başarısızlıklar aynı yanıtı verir.
  const bulunamadi = () =>
    yanit.status(404).json({ hata: 'Bu bilgilerle bir başvuru bulunamadı.' });

  const temiz = (kod ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (temiz.length !== 12) {
    bulunamadi();
    return;
  }
  const bicimli = `${temiz.slice(0, 4)}-${temiz.slice(4, 8)}-${temiz.slice(8, 12)}`;

  const satir = db.prepare('SELECT * FROM evraklar WHERE takip_kodu = ?').get(bicimli) as
    | (EvrakSatir & { guncelleme: string })
    | undefined;
  if (!satir) {
    bulunamadi();
    return;
  }

  // İkinci doğrulama: kayıtta telefon varsa son dört hane sorulur.
  const telefonHaneleri = satir.basvuran_telefon.replace(/\D/g, '');
  if (telefonHaneleri.length >= 4) {
    if ((sonDort ?? '').replace(/\D/g, '') !== telefonHaneleri.slice(-4)) {
      bulunamadi();
      return;
    }
  }

  const belgeler = db
    .prepare('SELECT * FROM belgeler WHERE evrak_id = ?')
    .all(satir.id) as BelgeSatir[];
  const tanimlar = belgeListesi(satir.tur as Tur).filter((b) => b.zorunlu);

  const eksikBelgeler: string[] = [];
  const uygunsuzBelgeler: { ad: string; neden?: string }[] = [];
  for (const tanim of tanimlar) {
    const kayit = belgeler.find((b) => b.kod === tanim.kod);
    if (!kayit?.teslim) eksikBelgeler.push(tanim.ad);
    else if (kayit.karar === 'uygunsuz') {
      uygunsuzBelgeler.push({ ad: tanim.ad, neden: kayit.karar_notu || undefined });
    }
  }

  const gecenGun = Math.round(
    (Date.now() - new Date(`${satir.gelis_tarihi}T00:00:00`).getTime()) / 86_400_000,
  );

  // Bekleyen kurum görüşleri gecikmenin nedenini açıklar. Yalnızca kurum adı
  // verilir; yazışma sayısı, iç not ve personel adı bu uçtan çıkmaz.
  const beklenenGorusler = (
    db.prepare('SELECT kurum, durum FROM gorusler WHERE evrak_id = ?').all(satir.id) as {
      kurum: string;
      durum: GorusDurumu;
    }[]
  )
    .filter((g) => BEKLEYEN_DURUMLAR.includes(g.durum))
    .map((g) => g.kurum);

  const sonuc: TakipSonucu = {
    no: satir.no,
    konu: satir.konu,
    tur: satir.tur as Tur,
    gelisTarihi: satir.gelis_tarihi,
    durum: satir.durum as Durum,
    sonGuncelleme: satir.guncelleme,
    hedefGun: satir.hedef_gun,
    kalanGun: satir.hedef_gun - gecenGun,
    eksikBelgeler,
    uygunsuzBelgeler,
    beklenenGorusler,
  };
  yanit.json(sonuc);
});

/* ------------------------------------------------------------------ */
/* Derlenmiş arayüz                                                    */
/* ------------------------------------------------------------------ */

const arayuz = resolve('dist');
if (existsSync(arayuz)) {
  app.use(express.static(arayuz));
  // Vatandaş sayfası ayrı bir pakettir: personel arayüzünün kodunu içermez.
  app.get(/^\/takip/, (_istek, yanit) => yanit.sendFile(resolve(arayuz, 'takip.html')));
  app.get(/^\/(?!api\/).*/, (_istek, yanit) => yanit.sendFile(resolve(arayuz, 'index.html')));
}

/** Bildirim mesajlarına konan takip sayfası adresi. */
const TAKIP_ADRESI = process.env.IMAR_TAKIP_ADRESI ?? `http://localhost:${process.env.PORT ?? 3200}/takip`;

/** Süre hatırlatmaları saatte bir taranır; kuyruk aynı turda boşaltılır. */
const BILDIRIM_ARALIGI_MS = Number(process.env.IMAR_BILDIRIM_ARALIGI ?? 60 * 60 * 1000);
if (BILDIRIM_ARALIGI_MS > 0) {
  const tur = async () => {
    try {
      kurallariTara();
      await kuyrugaBak();
    } catch (hata) {
      console.error('Bildirim turu başarısız:', hata);
    }
  };
  setTimeout(() => void tur(), 10_000).unref();
  setInterval(() => void tur(), BILDIRIM_ARALIGI_MS).unref();
}

const port = Number(process.env.PORT ?? 3200);
app.listen(port, () => {
  console.log(`İmar Evrak sunucusu: http://localhost:${port}`);
  if (!existsSync(arayuz)) {
    console.log('(arayüz derlenmemiş — geliştirme için ayrı terminalde: npm run dev)');
  }
});
