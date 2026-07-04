// Tam otomatik modda bile bazı yorumlar insana düşmeli.
// Yanlış otomatik cevap, SaaS müşterisi için itibar riskidir.

export interface RuleInput {
  rating: number;
  comment: string | null;
  minAutoRating: number; // Settings.minAutoRating
  blockedKeywords: string; // virgülle ayrık liste
}

export type RuleDecision =
  | { action: "auto" } // otomatik cevapla ve gönder
  | { action: "hold"; reason: string }; // taslak üret ama gönderme, onaya düşür

export function decide(input: RuleInput): RuleDecision {
  // 1) Düşük puanlı yorumlar onaya düşer (varsayılan: 4 altı)
  if (input.rating < input.minAutoRating) {
    return { action: "hold", reason: `Puan ${input.rating}/5 — otomatik eşiğin altında` };
  }

  // 2) Riskli kelimeler (hukuk, sağlık, tehdit vb.) onaya düşer
  if (input.comment) {
    const text = input.comment.toLocaleLowerCase("tr");
    const blocked = input.blockedKeywords
      .split(",")
      .map((k) => k.trim().toLocaleLowerCase("tr"))
      .filter(Boolean);

    const hit = blocked.find((k) => text.includes(k));
    if (hit) {
      return { action: "hold", reason: `Riskli kelime yakalandı: "${hit}"` };
    }
  }

  return { action: "auto" };
}
