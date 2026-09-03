import { evraklariOku, evraklariYaz } from '../storage';
import type { Bulgu, Durum, Evrak, Taslak } from '../types';
import { yeniId } from '../utils';

export type Rol = 'mudur' | 'memur';

export interface Oturum {
  id: string;
  kullaniciAdi: string;
  ad: string;
  rol: Rol;
  /** Sunucuda açık olan yapay zekâ sağlayıcısı ("kapali" ise yalnızca kurallar). */
  yapayZeka?: string;
  /** Bildirim kanallarının durumu: { eposta: "acik", sms: "kapali" } */
  bildirim?: { eposta: string; sms: string };
  /** Kurum bağlantılarının durumu: { takbis: "kapali", yambis: "deneme" } */
  kurum?: { takbis: string; yambis: string };
  eposta?: string;
}

/** TAKBİS/YAMBİS sorgu kaydı. */
export interface KurumSorgusu {
  id: string;
  evrak_id: string;
  tur: 'takbis' | 'yambis';
  girdi: string;
  durum: 'basarili' | 'bulunamadi' | 'hata';
  ozet: string;
  hata: string;
  kullanici: string;
  tarih: string;
}

export interface KurumYaniti {
  tur: 'takbis' | 'yambis';
  durum: 'basarili' | 'bulunamadi' | 'hata';
  ozet: string;
  bulgular: Bulgu[];
  tarih: string;
}

/** Gönderilmiş/bekleyen bildirim kaydı (müdür ekranı). */
export interface Bildirim {
  id: string;
  tur: string;
  kanal: 'eposta' | 'sms';
  hedef: string;
  konu: string;
  govde: string;
  durum: 'bekliyor' | 'gonderildi' | 'hata' | 'kanal-kapali';
  hata: string;
  olusturma: string;
  gonderim: string;
}

/**
 * Evrakların nerede tutulduğunu soyutlar:
 * - "sunucu": ortak SQLite veritabanı, giriş zorunlu, herkes aynı listeyi görür.
 * - "yerel": tarayıcı belleği (tek dosyalık sürüm / Artifact), giriş yok.
 */
export interface Depo {
  kip: 'sunucu' | 'yerel';
  liste(): Promise<Evrak[]>;
  ekle(taslak: Taslak): Promise<Evrak>;
  guncelle(id: string, taslak: Taslak): Promise<Evrak>;
  islemEkle(id: string, durum: Durum, not: string): Promise<Evrak>;
  sil(id: string): Promise<void>;
  /** Dosya ekleri yalnızca sunucu kipinde saklanabilir. */
  ekYukle?(evrakId: string, dosyalar: File[], belgeKodu?: string): Promise<Evrak>;
  ekSil?(ekId: string): Promise<Evrak>;
  /** Kontrol listesinde bir belgeyi teslim alındı/alınmadı olarak işaretler. */
  belgeIsaretle(evrakId: string, kod: string, teslim: boolean): Promise<Evrak>;
  /** Memurun içerik kararı; yalnızca sunucu kipinde vardır. */
  /** TAKBİS/YAMBİS sorgusu; yalnızca sunucu kipinde vardır. */
  kurumSorgula?(
    evrakId: string,
    tur: 'takbis' | 'yambis',
    belgeNo: string,
  ): Promise<{ sonuc: KurumYaniti; evrak: Evrak }>;
  kurumGecmisi?(evrakId: string): Promise<KurumSorgusu[]>;
  belgeKarar?(
    evrakId: string,
    kod: string,
    karar: 'uygun' | 'uygunsuz' | '',
    not: string,
  ): Promise<Evrak>;
  /** Bir ekin otomatik incelemesini yeniden çalıştırır. */
  incelemeYenile?(ekId: string): Promise<Evrak>;
  /** Doğrulama kodunu kaydeder ve kaynağından teyidi işaretler. */
  belgeDogrulama?(
    evrakId: string,
    kod: string,
    dogrulamaKodu: string,
    dogrulandi: boolean,
  ): Promise<Evrak>;
  /** Ekin tarayıcıda açılacağı adres. */
  ekAdresi?(ekId: string): string;
  /** Yedekten toplu geri yükleme — yalnızca yerel kipte desteklenir. */
  topluYaz?(evraklar: Evrak[]): Promise<void>;
}

/** Sunucudan dönen hata mesajını taşır. */
export class ApiHatasi extends Error {
  constructor(
    message: string,
    readonly durum: number,
  ) {
    super(message);
  }
}

async function api<T>(yol: string, secenek: RequestInit = {}): Promise<T> {
  const yanit = await fetch(yol, {
    ...secenek,
    headers: { 'Content-Type': 'application/json', ...secenek.headers },
  });
  if (!yanit.ok) {
    const govde = (await yanit.json().catch(() => ({}))) as { hata?: string };
    throw new ApiHatasi(govde.hata ?? 'İşlem tamamlanamadı.', yanit.status);
  }
  return (await yanit.json()) as T;
}

/* ------------------------------------------------------------------ */
/* Sunucu kipi                                                         */
/* ------------------------------------------------------------------ */

/** Çok parçalı gönderimde Content-Type'ı tarayıcı belirlemeli. */
async function apiDosya<T>(yol: string, govde: FormData): Promise<T> {
  const yanit = await fetch(yol, { method: 'POST', body: govde });
  if (!yanit.ok) {
    const hata = (await yanit.json().catch(() => ({}))) as { hata?: string };
    throw new ApiHatasi(hata.hata ?? 'Dosya yüklenemedi.', yanit.status);
  }
  return (await yanit.json()) as T;
}

export const sunucuDepo: Depo = {
  kip: 'sunucu',
  liste: () => api<Evrak[]>('/api/evraklar'),
  ekle: (taslak) =>
    api<Evrak>('/api/evraklar', { method: 'POST', body: JSON.stringify(taslak) }),
  guncelle: (id, taslak) =>
    api<Evrak>(`/api/evraklar/${id}`, { method: 'PUT', body: JSON.stringify(taslak) }),
  islemEkle: (id, durum, not) =>
    api<Evrak>(`/api/evraklar/${id}/islemler`, {
      method: 'POST',
      body: JSON.stringify({ durum, not }),
    }),
  sil: async (id) => {
    await api(`/api/evraklar/${id}`, { method: 'DELETE' });
  },
  ekYukle: (evrakId, dosyalar, belgeKodu) => {
    const govde = new FormData();
    // Metin alanı dosyalardan önce eklenir; sunucu tarafında hazır olsun.
    if (belgeKodu) govde.append('belgeKodu', belgeKodu);
    for (const d of dosyalar) govde.append('dosyalar', d);
    return apiDosya<Evrak>(`/api/evraklar/${evrakId}/ekler`, govde);
  },
  ekSil: (ekId) => api<Evrak>(`/api/ekler/${ekId}`, { method: 'DELETE' }),
  belgeIsaretle: (evrakId, kod, teslim) =>
    api<Evrak>(`/api/evraklar/${evrakId}/belgeler`, {
      method: 'PUT',
      body: JSON.stringify({ kod, teslim }),
    }),
  ekAdresi: (ekId) => `/api/ekler/${ekId}`,
  kurumSorgula: (evrakId, tur, belgeNo) =>
    api<{ sonuc: KurumYaniti; evrak: Evrak }>(`/api/evraklar/${evrakId}/kurum-sorgu`, {
      method: 'POST',
      body: JSON.stringify({ tur, belgeNo }),
    }),
  kurumGecmisi: (evrakId) => api<KurumSorgusu[]>(`/api/evraklar/${evrakId}/kurum-sorgu`),
  belgeKarar: (evrakId, kod, karar, not) =>
    api<Evrak>(`/api/evraklar/${evrakId}/belgeler/karar`, {
      method: 'PUT',
      body: JSON.stringify({ kod, karar, not }),
    }),
  incelemeYenile: (ekId) => api<Evrak>(`/api/ekler/${ekId}/incele`, { method: 'POST' }),
  belgeDogrulama: (evrakId, kod, dogrulamaKodu, dogrulandi) =>
    api<Evrak>(`/api/evraklar/${evrakId}/belgeler/dogrulama`, {
      method: 'PUT',
      body: JSON.stringify({ kod, dogrulamaKodu, dogrulandi }),
    }),
};

export const girisYap = (kullaniciAdi: string, sifre: string): Promise<Oturum> =>
  api<Oturum>('/api/giris', { method: 'POST', body: JSON.stringify({ kullaniciAdi, sifre }) });

export const cikisYap = (): Promise<unknown> => api('/api/cikis', { method: 'POST' });

export const sifreDegistir = (eski: string, yeni: string): Promise<unknown> =>
  api('/api/sifre', { method: 'POST', body: JSON.stringify({ eski, yeni }) });

export const kullanicilariGetir = (): Promise<Oturum[]> => api<Oturum[]>('/api/kullanicilar');

export const kullaniciEkle = (yeni: {
  kullaniciAdi: string;
  ad: string;
  rol: Rol;
  sifre: string;
  eposta: string;
}): Promise<Oturum> =>
  api<Oturum>('/api/kullanicilar', { method: 'POST', body: JSON.stringify(yeni) });

export const kullaniciSil = (id: string): Promise<unknown> =>
  api(`/api/kullanicilar/${id}`, { method: 'DELETE' });

export const bildirimleriGetir = (): Promise<Bildirim[]> => api<Bildirim[]>('/api/bildirimler');

export const bildirimTara = (): Promise<{ uretilen: number; gonderildi: number; hata: number }> =>
  api('/api/bildirimler/tara', { method: 'POST' });

export const bildirimTekrar = (id: string): Promise<Bildirim[]> =>
  api<Bildirim[]>(`/api/bildirimler/${id}/tekrar`, { method: 'POST' });

/* ------------------------------------------------------------------ */
/* Yerel kip                                                           */
/* ------------------------------------------------------------------ */

const YEREL_KULLANICI = 'İmar Personeli';

function yerelDepoOlustur(): Depo {
  let kayitlar = evraklariOku();
  const yaz = () => evraklariYaz(kayitlar);
  const bul = (id: string): Evrak => {
    const e = kayitlar.find((x) => x.id === id);
    if (!e) throw new Error('Evrak bulunamadı.');
    return e;
  };
  const islem = (durum: Durum, not: string) => ({
    id: yeniId(),
    tarih: new Date().toISOString(),
    durum,
    not,
    kullanici: YEREL_KULLANICI,
  });

  return {
    kip: 'yerel',
    liste: async () => kayitlar,
    ekle: async (taslak) => {
      const yeni: Evrak = {
        ...taslak,
        id: yeniId(),
        gecmis: [islem(taslak.durum, 'Evrak kaydı açıldı.')],
        ekler: [],
        belgeler: [],
      };
      kayitlar = [yeni, ...kayitlar];
      yaz();
      return yeni;
    },
    guncelle: async (id, taslak) => {
      const eski = bul(id);
      const yeni: Evrak = {
        ...eski,
        ...taslak,
        gecmis: [...eski.gecmis, islem(taslak.durum, 'Kayıt bilgileri güncellendi.')],
      };
      kayitlar = kayitlar.map((e) => (e.id === id ? yeni : e));
      yaz();
      return yeni;
    },
    islemEkle: async (id, durum, not) => {
      const eski = bul(id);
      const yeni: Evrak = { ...eski, durum, gecmis: [...eski.gecmis, islem(durum, not)] };
      kayitlar = kayitlar.map((e) => (e.id === id ? yeni : e));
      yaz();
      return yeni;
    },
    sil: async (id) => {
      kayitlar = kayitlar.filter((e) => e.id !== id);
      yaz();
    },
    belgeIsaretle: async (evrakId, kod, teslim) => {
      const eski = bul(evrakId);
      const kalanlar = eski.belgeler.filter((b) => b.kod !== kod);
      const yeni: Evrak = {
        ...eski,
        belgeler: teslim
          ? [
              ...kalanlar,
              { kod, teslim: true, kullanici: YEREL_KULLANICI, tarih: new Date().toISOString() },
            ]
          : kalanlar,
      };
      kayitlar = kayitlar.map((e) => (e.id === evrakId ? yeni : e));
      yaz();
      return yeni;
    },
    topluYaz: async (gelen) => {
      kayitlar = gelen;
      yaz();
    },
  };
}

/* ------------------------------------------------------------------ */
/* Kip seçimi                                                          */
/* ------------------------------------------------------------------ */

export interface Baslangic {
  depo: Depo;
  /** Sunucu kipinde oturum yoksa null olur ve giriş ekranı gösterilir. */
  oturum: Oturum | null;
}

/**
 * Sunucu erişilebiliyorsa ortak veritabanı, değilse (tek dosyalık sürüm,
 * Artifact, dosyadan açma) tarayıcı depolaması kullanılır.
 */
export async function baslangicBelirle(): Promise<Baslangic> {
  try {
    const yanit = await fetch('/api/ben', { headers: { Accept: 'application/json' } });
    if (yanit.ok) {
      return { depo: sunucuDepo, oturum: (await yanit.json()) as Oturum };
    }
    if (yanit.status === 401) return { depo: sunucuDepo, oturum: null };
  } catch {
    // Sunucu yok: yerel kipe düşülür.
  }
  return { depo: yerelDepoOlustur(), oturum: null };
}
