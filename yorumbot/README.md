# YorumBot — Google Yorumlarına Otomatik AI Cevap (SaaS MVP)

İşletmelerin Google Business Profile yorumlarını periyodik tarar, Claude API ile işletmenin tonuna uygun cevap üretir ve **guardrail kurallarına takılmayanları otomatik gönderir**. Riskli yorumlar (düşük puan, hukuki/sağlık içerikli kelimeler) onay kuyruğuna düşer.

## Mimari

```
İşletme sahibi ──OAuth──> Google Business Profile
                              │
        (10 dk'da bir poll)   ▼
  poller.ts ──> yeni yorumları çek ──> generateReply.ts (Claude API)
                              │
                        rules.ts (guardrail)
                        ├─ auto  → cevabı Google'a gönder
                        └─ hold  → onay kuyruğu (API: /held, /approve)
```

## Kurulum

```bash
npm install
cp .env.example .env   # değerleri doldur
npx prisma db push     # veritabanını oluştur
npm run dev
```

## Google API erişimi (önemli!)

Business Profile API'leri **başvuru gerektirir**, herkese açık değildir:

1. Google Cloud Console'da proje aç.
2. **Business Profile API erişim başvuru formunu** doldur (Google onayı birkaç gün sürebilir).
3. Onay sonrası şu API'leri etkinleştir: My Business Account Management API, My Business Business Information API, Google My Business API (v4 — yorumlar hâlâ burada).
4. OAuth consent screen'i yapılandır (scope: `business.manage`) ve OAuth Client ID oluştur.
5. SaaS olarak yayınlamadan önce OAuth uygulamanı Google **verification** sürecinden geçir.

## Kimlik doğrulama (API key)

`POST /businesses` dışındaki tüm route'lar `Authorization: Bearer <apiKey>`
header'ı ister. `apiKey`, işletme oluşturulurken bir kere döner — güvenli bir
yerde sakla, tekrar gösterilmez. `/auth/google` bir tarayıcı yönlendirmesi
olduğu için `apiKey`'i query string'te alır (`?apiKey=...`).

`POST /businesses` ayrıca IP başına saatte 10 istekle sınırlıdır (auth
gerektirmediği için kötüye kullanıma açık); diğer tüm route'lar IP başına
15 dakikada 300 istekle sınırlıdır.

## Hızlı test akışı

```bash
# 1. İşletme oluştur (yanıttaki apiKey'i sakla)
curl -X POST localhost:3000/businesses -H "Content-Type: application/json" \
  -d '{"name":"Lezzet Durağı","email":"sahip@ornek.com"}'

# 2. Tarayıcıda Google'ı bağla
open "http://localhost:3000/auth/google?businessId=<ID>&apiKey=<API_KEY>"

# 3. Şubeleri çek
curl -X POST localhost:3000/businesses/<ID>/locations/sync -H "Authorization: Bearer <API_KEY>"

# 4. Manuel tarama tetikle
curl -X POST localhost:3000/businesses/<ID>/poll -H "Authorization: Bearer <API_KEY>"

# 5. Onaya düşenleri gör / onayla
curl localhost:3000/businesses/<ID>/held -H "Authorization: Bearer <API_KEY>"
curl -X POST localhost:3000/reviews/<REVIEW_ID>/approve -H "Content-Type: application/json" \
  -H "Authorization: Bearer <API_KEY>" -d '{}'
```

## Tam otomatik mod hakkında not

`Settings.minAutoRating` varsayılanı 4'tür: 4-5 yıldızlı yorumlar otomatik cevaplanır, 1-3 yıldız onaya düşer. Müşterin "her şey tam otomatik olsun" derse `minAutoRating: 1` yapabilir — ama SaaS itibarın için varsayılanı güvenli tutmanı öneririm. Yanlış giden tek bir otomatik cevap, müşteri kaybettirir.

## Yol haritası

- **Faz 1 (bu repo):** Google yorumları, tam otomatik + onay kuyruğu
- **Faz 2:** Web paneli (Next.js) — onay kuyruğu UI, ton ayarları, istatistikler
- **Faz 3:** Instagram yorum + DM (Meta Graph API, App Review süreci)
- **Faz 4:** Tripadvisor / Yemeksepeti / Getir / Trendyol Go — resmi API yok; partnerlik görüşmeleri veya panel entegrasyonu araştırılacak
- **Altyapı:** Postgres'e geçiş, BullMQ kuyruk, çoklu kullanıcı auth (Clerk/Auth.js), Stripe/iyzico abonelik

## Eksikler (bilerek MVP dışı bırakıldı)

- Çoklu kullanıcı girişi/oturum yönetimi (şu an tek apiKey ile korunuyor, tam
  bir kullanıcı hesabı sistemi değil — Faz 2'de Clerk/Auth.js ile değişecek)
- Webhook yok: GBP yorumlar için webhook sunmuyor, polling zorunlu

## Bu sürümde eklenenler

- **API key koruması:** İşletme oluşturma dışındaki tüm route'lar
  `Authorization: Bearer <apiKey>` ister (`src/middleware/auth.ts`).
- **Rate limiting:** Genel route'larda IP başına 15 dk'da 300, işletme
  oluşturmada saatte 10 istek sınırı (`express-rate-limit`).
- **Retry/backoff:** Claude ve Google API çağrıları geçici hatalarda
  (429, 5xx, ağ kopması) üstel geri çekilmeyle 3 kez yeniden denenir
  (`src/lib/retry.ts`).
- **Girdi doğrulama:** İşletme oluştururken `name`/`email` doğrulanır.
