import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/db";

export const CHAT_API_KEY_PREFIX = "vesp_";

export function hashChatApiKey(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

export function generateChatApiKeySecret() {
  const raw = `${CHAT_API_KEY_PREFIX}${randomBytes(24).toString("hex")}`;
  return {
    raw,
    keyPrefix: raw.slice(0, 12),
    lastFour: raw.slice(-4),
    keyHash: hashChatApiKey(raw),
  };
}

export type ChatKeyDisplay = {
  hasChatApiKey: boolean;
  apiKeyPrefix: string | null;
  apiKeyLastFour: string | null;
};

export function chatKeyDisplay(character: {
  apiKey: string | null;
  apiKeyPrefix?: string | null;
  apiKeyLastFour?: string | null;
  apiKeyHash?: string | null;
}): ChatKeyDisplay {
  const has =
    Boolean(character.apiKey) ||
    Boolean(character.apiKeyHash) ||
    Boolean(character.apiKeyPrefix);
  return {
    hasChatApiKey: has,
    apiKeyPrefix:
      character.apiKeyPrefix ??
      (character.apiKey ? character.apiKey.slice(0, 12) : null),
    apiKeyLastFour:
      character.apiKeyLastFour ??
      (character.apiKey ? character.apiKey.slice(-4) : null),
  };
}

/** Persist a new chat key (hash + display). Keeps apiKey for lookup until full hash migration. */
export async function setCharacterChatKey(characterId: string, raw: string) {
  const keyHash = hashChatApiKey(raw);
  return prisma.character.update({
    where: { id: characterId },
    data: {
      apiKey: raw,
      apiKeyHash: keyHash,
      apiKeyPrefix: raw.slice(0, 12),
      apiKeyLastFour: raw.slice(-4),
    },
  });
}

/** Resolve character by chat key (legacy plaintext or hash). */
export async function findCharacterByChatKey(rawKey: string) {
  const key = rawKey.trim();
  if (!key.startsWith(CHAT_API_KEY_PREFIX) || key.length < 20) {
    return null;
  }
  const keyHash = hashChatApiKey(key);
  return prisma.character.findFirst({
    where: {
      OR: [{ apiKeyHash: keyHash }, { apiKey: key }],
      archivedAt: null,
    },
    select: {
      id: true,
      name: true,
      userId: true,
      workspaceId: true,
      isAdult: true,
    },
  });
}
