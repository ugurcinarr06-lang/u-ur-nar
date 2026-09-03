/**
 * Kurum sorgularının uygulama içindeki ortak biçimi.
 *
 * TAKBİS ve YAMBİS kapalı sistemlerdir; gerçek istek/yanıt şekilleri
 * kurumla yapılan protokolle birlikte gelir. Bu yüzden burada yalnızca
 * BİZİM ihtiyaç duyduğumuz alanlar tanımlıdır; dış yanıtın hangi alanının
 * hangisine karşılık geldiği yapılandırmadan (ortam değişkeni) okunur.
 */

export interface TapuSonucu {
  bulundu: boolean;
  malikler: string[];
  ada?: string;
  parsel?: string;
  mahalle?: string;
  nitelik?: string;
  yuzolcumu?: string;
  /** Şerh, haciz, ipotek gibi kısıtlamalar. */
  takyidat?: string;
}

export interface MuteahhitSonucu {
  bulundu: boolean;
  unvan?: string;
  yetkiBelgeNo?: string;
  /** Belgenin geçerlilik bitiş tarihi (ISO). */
  gecerlilik?: string;
  /** Kurumun bildirdiği durum metni (ör. "Faal", "Askıda"). */
  durum?: string;
  sinif?: string;
}

export type SorguTuru = 'takbis' | 'yambis';

export interface SorguKaydi {
  id: string;
  evrak_id: string;
  tur: SorguTuru;
  /** Sorguda kullanılan anahtar (ada/parsel veya yetki belge no). */
  girdi: string;
  durum: 'basarili' | 'bulunamadi' | 'hata';
  /** Kullanıcıya gösterilen özet. */
  ozet: string;
  hata: string;
  /** Ham yanıt; denetim için saklanır. */
  ham: string;
  kullanici: string;
  tarih: string;
}
