// Uygulama genelinde kullanılan tip tanımları.

// Hangi ekranın gösterildiğini belirler.
export type ViewState = 'SELECT' | 'CONVERSATION';

// Desteklenen bir dili temsil eder.
export interface Language {
  code: string;       // Kısa dil kodu (ör. 'tr', 'en', 'ar')
  name: string;       // Türkçe arayüzde görünen ad (ör. 'İngilizce')
  nativeName: string; // Dilin kendi yazımındaki adı (ör. 'English')
  flag: string;       // Bayrak emojisi
  rtl?: boolean;      // Sağdan sola yazılan diller için (Arapça, Farsça)
}

// "Sizin diliniz" → "Karşı tarafın dili" çiftini temsil eder.
export interface LanguagePair {
  fromCode: string;
  toCode: string;
}

// Bir konuşmacı panelinin anlık durumu.
export type PanelStatus = 'idle' | 'listening' | 'translating';

// Konuşma geçmişindeki tek bir satır (kim, ne dedi, çevirisi).
export interface HistoryEntry {
  id: string;
  side: 'A' | 'B';   // A = alt/sizin, B = üst/karşı taraf
  fromCode: string;
  toCode: string;
  original: string;
  translation: string;
  ts: number;
}
