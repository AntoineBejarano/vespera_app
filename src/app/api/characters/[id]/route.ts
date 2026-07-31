import { prisma } from "@/lib/db";
import { clearHistory } from "@/lib/memory/history";
import { Prisma } from "@/generated/prisma/client";
import { z } from "zod";
import { requireAppUser, getAppUser } from "@/lib/session";
import { isValidSlug } from "@/lib/characters/slug";
import { ensureUniqueSlug } from "@/lib/characters/public";
import {
  ensurePlatformOperatorAttestation,
  isPlatformOperatorRequiredError,
} from "@/lib/legal/operator";

const patchSchema = z.object({
  active: z.boolean().optional(),
  intensity: z.number().int().min(1).max(5).optional(),
  name: z.string().min(1).max(80).optional(),
  soulMd: z.string().max(20000).optional(),
  styleMd: z.string().max(20000).optional(),
  rulesMd: z.string().max(20000).optional(),
  contextMd: z.string().max(20000).optional(),
  limitsJson: z.record(z.string(), z.unknown()).optional(),
  resetChat: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  slug: z.string().min(2).max(64).optional(),
  tagline: z.string().max(180).nullable().optional(),
  openingLine: z.string().max(500).nullable().optional(),
  categories: z.array(z.string().max(40)).max(8).optional(),
  allowFork: z.boolean().optional(),
  isAdult: z.boolean().optional(),
  platformOperatorAccepted: z.boolean().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { id } = await params;
  const character = await prisma.character.findFirst({
    where: { id, userId: user.id },
  });
  if (!character) {
    return Response.json({ error: "No encontrado" }, { status: 404 });
  }
  return Response.json({ character });
}

export async function PATCH(req: Request, { params }: Params) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { id } = await params;
  const character = await prisma.character.findFirst({
    where: { id, userId: user.id },
  });
  if (!character) {
    return Response.json({ error: "No encontrado" }, { status: 404 });
  }

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "Datos inválidos" }, { status: 400 });
  }

  if (parsed.data.active) {
    await prisma.character.updateMany({
      where: { userId: user.id, active: true },
      data: { active: false },
    });
  }

  if (parsed.data.resetChat) {
    await clearHistory(user.id, id);
    const conversation = await prisma.conversation.findFirst({
      where: { userId: user.id, characterId: id },
      orderBy: { updatedAt: "desc" },
    });
    if (conversation) {
      await prisma.message.deleteMany({ where: { conversationId: conversation.id } });
    }
  }

  let nextSlug = character.slug;
  const publishing = parsed.data.isPublic === true;
  const unpublishing = parsed.data.isPublic === false;
  const firstPublish = publishing && !character.isPublic;

  if (firstPublish) {
    try {
      await ensurePlatformOperatorAttestation({
        userId: user.id,
        user,
        platformOperatorAccepted: parsed.data.platformOperatorAccepted,
      });
    } catch (err) {
      if (isPlatformOperatorRequiredError(err)) {
        return Response.json(
          { error: err.message, code: err.code },
          { status: 403 },
        );
      }
      throw err;
    }
  }

  if (parsed.data.slug !== undefined) {
    const candidate = parsed.data.slug.toLowerCase().trim();
    if (!isValidSlug(candidate)) {
      return Response.json(
        { error: "Slug must be lowercase letters, numbers, and hyphens." },
        { status: 400 },
      );
    }
    nextSlug = await ensureUniqueSlug(candidate, id);
  } else if (publishing && !character.slug) {
    nextSlug = await ensureUniqueSlug(parsed.data.name ?? character.name, id);
  }

  if (unpublishing) {
    // keep slug reserved for re-publish
  }

  const updated = await prisma.character.update({
    where: { id },
    data: {
      active: parsed.data.active ?? character.active,
      intensity: parsed.data.intensity ?? character.intensity,
      name: parsed.data.name ?? character.name,
      soulMd:
        parsed.data.soulMd !== undefined
          ? parsed.data.soulMd
          : character.soulMd,
      styleMd:
        parsed.data.styleMd !== undefined
          ? parsed.data.styleMd
          : character.styleMd,
      rulesMd:
        parsed.data.rulesMd !== undefined
          ? parsed.data.rulesMd
          : character.rulesMd,
      contextMd:
        parsed.data.contextMd !== undefined
          ? parsed.data.contextMd
          : character.contextMd,
      limitsJson: (parsed.data.limitsJson ??
        character.limitsJson ??
        undefined) as Prisma.InputJsonValue | undefined,
      isPublic: parsed.data.isPublic ?? character.isPublic,
      slug: nextSlug,
      tagline:
        parsed.data.tagline !== undefined
          ? parsed.data.tagline
          : character.tagline,
      openingLine:
        parsed.data.openingLine !== undefined
          ? parsed.data.openingLine
          : character.openingLine,
      categories: parsed.data.categories ?? character.categories,
      allowFork: parsed.data.allowFork ?? character.allowFork,
      isAdult: parsed.data.isAdult ?? character.isAdult,
    },
  });

  return Response.json({
    character: {
      id: updated.id,
      name: updated.name,
      isPublic: updated.isPublic,
      slug: updated.slug,
      tagline: updated.tagline,
      openingLine: updated.openingLine,
      categories: updated.categories,
      allowFork: updated.allowFork,
      isAdult: updated.isAdult,
    },
  });
}

export async function DELETE(_req: Request, { params }: Params) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { id } = await params;
  const character = await prisma.character.findFirst({
    where: { id, userId: user.id },
  });
  if (!character) {
    return Response.json({ error: "No encontrado" }, { status: 404 });
  }

  await prisma.character.delete({ where: { id } });
  return Response.json({ ok: true });
}
