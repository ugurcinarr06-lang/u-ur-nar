/**
 * Bildirim kanalları. Kurum kendi e-posta sunucusunu (SMTP) veya kendi SMS
 * sağlayıcısını (HTTP) tanımlar; kod hiçbir dış servise bağımlı değildir.
 */
export type Kanal = 'eposta' | 'sms';

export interface Gonderi {
  kanal: Kanal;
  hedef: string;
  konu: string;
  govde: string;
}

export interface Gonderici {
  ad: string;
  gonder(g: Gonderi): Promise<void>;
}

const AYAR = {
  eposta: (process.env.IMAR_EPOSTA ?? 'kapali').toLowerCase(),
  smtpUrl: process.env.IMAR_SMTP_URL ?? '',
  gonderen: process.env.IMAR_EPOSTA_GONDEREN ?? 'imar@belediye.local',
  sms: (process.env.IMAR_SMS ?? 'kapali').toLowerCase(),
  smsUrl: process.env.IMAR_SMS_URL ?? '',
  smsGovde: process.env.IMAR_SMS_GOVDE ?? '{"numara":"{{hedef}}","mesaj":"{{mesaj}}"}',
  smsBaslik: process.env.IMAR_SMS_BASLIK ?? '',
};

/** Test ve geliştirme için: gönderileri bellekte tutar. */
export const denemeKutusu: Gonderi[] = [];

function denemeGonderici(kanal: Kanal): Gonderici {
  return {
    ad: `deneme:${kanal}`,
    async gonder(g) {
      denemeKutusu.push(g);
    },
  };
}

/** Kurumun kendi SMTP sunucusu üzerinden e-posta. */
function smtpGonderici(): Gonderici {
  return {
    ad: 'smtp',
    async gonder(g) {
      const { createTransport } = await import('nodemailer');
      const tasiyici = createTransport(AYAR.smtpUrl);
      await tasiyici.sendMail({
        from: AYAR.gonderen,
        to: g.hedef,
        subject: g.konu,
        text: g.govde,
      });
    },
  };
}

/**
 * SMS için genel HTTP gönderici: gövde şablonu ortam değişkeninden gelir,
 * böylece NetGSM/İletimerkezi gibi sağlayıcılara kod değiştirmeden bağlanır.
 * Şablondaki {{hedef}}, {{mesaj}} ve {{baslik}} yerine değerler konur.
 */
function httpGonderici(): Gonderici {
  return {
    ad: 'http',
    async gonder(g) {
      const govde = AYAR.smsGovde
        .replace(/\{\{hedef\}\}/g, JSON.stringify(g.hedef).slice(1, -1))
        .replace(/\{\{mesaj\}\}/g, JSON.stringify(g.govde).slice(1, -1))
        .replace(/\{\{baslik\}\}/g, JSON.stringify(AYAR.smsBaslik).slice(1, -1));
      const yanit = await fetch(AYAR.smsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: govde,
      });
      if (!yanit.ok) throw new Error(`SMS sağlayıcısı ${yanit.status}: ${await yanit.text()}`);
    },
  };
}

/** İlgili kanal kapalıysa null döner; bildirim kaydı yine tutulur. */
export function gondericiSec(kanal: Kanal): Gonderici | null {
  const ayar = kanal === 'eposta' ? AYAR.eposta : AYAR.sms;
  switch (ayar) {
    case 'deneme':
      return denemeGonderici(kanal);
    case 'acik':
      return kanal === 'eposta' ? smtpGonderici() : httpGonderici();
    default:
      return null;
  }
}

export const kanalDurumu = (): Record<Kanal, string> => ({
  eposta: AYAR.eposta,
  sms: AYAR.sms,
});
