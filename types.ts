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
