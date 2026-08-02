import {
  redisDel,
  redisIncr,
  redisGet,
  redisSet,
} from "@/lib/memory/redis";
import { prisma } from "@/lib/db";

const DEFAULT_LIMIT = Number(process.env.DAILY_MESSAGE_LIMIT ?? "40");

function dayKey(userId: string) {
  const day = new Date().toISOString().slice(0, 10);
  return `limit:${userId}:${day}`;
}

export async function checkAndIncrementDailyLimit(userId: string): Promise<{
  allowed: boolean;
  remaining: number;
  limit: number;
}> {
  const settings = await prisma.userSettings.findUnique({ where: { userId } });
  const limit = settings?.dailyLimit ?? DEFAULT_LIMIT;
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (
    user?.plan === "premium" ||
    user?.plan === "creator" ||
    user?.plan === "studio"
  ) {
    return { allowed: true, remaining: 9999, limit: 9999 };
  }

  const key = dayKey(userId);
  const currentRaw = await redisGet(key);
  const current = Number(currentRaw ?? "0");

  if (current >= limit) {
    return { allowed: false, remaining: 0, limit };
  }

  const next = await redisIncr(key);
  if (next === 1) {
    await redisSet(key, "1", 60 * 60 * 26);
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      dailyMessageCount: next,
      dailyResetAt: new Date(),
    },
  });

  return { allowed: true, remaining: Math.max(limit - next, 0), limit };
}

export async function getDailyUsage(userId: string) {
  const settings = await prisma.userSettings.findUnique({ where: { userId } });
  const limit = settings?.dailyLimit ?? DEFAULT_LIMIT;
  const key = dayKey(userId);
  const current = Number((await redisGet(key)) ?? "0");
  return { used: current, remaining: Math.max(limit - current, 0), limit };
}

export async function resetDailyLimitCache(userId: string) {
  await redisDel(dayKey(userId));
}
