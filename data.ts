import { Language, LanguagePair } from './types';

// MVP için desteklenen diller. Türkiye bağlamına uygun şekilde
// turizm ve göçmen hizmetlerinde sık karşılaşılan dillerle başlıyoruz.
export const LANGUAGES: Language[] = [
  { code: 'tr', name: 'Türkçe', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', name: 'İngilizce', nativeName: 'English', flag: '🇬🇧' },
  { code: 'ar', name: 'Arapça', nativeName: 'العربية', flag: '🇸🇦', rtl: true },
  { code: 'de', name: 'Almanca', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'ru', name: 'Rusça', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'fr', name: 'Fransızca', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'İspanyolca', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fa', name: 'Farsça', nativeName: 'فارسی', flag: '🇮🇷', rtl: true },
];

// Hızlı erişim için son kullanılan dil çiftleri (şimdilik statik).
export const RECENT_PAIRS: LanguagePair[] = [
  { fromCode: 'tr', toCode: 'en' },
  { fromCode: 'tr', toCode: 'ar' },
  { fromCode: 'tr', toCode: 'ru' },
];

// Kod ile dili bulmak için yardımcı fonksiyon.
export const findLanguage = (code: string): Language =>
  LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];

// Bu aşamada gerçek çeviri yok; her dil için örnek/placeholder bir
// cümle gösteriyoruz ki split-screen yerleşimi test edilebilsin.
export const PLACEHOLDER_TEXT: Record<string, string> = {
  tr: 'Merhaba, size nasıl yardımcı olabilirim?',
  en: 'Hello, how can I help you?',
  ar: 'مرحبًا، كيف يمكنني مساعدتك؟',
  de: 'Hallo, wie kann ich Ihnen helfen?',
  ru: 'Здравствуйте, чем я могу вам помочь?',
  fr: 'Bonjour, comment puis-je vous aider ?',
  es: 'Hola, ¿en qué puedo ayudarte?',
  fa: 'سلام، چطور می‌توانم به شما کمک کنم؟',
};

export const placeholderFor = (code: string): string =>
  PLACEHOLDER_TEXT[code] ?? PLACEHOLDER_TEXT.en;

// Ses tanıma (STT) ve seslendirme (TTS) için BCP-47 bölge etiketleri.
// Doğru aksan/ses seçimi için kısa kodu tam etikete eşleriz.
export const BCP47: Record<string, string> = {
  tr: 'tr-TR',
  en: 'en-US',
  ar: 'ar-SA',
  de: 'de-DE',
  ru: 'ru-RU',
  fr: 'fr-FR',
  es: 'es-ES',
  fa: 'fa-IR',
};

export const bcp47 = (code: string): string => BCP47[code] ?? code;
