import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRuntimeAuth } from "@/lib/core/runtime-auth";
import { recordInteraction } from "@/lib/core/interaction";
import { proposedRelationshipUpdateSchema } from "@/lib/core/relationship-policy";
import { appendHistory } from "@/lib/memory/history";

export const maxDuration = 60;

const bodySchema = z.object({
  characterId: z.string().optional(),
  conversationId: z.string().min(1),
  subjectId: z.string().min(1),
  userMessage: z.string().min(1).max(8000),
  assistantMessage: z.string().min(1).max(20_000),
  proposed_relationship_update: proposedRelationshipUpdateSchema.optional(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const auth = await requireRuntimeAuth(req, parsed.data.characterId);
  if ("error" in auth) return auth.error;

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: parsed.data.conversationId,
      characterId: auth.character.id,
    },
  });
  if (!conversation) {
    return Response.json({ error: "Conversation not found" }, { status: 404 });
  }

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: "user",
      content: parsed.data.userMessage,
    },
  });
  await appendHistory(conversation.userId, auth.character.id, {
    role: "user",
    content: parsed.data.userMessage,
  });

  const recorded = await recordInteraction({
    conversationId: conversation.id,
    characterId: auth.character.id,
    subjectId: parsed.data.subjectId,
    userId: conversation.userId,
    userMessage: parsed.data.userMessage,
    assistantMessage: parsed.data.assistantMessage,
    proposed_relationship_update: parsed.data.proposed_relationship_update,
  });

  return Response.json({
    ok: true,
    assistantMessageId: recorded.assistantMessageId,
  });
}
