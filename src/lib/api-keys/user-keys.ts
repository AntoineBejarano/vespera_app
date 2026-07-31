import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/db";

export const USER_API_KEY_PREFIX = "vsk_";

export function hashUserApiKey(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

export function generateUserApiKeySecret() {
  const raw = `${USER_API_KEY_PREFIX}${randomBytes(24).toString("hex")}`;
  return {
    raw,
    keyPrefix: raw.slice(0, 12),
    keyHash: hashUserApiKey(raw),
  };
}

export async function createUserApiKey(userId: string, name: string) {
  const { raw, keyPrefix, keyHash } = generateUserApiKeySecret();
  const row = await prisma.userApiKey.create({
    data: {
      userId,
      name: name.trim().slice(0, 60) || "default",
      keyPrefix,
      keyHash,
    },
  });
  return { id: row.id, name: row.name, keyPrefix: row.keyPrefix, secret: raw };
}

export async function listUserApiKeys(userId: string) {
  return prisma.userApiKey.findMany({
    where: { userId, revokedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      lastUsedAt: true,
      createdAt: true,
    },
  });
}

export async function revokeUserApiKey(userId: string, id: string) {
  const existing = await prisma.userApiKey.findFirst({
    where: { id, userId, revokedAt: null },
  });
  if (!existing) return false;
  await prisma.userApiKey.update({
    where: { id },
    data: { revokedAt: new Date() },
  });
  return true;
}

/** Resolve a live user from Authorization / X-Api-Key (vsk_…). */
export async function resolveUserFromApiKey(rawKey: string) {
  const key = rawKey.trim();
  if (!key.startsWith(USER_API_KEY_PREFIX) || key.length < 20) {
    return null;
  }
  const keyHash = hashUserApiKey(key);
  const row = await prisma.userApiKey.findFirst({
    where: { keyHash, revokedAt: null },
    include: { user: true },
  });
  if (!row || row.user.isTelegramPeer) return null;

  void prisma.userApiKey
    .update({
      where: { id: row.id },
      data: { lastUsedAt: new Date() },
    })
    .catch(() => undefined);

  return row.user;
}

export function extractBearerOrApiKey(req: Request): string | null {
  const x = req.headers.get("x-api-key");
  if (x?.trim()) return x.trim();
  const auth = req.headers.get("authorization");
  if (!auth) return null;
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m?.[1]?.trim() ?? null;
}
