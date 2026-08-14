import { prisma } from "@/lib/db";

export type ResolveSubjectInput = {
  workspaceId: string;
  webUserId?: string | null;
  telegramUserId?: string | null;
  externalCustomerId?: string | null;
  phoneNumberHash?: string | null;
  displayName?: string | null;
};

/**
 * Resolve or create a RelationshipSubject for cross-channel continuity.
 * Prefer matching existing identity fields before creating a new subject.
 */
export async function resolveSubject(input: ResolveSubjectInput) {
  const {
    workspaceId,
    webUserId,
    telegramUserId,
    externalCustomerId,
    phoneNumberHash,
    displayName,
  } = input;

  if (!webUserId && !telegramUserId && !externalCustomerId && !phoneNumberHash) {
    throw new Error("resolveSubject requires at least one identity");
  }

  if (webUserId) {
    const byWeb = await prisma.relationshipSubject.findUnique({
      where: {
        workspaceId_webUserId: { workspaceId, webUserId },
      },
    });
    if (byWeb) {
      return maybeEnrichSubject(byWeb.id, {
        telegramUserId,
        externalCustomerId,
        phoneNumberHash,
        displayName,
      });
    }
  }

  if (telegramUserId) {
    const byTg = await prisma.relationshipSubject.findUnique({
      where: {
        workspaceId_telegramUserId: { workspaceId, telegramUserId },
      },
    });
    if (byTg) {
      return maybeEnrichSubject(byTg.id, {
        webUserId,
        externalCustomerId,
        phoneNumberHash,
        displayName,
      });
    }
  }

  if (externalCustomerId) {
    const byExt = await prisma.relationshipSubject.findUnique({
      where: {
        workspaceId_externalCustomerId: { workspaceId, externalCustomerId },
      },
    });
    if (byExt) {
      return maybeEnrichSubject(byExt.id, {
        webUserId,
        telegramUserId,
        phoneNumberHash,
        displayName,
      });
    }
  }

  if (phoneNumberHash) {
    const byPhone = await prisma.relationshipSubject.findFirst({
      where: { workspaceId, phoneNumberHash },
    });
    if (byPhone) {
      return maybeEnrichSubject(byPhone.id, {
        webUserId,
        telegramUserId,
        externalCustomerId,
        displayName,
      });
    }
  }

  try {
    return await prisma.relationshipSubject.create({
      data: {
        workspaceId,
        webUserId: webUserId ?? undefined,
        telegramUserId: telegramUserId ?? undefined,
        externalCustomerId: externalCustomerId ?? undefined,
        phoneNumberHash: phoneNumberHash ?? undefined,
        displayName: displayName?.slice(0, 80) ?? undefined,
      },
    });
  } catch {
    // Race on unique identity — re-resolve
    if (webUserId) {
      const again = await prisma.relationshipSubject.findUnique({
        where: { workspaceId_webUserId: { workspaceId, webUserId } },
      });
      if (again) return again;
    }
    if (telegramUserId) {
      const again = await prisma.relationshipSubject.findUnique({
        where: {
          workspaceId_telegramUserId: { workspaceId, telegramUserId },
        },
      });
      if (again) return again;
    }
    if (externalCustomerId) {
      const again = await prisma.relationshipSubject.findUnique({
        where: {
          workspaceId_externalCustomerId: {
            workspaceId,
            externalCustomerId,
          },
        },
      });
      if (again) return again;
    }
    throw new Error("Failed to resolve RelationshipSubject");
  }
}

async function maybeEnrichSubject(
  id: string,
  patch: {
    webUserId?: string | null;
    telegramUserId?: string | null;
    externalCustomerId?: string | null;
    phoneNumberHash?: string | null;
    displayName?: string | null;
  },
) {
  const data: {
    webUserId?: string;
    telegramUserId?: string;
    externalCustomerId?: string;
    phoneNumberHash?: string;
    displayName?: string;
  } = {};

  const current = await prisma.relationshipSubject.findUniqueOrThrow({
    where: { id },
  });

  if (!current.webUserId && patch.webUserId) data.webUserId = patch.webUserId;
  if (!current.telegramUserId && patch.telegramUserId) {
    data.telegramUserId = patch.telegramUserId;
  }
  if (!current.externalCustomerId && patch.externalCustomerId) {
    data.externalCustomerId = patch.externalCustomerId;
  }
  if (!current.phoneNumberHash && patch.phoneNumberHash) {
    data.phoneNumberHash = patch.phoneNumberHash;
  }
  if (!current.displayName && patch.displayName) {
    data.displayName = patch.displayName.slice(0, 80);
  }

  if (Object.keys(data).length === 0) return current;

  // Never steal an identity already owned by another subject in this workspace.
  if (data.webUserId) {
    const taken = await prisma.relationshipSubject.findFirst({
      where: {
        workspaceId: current.workspaceId,
        webUserId: data.webUserId,
        id: { not: id },
      },
      select: { id: true },
    });
    if (taken) delete data.webUserId;
  }
  if (data.telegramUserId) {
    const taken = await prisma.relationshipSubject.findFirst({
      where: {
        workspaceId: current.workspaceId,
        telegramUserId: data.telegramUserId,
        id: { not: id },
      },
      select: { id: true },
    });
    if (taken) delete data.telegramUserId;
  }
  if (data.externalCustomerId) {
    const taken = await prisma.relationshipSubject.findFirst({
      where: {
        workspaceId: current.workspaceId,
        externalCustomerId: data.externalCustomerId,
        id: { not: id },
      },
      select: { id: true },
    });
    if (taken) delete data.externalCustomerId;
  }
  if (data.phoneNumberHash) {
    const taken = await prisma.relationshipSubject.findFirst({
      where: {
        workspaceId: current.workspaceId,
        phoneNumberHash: data.phoneNumberHash,
        id: { not: id },
      },
      select: { id: true },
    });
    if (taken) delete data.phoneNumberHash;
  }

  if (Object.keys(data).length === 0) return current;

  try {
    return await prisma.relationshipSubject.update({
      where: { id },
      data,
    });
  } catch {
    return current;
  }
}

/** List subjects that have a relationship or memory with a character (studio picker). */
export async function listCharacterSubjects(characterId: string) {
  const character = await prisma.character.findUnique({
    where: { id: characterId },
    select: { workspaceId: true },
  });
  if (!character) return [];

  const [fromRs, fromMem] = await Promise.all([
    prisma.relationshipState.findMany({
      where: { characterId },
      select: { subjectId: true },
      take: 100,
    }),
    prisma.memory.findMany({
      where: { characterId },
      select: { subjectId: true },
      distinct: ["subjectId"],
      take: 100,
    }),
  ]);

  const ids = [
    ...new Set([
      ...fromRs.map((r) => r.subjectId),
      ...fromMem.map((m) => m.subjectId),
    ]),
  ];
  if (ids.length === 0) return [];

  return prisma.relationshipSubject.findMany({
    where: { id: { in: ids }, workspaceId: character.workspaceId },
    orderBy: { updatedAt: "desc" },
  });
}
