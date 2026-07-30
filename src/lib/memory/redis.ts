import { Redis } from "@upstash/redis";

const memoryStore = new Map<string, string>();
const listStore = new Map<string, string[]>();

function hasUpstash() {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  );
}

let redis: Redis | null = null;

function getRedis() {
  if (!hasUpstash()) return null;
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return redis;
}

export async function redisGet(key: string): Promise<string | null> {
  const client = getRedis();
  if (client) return client.get<string>(key);
  return memoryStore.get(key) ?? null;
}

export async function redisSet(
  key: string,
  value: string,
  exSeconds?: number,
): Promise<void> {
  const client = getRedis();
  if (client) {
    if (exSeconds) await client.set(key, value, { ex: exSeconds });
    else await client.set(key, value);
    return;
  }
  memoryStore.set(key, value);
  if (exSeconds) {
    setTimeout(() => memoryStore.delete(key), exSeconds * 1000).unref?.();
  }
}

export async function redisIncr(key: string): Promise<number> {
  const client = getRedis();
  if (client) return client.incr(key);
  const next = Number(memoryStore.get(key) ?? "0") + 1;
  memoryStore.set(key, String(next));
  return next;
}

export async function redisLPush(key: string, value: string): Promise<void> {
  const client = getRedis();
  if (client) {
    await client.lpush(key, value);
    return;
  }
  const list = listStore.get(key) ?? [];
  list.unshift(value);
  listStore.set(key, list);
}

export async function redisLTrim(
  key: string,
  start: number,
  stop: number,
): Promise<void> {
  const client = getRedis();
  if (client) {
    await client.ltrim(key, start, stop);
    return;
  }
  const list = listStore.get(key) ?? [];
  listStore.set(key, list.slice(start, stop + 1));
}

export async function redisLRange(
  key: string,
  start: number,
  stop: number,
): Promise<string[]> {
  const client = getRedis();
  if (client) return (await client.lrange(key, start, stop)) as string[];
  const list = listStore.get(key) ?? [];
  const end = stop < 0 ? list.length : stop + 1;
  return list.slice(start, end);
}

export async function redisDel(key: string): Promise<void> {
  const client = getRedis();
  if (client) {
    await client.del(key);
    return;
  }
  memoryStore.delete(key);
  listStore.delete(key);
}
