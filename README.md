# Canlı Çeviri (Live Translation)

Yüz yüze, gerçek zamanlı, çift yönlü konuşma çevirisi yapan uygulamanın
**MVP iskeleti** (Adım 11.1 — yalnızca arayüz ve navigasyon).

İki kişi telefonu aralarına koyar; ekran ortadan ikiye bölünür. Üst yarı
karşıdaki kişiye dönük olacak şekilde **180° döndürülmüştür**, alt yarı
normal yöndedir. Her iki tarafta da dil etiketi, büyük "Konuşmak için
basılı tut" butonu ve büyük fontlu bir çeviri alanı bulunur.

> ⚠️ Bu aşamada **gerçek ses tanıma / çeviri yoktur.** Butona basınca yalnızca
> "Dinleniyor…" durumu gösterilir ve örnek (placeholder) çeviri metni görünür.
> STT → Çeviri → TTS entegrasyonu bir sonraki adımda (11.2) eklenecektir.

## Özellikler (bu sürümde)

- **Dil seçim ekranı:** Sizin diliniz / karşı tarafın dili, hızlı "swap"
  butonu ve son kullanılan dil çiftleri.
- **Split-screen konuşma ekranı:** Üst yarı 180° döndürülmüş, alt yarı normal.
- **Bas-konuş butonları:** Basılı tutunca canlı ses dalgası animasyonu +
  "Dinleniyor…" durumu.
- **Sesli oku ikonu:** Placeholder metni tarayıcının yerel TTS'i
  (Web Speech API) ile okur — gerçek çeviri zinciri olmadan deneyimi gösterir.
- Büyük dokunma hedefleri, büyük font, yüksek kontrast (yaşlı/acele eden
  kullanıcı dostu).

## Teknoloji

- React 19 + TypeScript + Vite
- Tailwind CSS (CDN)
- framer-motion (animasyonlar), lucide-react (ikonlar)

## Çalıştırma

**Gereksinim:** Node.js

1. Bağımlılıkları kur:
   `npm install`
2. Geliştirme sunucusunu başlat:
   `npm run dev`
3. Tarayıcıda `http://localhost:3000` adresini aç. En iyi deneyim için
   tarayıcının geliştirici araçlarından mobil/dar ekran görünümünü kullan.

## Dosya Yapısı

```
App.tsx                      Üst seviye durum + ekran yönlendirme
types.ts                     Tip tanımları (Language, ViewState, ...)
data.ts                      Desteklenen diller, son çiftler, placeholder metinler
views/
  LanguageSelect.tsx         Dil seçim ekranı
  Conversation.tsx           Split-screen konuşma ekranı
components/
  LanguagePicker.tsx         Dil seçim alt sayfası (bottom sheet)
  SpeakerPanel.tsx           Tek bir konuşmacı yarısı (döndürülebilir)
```

## Sonraki Adımlar

- **11.2:** Mikrofon + STT (Whisper/Deepgram) → çeviri (DeepL/GPT-4o) → TTS.
- **v0.5:** Mod B (iki telefon, QR/oda kodu ile WebSocket senkronu).
- **v2.0:** Çevrimdışı dil paketleri, cihaz-üstü gizlilik.
