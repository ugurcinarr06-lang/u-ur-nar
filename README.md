# Canlı Çeviri (Live Translation)

Yüz yüze, gerçek zamanlı, çift yönlü konuşma çevirisi yapan web uygulaması.

İki kişi telefonu aralarına koyar; ekran ortadan ikiye bölünür. Üst yarı
karşıdaki kişiye dönük olacak şekilde **180° döndürülmüştür**, alt yarı
normal yöndedir. Bir kişi kendi tarafındaki "Konuşmak için basılı tut"
butonuna basıp konuşur; uygulama dinler, çevirir, karşı tarafın paneline
yazar ve sesli okur.

## Özellikler

- **Dil seçim ekranı:** Sizin diliniz / karşı tarafın dili, hızlı "swap"
  butonu ve son kullanılan dil çiftleri (8 dil, Arapça/Farsça RTL desteği).
- **Split-screen konuşma ekranı:** Üst yarı 180° döndürülmüş, alt yarı normal.
- **Bas-konuş → çeviri → seslendirme zinciri:**
  - **STT:** Web Speech API (tarayıcıda, anahtarsız) — Chrome/Edge önerilir.
  - **Çeviri:** Gemini (`gemini-2.5-flash`) — **serverless fonksiyon** üzerinden.
  - **TTS:** Web Speech API ile otomatik seslendirme.
- **Konuşma geçmişi:** Baloncuklar (kim/orijinal/çeviri), dokununca tekrar oku.
- Büyük dokunma hedefleri, büyük font, yüksek kontrast (yaşlı/acele eden
  kullanıcı dostu).

## Mimari (Önemli — API anahtarı güvenliği)

Çeviri, tarayıcıda **değil**, sunucu tarafında yapılır. İstemci
`POST /api/translate`'e istek atar; `GEMINI_API_KEY` yalnızca sunucu
ortamında okunur ve istemci paketine **asla gömülmez**.

- **Vercel'de:** `api/translate.ts` serverless fonksiyon olarak çalışır.
- **Yerelde (`npm run dev`):** `vite.config.ts` içindeki bir geliştirme
  middleware'i aynı fonksiyonu taklit eder, böylece çeviri yerelde de çalışır.

## Teknoloji

- React 19 + TypeScript + Vite
- Tailwind CSS (CDN), framer-motion, lucide-react
- Sunucu: Vercel Serverless Functions (`@vercel/node`) + `@google/genai`

## Yerelde Çalıştırma

**Gereksinim:** Node.js

1. Bağımlılıkları kur: `npm install`
2. `.env.example`'ı `.env.local` olarak kopyalayıp Gemini anahtarını yaz:
   ```
   GEMINI_API_KEY=AIza...
   ```
   Anahtarı buradan al: https://aistudio.google.com/apikey
3. Sunucuyu başlat: `npm run dev`
4. **Chrome veya Edge** ile `http://localhost:3000` adresini aç, mikrofon
   iznini ver. (Web Speech API Firefox'ta yoktur.)

## Vercel'e Deploy

1. Bu repoyu GitHub'a gönder (zaten yapıldı).
2. https://vercel.com → **Add New → Project** → bu GitHub reposunu içe aktar.
3. Framework otomatik **Vite** olarak algılanır (`vercel.json` ile sabitlenmiştir).
4. **Settings → Environment Variables** altına ekle:
   - `GEMINI_API_KEY` = Gemini API anahtarın
5. **Deploy**. Bittiğinde `https://<proje>.vercel.app` adresinde yayında olur.

> Not: Anahtarı değiştirdikten sonra yeniden **Redeploy** etmen gerekir.

## Dosya Yapısı

```
App.tsx                      Üst seviye durum + ekran yönlendirme
types.ts                     Tip tanımları
data.ts                      Diller, BCP-47 etiketleri, son çiftler
views/
  LanguageSelect.tsx         Dil seçim ekranı
  Conversation.tsx           Split-screen konuşma ekranı (zincirin yöneticisi)
components/
  LanguagePicker.tsx         Dil seçim alt sayfası
  SpeakerPanel.tsx           Tek bir konuşmacı yarısı (döndürülebilir)
  HistoryModal.tsx           Konuşma geçmişi baloncukları
hooks/
  useSpeechRecognition.ts    Web Speech API (bas-konuş) sarmalayıcı
services/
  translation.ts             /api/translate'e fetch (istemci)
  tts.ts                     Yerel seslendirme (Web Speech API)
lib/
  gemini.ts                  Paylaşılan çeviri çekirdeği (sunucu)
api/
  translate.ts               Vercel serverless fonksiyon
```

## Sonraki Adımlar

- Ayarlar ekranı (otomatik seslendirme, TTS hızı, font boyutu, tema).
- **Mod B:** İki telefon, QR/oda kodu ile WebSocket senkronu.
- Çevrimdışı dil paketleri, cihaz-üstü gizlilik.
