import { prisma } from "@/lib/db";
import { resolveSubject, type ResolveSubjectInput } from "@/lib/persona/subject";
import {
  decideIdentityClaim,
  identityEvidenceSchema,
  isIdentityKind,
  type IdentityEvidence,
  type IdentityKind,
} from "@/lib/core/identity-policy";
import type { Prisma } from "@/generated/prisma/client";

export { resolveSubject };
export type { ResolveSubjectInput };

export type LinkIdentitiesInput = {
  workspaceId: string;
  subjectId: string;
  kind: IdentityKind;
  value: string;
  evidence: IdentityEvidence;
};

export type LinkIdentitiesResult =
  | {
      ok: true;
      subjectId: string;
      mergedFromSubjectId?: string;
    }
  | {
      ok: false;
      code: "NO_EVIDENCE" | "IDENTITY_OWNED" | "INVALID_KIND" | "SUBJECT_NOT_FOUND";
      error: string;
    };

function identityWhere(
  workspaceId: string,
  kind: IdentityKind,
  value: string,
): Prisma.RelationshipSubjectWhereInput {
  if (kind === "webUserId") return { workspaceId, webUserId: value };
  if (kind === "telegramUserId") return { workspaceId, telegramUserId: value };
  if (kind === "externalCustomerId") {
    return { workspaceId, externalCustomerId: value };
  }
  return { workspaceId, phoneNumberHash: value };
}

function identityData(kind: IdentityKind, value: string | null) {
  if (kind === "webUserId") return { webUserId: value };
  if (kind === "telegramUserId") return { telegramUserId: value };
  if (kind === "externalCustomerId") return { externalCustomerId: value };
  return { phoneNumberHash: value };
}

/**
 * Claim an identity onto a subject with verified evidence.
 * Never merges two subjects by heuristic.
 */
export async function linkIdentities(
  input: LinkIdentitiesInput,
): Promise<LinkIdentitiesResult> {
  const evidence = identityEvidenceSchema.safeParse(input.evidence);
  if (!evidence.success || !isIdentityKind(input.kind)) {
    return {
      ok: false,
      code: "NO_EVIDENCE",
      error: "Verified evidence is required to link identities.",
    };
  }

  const primary = await prisma.relationshipSubject.findFirst({
    where: { id: input.subjectId, workspaceId: input.workspaceId },
  });
  if (!primary) {
    return { ok: false, code: "SUBJECT_NOT_FOUND", error: "Subject not found." };
  }

  const owner = await prisma.relationshipSubject.findFirst({
    where: identityWhere(input.workspaceId, input.kind, input.value),
  });

  const ownedByOther = Boolean(owner && owner.id !== primary.id);
  const decision = decideIdentityClaim({
    kind: input.kind,
    ownedByOtherSubject: ownedByOther,
    evidence: evidence.data,
  });

  if (decision.action === "reject") {
    return {
      ok: false,
      code: decision.code,
      error:
        decision.code === "IDENTITY_OWNED"
          ? "Identity already belongs to another subject."
          : "Cannot link identity without verified evidence.",
    };
  }

  let mergedFromSubjectId: string | undefined;

  if (ownedByOther && owner) {
    mergedFromSubjectId = owner.id;
    await prisma.$transaction(async (tx) => {
      await tx.relationshipSubject.update({
        where: { id: owner.id },
        data: identityData(input.kind, null),
      });
      await tx.relationshipSubject.update({
        where: { id: primary.id },
        data: identityData(input.kind, input.value),
      });
      await tx.conversation.updateMany({
        where: { subjectId: owner.id },
        data: { subjectId: primary.id },
      });
      const otherStates = await tx.relationshipState.findMany({
        where: { subjectId: owner.id },
      });
      for (const row of otherStates) {
        const clash = await tx.relationshipState.findUnique({
          where: {
            subjectId_characterId: {
              subjectId: primary.id,
              characterId: row.characterId,
            },
          },
        });
        if (!clash) {
          await tx.relationshipState.update({
            where: { id: row.id },
            data: { subjectId: primary.id },
          });
        }
      }
      await tx.memory.updateMany({
        where: { subjectId: owner.id },
        data: { subjectId: primary.id },
      });
      await tx.openIntention.updateMany({
        where: { subjectId: owner.id },
        data: { subjectId: primary.id },
      });
    });
  } else {
    await prisma.relationshipSubject.update({
      where: { id: primary.id },
      data: identityData(input.kind, input.value),
    });
  }

  await prisma.subjectIdentityLink.upsert({
    where: {
      workspaceId_kind_value: {
        workspaceId: input.workspaceId,
        kind: input.kind,
        value: input.value,
      },
    },
    create: {
      workspaceId: input.workspaceId,
      subjectId: primary.id,
      kind: input.kind,
      value: input.value,
      evidence: evidence.data as Prisma.InputJsonValue,
      verifiedAt: new Date(),
      mergedFromSubjectId,
    },
    update: {
      subjectId: primary.id,
      evidence: evidence.data as Prisma.InputJsonValue,
      verifiedAt: new Date(),
      mergedFromSubjectId,
    },
  });

  return { ok: true, subjectId: primary.id, mergedFromSubjectId };
}

export async function resolveIdentity(input: ResolveSubjectInput) {
  return resolveSubject(input);
}
