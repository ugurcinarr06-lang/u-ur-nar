import { belgeListesi } from './belgeler';
import type { Evrak } from './types';

export interface Hazirlik {
  /** Zorunlu belgelerin tamamı teslim, uygun bulunmuş ve engel yoksa true. */
  hazir: boolean;
  /** Hiç teslim edilmemiş zorunlu belgeler. */
  eksikler: string[];
  /** Memurun uygun bulmadığı belgeler (gerekçesiyle). */
  uygunsuzlar: string[];
  /** Otomatik incelemenin engel çıkardığı, henüz karara bağlanmamış belgeler. */
  engeller: string[];
  /** Teslim alınmış ama memur kararı verilmemiş belgeler. */
  bekleyenKararlar: string[];
  /** Karara etki etmeyen ama bakılması gereken bulgu sayısı. */
  uyariSayisi: number;
  /** Arka planda süren inceleme var mı. */
  incelemeSuruyor: boolean;
  zorunluSayisi: number;
  tamamSayisi: number;
}

/**
 * Bir evrakın karar için hazır olup olmadığını çıkarır. Amaç, memurun
 * dosyayı açtığında "neyi bekliyorum" sorusunu tek bakışta yanıtlaması.
 */
export function hazirlikDurumu(evrak: Evrak): Hazirlik {
  const tanimlar = belgeListesi(evrak.tur);
  const zorunlular = tanimlar.filter((b) => b.zorunlu);

  const eksikler: string[] = [];
  const uygunsuzlar: string[] = [];
  const engeller: string[] = [];
  const bekleyenKararlar: string[] = [];
  let tamamSayisi = 0;

  for (const tanim of zorunlular) {
    const kayit = evrak.belgeler.find((b) => b.kod === tanim.kod);
    if (!kayit?.teslim) {
      eksikler.push(tanim.ad);
      continue;
    }
    if (kayit.karar === 'uygunsuz') {
      uygunsuzlar.push(kayit.kararNotu ? `${tanim.ad} — ${kayit.kararNotu}` : tanim.ad);
      continue;
    }

    const dosyalar = evrak.ekler.filter((e) => e.belgeKodu === tanim.kod);
    const engelli = dosyalar.some((e) =>
      e.inceleme?.bulgular.some((b) => b.seviye === 'engel'),
    );
    if (engelli && kayit.karar !== 'uygun') {
      engeller.push(tanim.ad);
      continue;
    }
    if (!kayit.karar) {
      bekleyenKararlar.push(tanim.ad);
      continue;
    }
    tamamSayisi++;
  }

  const uyariSayisi = evrak.ekler.reduce(
    (toplam, e) => toplam + (e.inceleme?.bulgular.filter((b) => b.seviye === 'uyari').length ?? 0),
    0,
  );

  return {
    hazir:
      zorunlular.length > 0 &&
      eksikler.length === 0 &&
      uygunsuzlar.length === 0 &&
      engeller.length === 0 &&
      bekleyenKararlar.length === 0,
    eksikler,
    uygunsuzlar,
    engeller,
    bekleyenKararlar,
    uyariSayisi,
    incelemeSuruyor: evrak.ekler.some(
      (e) => e.inceleme?.durum === 'bekliyor' || e.inceleme?.durum === 'inceleniyor',
    ),
    zorunluSayisi: zorunlular.length,
    tamamSayisi,
  };
}

/** Liste ekranındaki kısa rozet metni. */
export function hazirlikOzeti(h: Hazirlik): { ad: string; renk: string } | null {
  if (h.hazir) {
    return { ad: 'Karara hazır', renk: 'bg-emerald-100 text-emerald-800 ring-emerald-300' };
  }
  const engelSayisi = h.uygunsuzlar.length + h.engeller.length;
  if (engelSayisi > 0) {
    return {
      ad: `${engelSayisi} engel`,
      renk: 'bg-rose-100 text-rose-800 ring-rose-300',
    };
  }
  if (h.eksikler.length > 0) {
    return {
      ad: `${h.eksikler.length} eksik belge`,
      renk: 'bg-amber-100 text-amber-800 ring-amber-300',
    };
  }
  if (h.bekleyenKararlar.length > 0) {
    return {
      ad: `${h.bekleyenKararlar.length} karar bekliyor`,
      renk: 'bg-sky-100 text-sky-800 ring-sky-300',
    };
  }
  return null;
}
