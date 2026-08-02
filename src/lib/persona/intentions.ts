import { createHash } from "crypto";
import { generateText, Output } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getOpenRouter } from "@/lib/ai/openrouter";
import { resolveModel } from "@/lib/ai/models";
import { evaluateContentSafety } from "@/lib/ai/safety";
import { clamp01 } from "@/lib/persona/affect";

const INTENTION_KINDS = [
  "desire",
  "goal",
  "fear",
  "commitment",
  "question",
  "plan",
] as const;

const syncSchema = z.object({
  actions: z
    .array(
      z.object({
        op: z.enum(["upsert", "confirm", "close"]),
        kind: z.enum(INTENTION_KINDS),
        content: z.string().min(8).max(280),
        /** Stable short key for dedupe, e.g. "launch-product-friday" */
        dedupeKey: z.string().min(3).max(80),
        confidence: z.number().min(0).max(1),
        dueHint: z.string().max(80).optional(),
        dueAt: z.string().datetime().optional().nullable(),
        status: z.enum(["open", "done", "dropped"]).optional(),
      }),
    )
    .max(4),
});

function normalizeDedupeKey(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function intentionDedupeKey(kind: string, content: string): string {
  const stem = normalizeDedupeKey(`${kind}-${content.slice(0, 48)}`);
  if (stem.length >= 3) return stem;
  return createHash("sha256").update(`${kind}:${content}`).digest("hex").slice(0, 16);
}

export async function listOpenIntentions(subjectId: string, characterId: string) {
  return prisma.openIntention.findMany({
    where: { subjectId, characterId, status: "open" },
    orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
    take: 12,
  });
}

/**
 * Sync open intentions after a turn.
 * Only upserts when confidence is high and evidence is clear — no speculative fears/desires.
 */
export async function maybeSyncIntentions(params: {
  subjectId: string;
  characterId: string;
  userMessage: string;
  assistantMessage: string;
  sourceMessageId?: string | null;
  modelId?: string;
}) {
  if (
    evaluateContentSafety(params.userMessage).blocked ||
    evaluateContentSafety(params.assistantMessage).blocked
  ) {
    return;
  }

  try {
    const existing = await listOpenIntentions(
      params.subjectId,
      params.characterId,
    );
    const openrouter = getOpenRouter();
    const { output } = await generateText({
      model: openrouter(resolveModel(params.modelId)),
      output: Output.object({ schema: syncSchema }),
      prompt: `Extract ONLY clearly evidenced open intentions the companion should remember about THIS person.

Rules:
- Create/upsert only with clear evidence (explicit commitment, goal, fear, pending question, or plan).
- Do NOT invent sensitive desires, fears, or commitments from ambiguous phrasing.
- confidence must be >= 0.75 to upsert; otherwise omit.
- Prefer confirm (same dedupeKey) over creating duplicates.
- close only when the turn clearly resolves or abandons an existing intention.
- Max 4 actions. Empty actions array is fine.

Existing open intentions:
${existing.length ? existing.map((i) => `- [${i.dedupeKey}] ${i.kind}: ${i.content}`).join("\n") : "(none)"}

User: ${params.userMessage}
Companion: ${params.assistantMessage}`,
    });

    if (!output?.actions?.length) return;

    for (const action of output.actions) {
      const confidence = clamp01(action.confidence);
      if (action.op === "upsert" && confidence < 0.75) continue;

      const dedupeKey = normalizeDedupeKey(action.dedupeKey);
      if (dedupeKey.length < 3) continue;

      if (action.op === "close") {
        await prisma.openIntention.updateMany({
          where: {
            characterId: params.characterId,
            subjectId: params.subjectId,
            dedupeKey,
            status: "open",
          },
          data: {
            status: action.status === "dropped" ? "dropped" : "done",
            lastConfirmedAt: new Date(),
          },
        });
        continue;
      }

      if (action.op === "confirm") {
        await prisma.openIntention.updateMany({
          where: {
            characterId: params.characterId,
            subjectId: params.subjectId,
            dedupeKey,
            status: "open",
          },
          data: {
            lastConfirmedAt: new Date(),
            confidence: Math.max(confidence, 0.75),
            content: action.content.slice(0, 280),
          },
        });
        continue;
      }

      // upsert
      await prisma.openIntention.upsert({
        where: {
          characterId_subjectId_dedupeKey: {
            characterId: params.characterId,
            subjectId: params.subjectId,
            dedupeKey,
          },
        },
        create: {
          subjectId: params.subjectId,
          characterId: params.characterId,
          kind: action.kind,
          content: action.content.slice(0, 280),
          status: "open",
          confidence,
          dedupeKey,
          dueHint: action.dueHint?.slice(0, 80),
          dueAt: action.dueAt ? new Date(action.dueAt) : null,
          sourceMessageId: params.sourceMessageId ?? undefined,
          lastConfirmedAt: new Date(),
        },
        update: {
          kind: action.kind,
          content: action.content.slice(0, 280),
          status: "open",
          confidence,
          dueHint: action.dueHint?.slice(0, 80),
          dueAt: action.dueAt ? new Date(action.dueAt) : undefined,
          sourceMessageId: params.sourceMessageId ?? undefined,
          lastConfirmedAt: new Date(),
        },
      });
    }
  } catch (error) {
    console.error("[intention-sync]", error);
  }
}
