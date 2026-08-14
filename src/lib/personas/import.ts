import { Prisma, type User } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { needsAccountAgeGate } from "@/lib/legal/gate";
import { maxCharactersForPlan } from "@/lib/monetization";
import { countWorkspaceCharacters } from "@/lib/users";
import { buildPaywall, type PaywallPayload } from "@/lib/billing/paywall";
import { logProductEvent } from "@/lib/product-events";
import { ensureRelationshipState } from "@/lib/persona/relationship";
import { resolveSubject } from "@/lib/persona/subject";
import {
  importRequestSchema,
  parseCharacterImport,
} from "@/lib/characters/import";
import { containsProhibitedMinorContent } from "@/lib/ai/safety";
import { generateChatApiKeySecret } from "@/lib/api-keys/chat-keys";
import { getOrCreateActiveWorkspaceId } from "@/lib/workspace/ensure";
import { requireWorkspacePermission } from "@/lib/workspace/permissions";
import { sendLifecycleEmail } from "@/lib/notifications/lifecycle";

export type PersonaImportResult =
  | {
      ok: true;
      character: {
        id: string;
        name: string;
        chatApiKey: string;
        warnings: string[];
      };
    }
  | { ok: false; status: number; error: string; paywall?: PaywallPayload };

export async function importPersonaFromBody(
  user: User,
  body: unknown,
  workspaceId?: string,
): Promise<PersonaImportResult> {
  if (needsAccountAgeGate(user)) {
    return { ok: false, status: 403, error: "Age verification 18+ required" };
  }

  const wsId = workspaceId ?? (await getOrCreateActiveWorkspaceId(user));
  try {
    await requireWorkspacePermission(user.id, wsId, "personas.write");
  } catch {
    return {
      ok: false,
      status: 403,
      error: "Missing permission: personas.write",
    };
  }

  const count = await countWorkspaceCharacters(wsId);
  const max = maxCharactersForPlan(user.plan);
  if (count >= max) {
    const paywall = buildPaywall({
      reason: "persona_limit",
      feature: "personas",
      plan: "studio",
      limit: max,
      remaining: 0,
    });
    await logProductEvent({
      type: "persona_limit_hit",
      userId: user.id,
      workspaceId: wsId,
      feature: "personas",
      plan: "studio",
      context: { count, max, currentPlan: user.plan, route: "import" },
    });
    await logProductEvent({
      type: "paywall_viewed",
      userId: user.id,
      workspaceId: wsId,
      feature: "personas",
      plan: "studio",
      context: { reason: "persona_limit", count, max, route: "import" },
    });
    return {
      ok: false,
      status: 402,
      error: paywall.error,
      paywall,
    };
  }

  const parsed = importRequestSchema.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      error:
        "Confirm you have permission to use this content, then paste a valid character export. Set permissionConfirmed:true.",
    };
  }

  let draft;
  try {
    draft = parseCharacterImport(parsed.data.raw, parsed.data.source);
  } catch (err) {
    return {
      ok: false,
      status: 400,
      error: err instanceof Error ? err.message : "Import failed",
    };
  }

  if (parsed.data.nameOverride) draft.name = parsed.data.nameOverride.trim();
  if (parsed.data.intensity) draft.intensity = parsed.data.intensity;

  const safetyBlob = [
    draft.name,
    draft.soulMd,
    draft.styleMd,
    draft.rulesMd,
    draft.contextMd,
    draft.openingLine,
  ].join("\n");
  if (containsProhibitedMinorContent(safetyBlob)) {
    return {
      ok: false,
      status: 400,
      error: "Import blocked: prohibited minor-related content.",
    };
  }

  await prisma.character.updateMany({
    where: { workspaceId: wsId, active: true },
    data: { active: false },
  });

  const { raw: chatApiKey, keyPrefix, lastFour, keyHash } =
    generateChatApiKeySecret();

  const character = await prisma.character.create({
    data: {
      workspaceId: wsId,
      userId: user.id,
      updatedByUserId: user.id,
      name: draft.name,
      identityJson: {
        temperament: draft.personality.slice(0, 200),
        desires: [],
        fears: [],
        contradictions: [],
        linguisticStyle: draft.style.slice(0, 200),
        humor: "natural",
        backstory: draft.scenario.slice(0, 300),
        goals: [],
        relationshipDynamic: draft.relationshipType,
        intensity: draft.intensity,
        kinks: [],
        boundaries: draft.boundaries ? [draft.boundaries] : [],
        excludedThemes: [],
      },
      soulMd: draft.soulMd,
      styleMd: draft.styleMd,
      rulesMd: draft.rulesMd,
      contextMd: draft.contextMd,
      metaJson: {
        name: draft.name,
        relationshipMode: draft.relationshipType,
        intensity: draft.intensity,
        importSource: draft.source,
        createdVia: "api_import",
      },
      tagline: draft.tagline,
      openingLine: draft.openingLine,
      categories: draft.categories,
      intensity: draft.intensity,
      limitsJson: {
        boundaries: draft.boundaries,
        importSource: draft.source,
      } as Prisma.InputJsonValue,
      active: true,
      apiKey: chatApiKey,
      apiKeyHash: keyHash,
      apiKeyPrefix: keyPrefix,
      apiKeyLastFour: lastFour,
    },
  });

  const subject = await resolveSubject({
    workspaceId: character.workspaceId,
    webUserId: user.id,
    displayName: user.name ?? user.email,
  });
  await ensureRelationshipState(subject.id, character.id, user.id);
  await prisma.conversation.create({
    data: {
      userId: user.id,
      characterId: character.id,
      title: `With ${character.name}`,
      subjectId: subject.id,
      channel: "web",
    },
  });

  const { track } = await import("@/lib/metrics");
  track("character_imported");
  if (user.email) {
    await sendLifecycleEmail({
      userId: user.id,
      to: user.email,
      templateId: "persona_created",
      props: {
        name: user.name,
        personaName: character.name,
        personaId: character.id,
      },
      dedupeKey: `persona_created:first:${user.id}`,
    });
  }

  return {
    ok: true,
    character: {
      id: character.id,
      name: character.name,
      chatApiKey,
      warnings: draft.warnings,
    },
  };
}
