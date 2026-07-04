import cron from "node-cron";
import { PrismaClient } from "@prisma/client";
import { getAuthedClient } from "../google/oauth";
import { listReviews, postReply } from "../google/gbp";
import { generateReply } from "../ai/generateReply";
import { decide } from "../rules";

const prisma = new PrismaClient();

// Google Business Profile yorumlar için webhook sunmuyor → periyodik tarama.
// MVP: 10 dakikada bir tüm işletmeleri tara. Ölçek büyüyünce kuyruk (BullMQ) ekle.
export function startPoller() {
  cron.schedule("*/10 * * * *", () => {
    pollAll().catch((e) => console.error("[poller] hata:", e));
  });
  console.log("[poller] başlatıldı (10 dk aralık)");
}

export async function pollAll() {
  const businesses = await prisma.business.findMany({
    where: { googleAccount: { isNot: null } },
    include: { locations: true, settings: true },
  });

  for (const biz of businesses) {
    try {
      await pollBusiness(biz.id);
    } catch (e) {
      console.error(`[poller] ${biz.name} taranamadı:`, e);
    }
  }
}

export async function pollBusiness(businessId: string) {
  const biz = await prisma.business.findUniqueOrThrow({
    where: { id: businessId },
    include: { locations: true, settings: true },
  });
  const { client, accountName } = await getAuthedClient(businessId);
  const settings = biz.settings;
  if (!settings) return;

  for (const loc of biz.locations) {
    if (!loc.autoReply) continue;

    const reviews = await listReviews(client, accountName, loc.resourceName);

    for (const r of reviews) {
      if (r.hasReply) continue; // Google'da zaten cevaplanmış

      // Daha önce işlediysek atla
      const existing = await prisma.review.findUnique({
        where: { resourceName: r.resourceName },
      });
      if (existing) continue;

      const review = await prisma.review.create({
        data: {
          locationId: loc.id,
          resourceName: r.resourceName,
          reviewer: r.reviewer,
          rating: r.rating,
          comment: r.comment,
          createTime: new Date(r.createTime),
        },
      });

      // AI cevabını üret
      const text = await generateReply({
        businessName: biz.name,
        tone: settings.tone,
        language: settings.language,
        signature: settings.signature,
        reviewer: r.reviewer,
        rating: r.rating,
        comment: r.comment,
      });

      // Guardrail kararı
      const decision = decide({
        rating: r.rating,
        comment: r.comment,
        minAutoRating: settings.minAutoRating,
        blockedKeywords: settings.blockedKeywords,
      });

      if (decision.action === "auto") {
        await postReply(client, r.resourceName, text);
        await prisma.reply.create({
          data: { reviewId: review.id, text, postedAt: new Date() },
        });
        await prisma.review.update({
          where: { id: review.id },
          data: { status: "replied" },
        });
        console.log(`[poller] ✅ Otomatik cevaplandı: ${r.reviewer} (${r.rating}⭐)`);
      } else {
        await prisma.reply.create({ data: { reviewId: review.id, text } });
        await prisma.review.update({
          where: { id: review.id },
          data: { status: "held" },
        });
        console.log(`[poller] ⏸ Onaya düştü (${decision.reason}): ${r.reviewer}`);
      }
    }
  }
}
