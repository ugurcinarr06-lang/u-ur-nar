import Anthropic from "@anthropic-ai/sdk";
import { withRetry } from "../lib/retry";

const anthropic = new Anthropic(); // ANTHROPIC_API_KEY env'den okunur

export interface ReplyContext {
  businessName: string;
  tone: string; // örn: "samimi ve profesyonel"
  language: string; // örn: "tr"
  signature?: string | null;
  reviewer: string;
  rating: number;
  comment: string | null;
}

export async function generateReply(ctx: ReplyContext): Promise<string> {
  const system = `Sen ${ctx.businessName} adlı işletmenin müşteri ilişkileri asistanısın.
Google yorumlarına işletme adına cevap yazıyorsun.

Kurallar:
- Ton: ${ctx.tone}
- Dil: ${ctx.language === "tr" ? "Türkçe" : ctx.language}
- 2-4 cümle, kısa ve doğal. Robot gibi kalıp cümleler kurma.
- Yorumcunun değindiği SOMUT detaya atıfta bulun (yemek adı, servis, ortam vs).
- Olumsuz yorumlarda: savunmaya geçme, özür dile, telafi için iletişim kanalı öner.
- Asla indirim/ücretsiz ürün sözü verme, asla hukuki konularda yorum yapma.
- Kişisel veri (telefon, isim-soyisim) yazma.
- Sadece cevap metnini döndür, başka hiçbir şey yazma.${ctx.signature ? `\n- Cevabın sonuna şu imzayı ekle: ${ctx.signature}` : ""}`;

  const user = `Yorum bilgisi:
Yorumcu: ${ctx.reviewer}
Puan: ${ctx.rating}/5
Yorum: ${ctx.comment ?? "(Yorum metni yok, sadece puan verilmiş)"}`;

  const msg = await withRetry(() =>
    anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 400,
      system,
      messages: [{ role: "user", content: user }],
    })
  );

  const text = msg.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") throw new Error("AI cevabı üretilemedi.");
  return text.text.trim();
}
