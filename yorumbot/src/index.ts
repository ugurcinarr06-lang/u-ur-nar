import "dotenv/config";
import express from "express";
import rateLimit from "express-rate-limit";
import { PrismaClient } from "@prisma/client";
import { getAuthUrl, handleCallback, getAuthedClient } from "./google/oauth";
import { listLocations, postReply } from "./google/gbp";
import { startPoller, pollBusiness } from "./jobs/poller";
import { requireBusinessAuth, requireReviewAuth } from "./middleware/auth";

const app = express();
const prisma = new PrismaClient();
app.use(express.json());

// Genel API limiti: IP başına 15 dakikada 300 istek
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// İşletme oluşturma daha sık kötüye kullanılabilir (auth gerektirmiyor) → daha sıkı limit
const createBusinessLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

// --- İşletme kaydı ---
// NOT: Bu route auth gerektirmez (henüz apiKey yok), bu yüzden ayrıca rate-limitlenir.
// Dönen apiKey yalnızca burada gösterilir — işletme sahibi bunu saklamalı.
app.post("/businesses", createBusinessLimiter, async (req, res) => {
  const { name, email } = req.body;
  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "name zorunlu." });
  }
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Geçerli bir email zorunlu." });
  }

  const business = await prisma.business.create({
    data: { name: name.trim(), email: email.trim(), settings: { create: {} } },
  });
  res.json(business);
});

// Tüm işletme/yorum route'ları apiKey ister
app.use("/businesses/:id", requireBusinessAuth);
app.use("/reviews/:reviewId", requireReviewAuth);

// --- Google bağlantısı ---
// Query'de apiKey zorunlu: businessId'yi bilen herkes rastgele bir Google
// hesabını o işletmeye bağlayabilmemeli.
app.get("/auth/google", async (req, res) => {
  const businessId = String(req.query.businessId);
  const apiKey = String(req.query.apiKey ?? "");
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) return res.status(404).send("İşletme bulunamadı.");
  if (business.apiKey !== apiKey) return res.status(403).send("Geçersiz API anahtarı.");

  res.redirect(getAuthUrl(businessId));
});

app.get("/auth/google/callback", async (req, res) => {
  try {
    const accountName = await handleCallback(
      String(req.query.code),
      String(req.query.state)
    );
    res.send(`Google bağlandı ✅ (${accountName}). Şimdi /locations/sync çağırın.`);
  } catch (e: any) {
    res.status(500).send(`Bağlantı hatası: ${e.message}`);
  }
});

// --- Lokasyonları (şubeleri) senkronize et ---
app.post("/businesses/:id/locations/sync", async (req, res) => {
  const businessId = req.params.id;
  const { client, accountName } = await getAuthedClient(businessId);
  const locations = await listLocations(client, accountName);

  for (const loc of locations) {
    await prisma.location.upsert({
      where: { resourceName: loc.resourceName },
      create: { businessId, resourceName: loc.resourceName, title: loc.title },
      update: { title: loc.title },
    });
  }
  res.json({ synced: locations.length, locations });
});

// --- Manuel tarama tetikle (test için) ---
app.post("/businesses/:id/poll", async (req, res) => {
  await pollBusiness(req.params.id);
  res.json({ ok: true });
});

// --- Onaya düşen yorumlar ---
app.get("/businesses/:id/held", async (req, res) => {
  const held = await prisma.review.findMany({
    where: { status: "held", location: { businessId: req.params.id } },
    include: { reply: true, location: true },
    orderBy: { createTime: "desc" },
  });
  res.json(held);
});

// --- Onaya düşen cevabı (düzenleyerek) gönder ---
app.post("/reviews/:reviewId/approve", async (req, res) => {
  const review = await prisma.review.findUniqueOrThrow({
    where: { id: req.params.reviewId },
    include: { reply: true, location: true },
  });
  const text: string = req.body.text ?? review.reply?.text;
  if (!text) return res.status(400).json({ error: "Cevap metni yok." });

  const { client } = await getAuthedClient(review.location.businessId);
  await postReply(client, review.resourceName, text);

  await prisma.reply.update({
    where: { reviewId: review.id },
    data: { text, postedAt: new Date(), source: req.body.text ? "manual" : "ai" },
  });
  await prisma.review.update({ where: { id: review.id }, data: { status: "replied" } });
  res.json({ ok: true });
});

// --- Ayarlar ---
app.patch("/businesses/:id/settings", async (req, res) => {
  const settings = await prisma.settings.update({
    where: { businessId: req.params.id },
    data: req.body, // tone, language, signature, minAutoRating, blockedKeywords
  });
  res.json(settings);
});

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => {
  console.log(`YorumBot ${PORT} portunda çalışıyor 🚀`);
  startPoller();
});
