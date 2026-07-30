import { nanoid } from "nanoid";
import { redisGet, redisSet, redisDel } from "@/lib/memory/redis";

const TTL = 60 * 15; // 15 min

export async function createTelegramLinkToken(userId: string) {
  const token = nanoid(24);
  await redisSet(`tg:link:${token}`, userId, TTL);
  return token;
}

export async function consumeTelegramLinkToken(token: string) {
  const key = `tg:link:${token}`;
  const userId = await redisGet(key);
  if (!userId) return null;
  await redisDel(key);
  return userId;
}
