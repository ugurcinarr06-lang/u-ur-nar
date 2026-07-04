import { google } from "googleapis";
import type { OAuth2Client } from "google-auth-library";
import { withRetry } from "../lib/retry";

// NOT: Yorumlar hâlâ eski v4 endpoint'inde (mybusiness.googleapis.com/v4).
// Lokasyon listesi ise yeni Business Information API'de.

const STAR_MAP: Record<string, number> = {
  ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5,
};

export interface GbpReview {
  resourceName: string; // accounts/.../locations/.../reviews/...
  reviewer: string;
  rating: number;
  comment: string | null;
  createTime: string;
  hasReply: boolean;
}

// İşletmenin lokasyonlarını (şubelerini) listele
export async function listLocations(client: OAuth2Client, accountName: string) {
  const bizInfo = google.mybusinessbusinessinformation({ version: "v1", auth: client });
  const res = await withRetry(() =>
    bizInfo.accounts.locations.list({
      parent: accountName,
      readMask: "name,title",
      pageSize: 100,
    })
  );
  return (res.data.locations ?? []).map((l) => ({
    resourceName: l.name!, // locations/456
    title: l.title ?? "İsimsiz lokasyon",
  }));
}

// Bir lokasyonun yorumlarını çek (v4 REST)
export async function listReviews(
  client: OAuth2Client,
  accountName: string,
  locationResourceName: string
): Promise<GbpReview[]> {
  // v4 yolu: accounts/{acc}/locations/{loc}/reviews
  const locationId = locationResourceName.split("/").pop();
  const url = `https://mybusiness.googleapis.com/v4/${accountName}/locations/${locationId}/reviews?pageSize=50`;

  const res = await withRetry(() => client.request<{ reviews?: any[] }>({ url }));
  return (res.data.reviews ?? []).map((r) => ({
    resourceName: r.name,
    reviewer: r.reviewer?.displayName ?? "Google kullanıcısı",
    rating: STAR_MAP[r.starRating] ?? 0,
    comment: r.comment ?? null,
    createTime: r.createTime,
    hasReply: !!r.reviewReply,
  }));
}

// Yoruma cevap gönder (v4 PUT .../reply)
export async function postReply(
  client: OAuth2Client,
  reviewResourceName: string,
  replyText: string
) {
  const url = `https://mybusiness.googleapis.com/v4/${reviewResourceName}/reply`;
  await withRetry(() =>
    client.request({
      url,
      method: "PUT",
      data: { comment: replyText },
    })
  );
}
