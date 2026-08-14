import { prisma } from "@/lib/db";
import { getAppUser, requireAppUser } from "@/lib/session";
import { needsAccountAgeGate } from "@/lib/legal/gate";

export async function requireUser(userId?: string) {
  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("USER_NOT_FOUND");
    if (needsAccountAgeGate(user) && !user.isTelegramPeer) {
      throw new Error("AGE_NOT_VERIFIED");
    }
    if (user.isTelegramPeer && !user.ageVerifiedAt) {
      throw new Error("AGE_NOT_VERIFIED");
    }
    return user;
  }
  return requireAppUser();
}

export async function getActiveCharacter(userId: string) {
  return prisma.character.findFirst({
    where: { userId, active: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function countUserCharacters(userId: string) {
  return prisma.character.count({ where: { userId, archivedAt: null } });
}

export async function countWorkspaceCharacters(workspaceId: string) {
  return prisma.character.count({
    where: { workspaceId, archivedAt: null },
  });
}

export { getAppUser, requireAppUser };
export { ensureConversation } from "@/lib/core/conversation";
