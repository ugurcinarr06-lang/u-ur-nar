// API'ler artık korumasız değil: her işletme, kendine ait apiKey'i
// Authorization: Bearer <apiKey> başlığıyla göndermeli.
// (README'deki "Eksikler" listesinin ilk maddesi buydu.)

import type { NextFunction, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function extractBearerToken(req: Request): string | null {
  const header = req.header("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim() || null;
}

// :id parametresi doğrudan businessId olan route'lar için
export async function requireBusinessAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractBearerToken(req);
  if (!token) return res.status(401).json({ error: "Authorization: Bearer <apiKey> gerekli." });

  const business = await prisma.business.findUnique({ where: { id: req.params.id } });
  if (!business) return res.status(404).json({ error: "İşletme bulunamadı." });
  if (business.apiKey !== token) return res.status(403).json({ error: "Geçersiz API anahtarı." });

  next();
}

// :reviewId parametresi olan route'lar için (review -> location -> business üzerinden doğrular)
export async function requireReviewAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractBearerToken(req);
  if (!token) return res.status(401).json({ error: "Authorization: Bearer <apiKey> gerekli." });

  const review = await prisma.review.findUnique({
    where: { id: req.params.reviewId },
    include: { location: { include: { business: true } } },
  });
  if (!review) return res.status(404).json({ error: "Yorum bulunamadı." });
  if (review.location.business.apiKey !== token) {
    return res.status(403).json({ error: "Geçersiz API anahtarı." });
  }

  next();
}
