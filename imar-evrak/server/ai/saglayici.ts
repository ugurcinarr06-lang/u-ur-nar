import type { Bulgu } from '../../src/types.js';
import type { IncelemeGirdisi } from './kurallar.js';

export interface ModelYaniti {
  bulgular: Bulgu[];
  ozet: string;
  model: string;
}

export interface Saglayici {
  ad: string;
  incele(girdi: IncelemeGirdisi): Promise<ModelYaniti>;
}

/** Modele gönderilen metin uzunluğu (yaklaşık 4 sayfa). */
const AZAMI_METIN = 12_000;

const AYAR = {
  tur: (process.env.IMAR_AI ?? 'kapali').toLowerCase(),
  url: process.env.IMAR_AI_URL ?? 'http://127.0.0.1:11434',
  model: process.env.IMAR_AI_MODEL ?? '',
  zamanAsimiMs: Number(process.env.IMAR_AI_ZAMAN_ASIMI ?? 120_000),
};

const YONERGE = `Sen bir belediye imar müdürlüğünde evrak inceleyen yardımcısın.
Sana bir başvuru kaydı ve o başvuruya yüklenen bir belgenin metni verilir.
Görevin belgeyi KONTROL ETMEK ve memura bulgu bildirmek; ONAY VERMEK DEĞİL.

Kurallar:
- Yalnızca metinde gördüğünü söyle. Emin değilsen "uyari" seviyesinde bildir.
- Belgeyi reddetme veya kabul etme; kararı memur verir.
- Bulunmayan bilgiyi uydurma. Metin yetersizse bunu bulgu olarak yaz.
- Şunlara bak: belge gerçekten beklenen tür mü; ada/parsel/mahalle başvuruyla
  uyuşuyor mu; başvuran adı geçiyor mu; tarih güncel mi; imza, kaşe, onay,
  müellif/oda sicil bilgisi var mı; sayfa veya bölüm eksik görünüyor mu;
  belge içindeki bilgiler kendi içinde çelişiyor mu.

Yanıtını YALNIZCA şu JSON biçiminde ver, başka metin ekleme:
{"ozet":"tek cümle","bulgular":[{"seviye":"bilgi|uyari|engel","baslik":"kısa başlık","ayrinti":"açıklama"}]}
seviye anlamları: bilgi = olumlu/nötr tespit, uyari = memur bakmalı,
engel = bu hâliyle kabul edilmemeli.`;

function istem(g: IncelemeGirdisi): string {
  return `BAŞVURU KAYDI
Evrak no: ${g.evrak.no}
Konu: ${g.evrak.konu}
Başvuru türü: ${g.evrak.tur}
Başvuran: ${g.evrak.basvuran}
Taşınmaz: ${g.evrak.mahalle} mahallesi, pafta ${g.evrak.pafta}, ada ${g.evrak.ada}, parsel ${g.evrak.parsel}
Başvuru tarihi: ${g.evrak.gelisTarihi}
Bugünün tarihi: ${new Date().toISOString().slice(0, 10)}

BEKLENEN BELGE: ${g.belgeAdi || 'belirtilmemiş (genel ek)'}
YÜKLENEN DOSYA: ${g.dosyaAdi}

BELGE METNİ (${g.metin.sayfa} sayfa):
"""
${g.metin.metin.slice(0, AZAMI_METIN)}
"""`;
}

/** Model yanıtındaki JSON'u ayıklar; yanıt açıklama içerse bile çalışır. */
function yanitiCoz(ham: string, model: string): ModelYaniti {
  const basla = ham.indexOf('{');
  const bit = ham.lastIndexOf('}');
  if (basla === -1 || bit === -1) throw new Error('Model JSON döndürmedi.');
  const veri = JSON.parse(ham.slice(basla, bit + 1)) as {
    ozet?: string;
    bulgular?: { seviye?: string; baslik?: string; ayrinti?: string }[];
  };
  const seviyeler = new Set(['bilgi', 'uyari', 'engel']);
  return {
    model,
    ozet: String(veri.ozet ?? '').trim(),
    bulgular: (veri.bulgular ?? [])
      .filter((b) => b.baslik)
      .map((b) => ({
        seviye: (seviyeler.has(String(b.seviye)) ? b.seviye : 'uyari') as Bulgu['seviye'],
        baslik: String(b.baslik).trim(),
        ayrinti: b.ayrinti ? String(b.ayrinti).trim() : undefined,
        kaynak: 'yapay-zeka' as const,
      })),
  };
}

/** Belediyenin kendi sunucusundaki Ollama; veri kurum dışına çıkmaz. */
function ollamaSaglayici(): Saglayici {
  const model = AYAR.model || 'llama3.1';
  return {
    ad: `ollama/${model}`,
    async incele(g) {
      const kontrol = new AbortController();
      const sayac = setTimeout(() => kontrol.abort(), AYAR.zamanAsimiMs);
      try {
        const yanit = await fetch(`${AYAR.url}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            stream: false,
            format: 'json',
            options: { temperature: 0 },
            messages: [
              { role: 'system', content: YONERGE },
              { role: 'user', content: istem(g) },
            ],
          }),
          signal: kontrol.signal,
        });
        if (!yanit.ok) throw new Error(`Ollama ${yanit.status}: ${await yanit.text()}`);
        const govde = (await yanit.json()) as { message?: { content?: string } };
        return yanitiCoz(govde.message?.content ?? '', `ollama/${model}`);
      } finally {
        clearTimeout(sayac);
      }
    },
  };
}

/** Anthropic API — veri kurum dışına çıkar; bilinçli tercih gerektirir. */
function claudeSaglayici(): Saglayici {
  const model = AYAR.model || 'claude-opus-5';
  return {
    ad: model,
    async incele(g) {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const istemci = new Anthropic();
      const yanit = await istemci.messages.create({
        model,
        max_tokens: 4000,
        system: YONERGE,
        messages: [{ role: 'user', content: istem(g) }],
      });
      const metin = yanit.content
        .map((b) => (b.type === 'text' ? b.text : ''))
        .join('\n')
        .trim();
      return yanitiCoz(metin, model);
    },
  };
}

/**
 * Model olmadan boru hattını çalıştırmak için: metinden basit çıkarımlar
 * yapar. Yalnızca geliştirme ve testte kullanılır.
 */
function denemeSaglayici(): Saglayici {
  return {
    ad: 'deneme',
    async incele(g) {
      const kucuk = g.metin.metin.toLocaleLowerCase('tr');
      const bulgular: Bulgu[] = [];
      if (!/(imza|kaşe|onay)/.test(kucuk)) {
        bulgular.push({
          seviye: 'uyari',
          baslik: 'Belgede imza/kaşe ifadesi görülmedi',
          ayrinti: 'Deneme sağlayıcısı: metinde imza, kaşe veya onay geçmiyor.',
          kaynak: 'yapay-zeka',
        });
      }
      if (/(müellif|oda sicil)/.test(kucuk)) {
        bulgular.push({
          seviye: 'bilgi',
          baslik: 'Müellif/oda sicil bilgisi var',
          kaynak: 'yapay-zeka',
        });
      }
      return {
        model: 'deneme',
        ozet: `Deneme incelemesi: ${g.metin.sayfa} sayfa, ${g.metin.metin.length} karakter metin okundu.`,
        bulgular,
      };
    },
  };
}

/** Yapay zekâ kapalıysa null döner; kural kontrolleri yine çalışır. */
export function saglayiciSec(): Saglayici | null {
  switch (AYAR.tur) {
    case 'ollama':
      return ollamaSaglayici();
    case 'claude':
      return claudeSaglayici();
    case 'deneme':
      return denemeSaglayici();
    default:
      return null;
  }
}

export const saglayiciAdi = (): string => AYAR.tur;
