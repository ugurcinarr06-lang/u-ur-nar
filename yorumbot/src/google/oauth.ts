import { google } from "googleapis";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Google Business Profile yönetimi için gereken tek scope:
const SCOPES = ["https://www.googleapis.com/auth/business.manage"];

export function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI // örn: https://app.seninsaasin.com/auth/google/callback
  );
}

// İşletme sahibini Google izin ekranına yönlendirecek URL
export function getAuthUrl(businessId: string) {
  const client = createOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline", // refresh token almak için şart
    prompt: "consent",
    scope: SCOPES,
    state: businessId, // callback'te hangi müşteri olduğunu bilmek için
  });
}

// OAuth callback: code'u token'a çevirip kaydet
export async function handleCallback(code: string, businessId: string) {
  const client = createOAuthClient();
  const { tokens } = await client.getToken(code);

  if (!tokens.refresh_token) {
    throw new Error("Refresh token gelmedi. prompt=consent ile tekrar deneyin.");
  }

  client.setCredentials(tokens);

  // GBP hesabını bul (Account Management API)
  const mybusiness = google.mybusinessaccountmanagement({ version: "v1", auth: client });
  const accounts = await mybusiness.accounts.list();
  const accountName = accounts.data.accounts?.[0]?.name;
  if (!accountName) throw new Error("Bu Google hesabında Business Profile bulunamadı.");

  await prisma.googleAccount.upsert({
    where: { businessId },
    create: {
      businessId,
      accountName,
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token,
      expiryDate: new Date(tokens.expiry_date!),
    },
    update: {
      accountName,
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token,
      expiryDate: new Date(tokens.expiry_date!),
    },
  });

  return accountName;
}

// Geçerli (gerekirse yenilenmiş) bir OAuth client döndür
export async function getAuthedClient(businessId: string) {
  const account = await prisma.googleAccount.findUnique({ where: { businessId } });
  if (!account) throw new Error("Google hesabı bağlı değil.");

  const client = createOAuthClient();
  client.setCredentials({
    access_token: account.accessToken,
    refresh_token: account.refreshToken,
    expiry_date: account.expiryDate.getTime(),
  });

  // googleapis kütüphanesi süresi dolunca otomatik yeniler; yenilenirse DB'ye yaz
  client.on("tokens", async (tokens) => {
    await prisma.googleAccount.update({
      where: { businessId },
      data: {
        accessToken: tokens.access_token ?? account.accessToken,
        expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : account.expiryDate,
      },
    });
  });

  return { client, accountName: account.accountName };
}
