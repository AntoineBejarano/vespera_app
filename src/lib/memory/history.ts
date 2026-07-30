import {
  redisLPush,
  redisLRange,
  redisLTrim,
  redisDel,
} from "@/lib/memory/redis";

export type HistoryMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

function historyKey(userId: string, characterId: string) {
  return `history:${userId}:${characterId}`;
}

export async function appendHistory(
  userId: string,
  characterId: string,
  message: HistoryMessage,
  max = 30,
) {
  const key = historyKey(userId, characterId);
  await redisLPush(key, JSON.stringify(message));
  await redisLTrim(key, 0, max - 1);
}

export async function getRecentHistory(
  userId: string,
  characterId: string,
  limit = 25,
): Promise<HistoryMessage[]> {
  const key = historyKey(userId, characterId);
  const raw = await redisLRange(key, 0, limit - 1);
  return raw
    .map((item) => {
      try {
        return JSON.parse(item) as HistoryMessage;
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .reverse() as HistoryMessage[];
}

export async function clearHistory(userId: string, characterId: string) {
  await redisDel(historyKey(userId, characterId));
}
