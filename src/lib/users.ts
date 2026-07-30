import { prisma } from "@/lib/db";

export async function requireUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("USER_NOT_FOUND");
  if (!user.ageVerifiedAt) throw new Error("AGE_NOT_VERIFIED");
  return user;
}

export async function getActiveCharacter(userId: string) {
  return prisma.character.findFirst({
    where: { userId, active: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function ensureConversation(
  userId: string,
  characterId: string,
) {
  const existing = await prisma.conversation.findFirst({
    where: { userId, characterId },
    orderBy: { updatedAt: "desc" },
  });
  if (existing) return existing;
  return prisma.conversation.create({
    data: { userId, characterId, title: "Conversación" },
  });
}

export async function countUserCharacters(userId: string) {
  return prisma.character.count({ where: { userId } });
}
