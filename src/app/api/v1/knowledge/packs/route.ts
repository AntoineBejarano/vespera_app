import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAccountApiKey } from "@/lib/api-keys/require-account-key";
import {
  createKnowledgePack,
  createPackFromSeed,
  listSeedTemplates,
} from "@/lib/knowledge/packs";
import { providerMeta } from "@/lib/knowledge/adapters/registry";

const createSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).optional(),
  language: z.string().max(16).optional(),
  slug: z.string().max(80).optional(),
  seedKey: z.string().optional(),
});

/** List knowledge packs owned by the account. */
export async function GET(req: Request) {
  const auth = await requireAccountApiKey(req, { bucket: "knowledge" });
  if (auth.error) return auth.error;

  const packs = await prisma.knowledgePack.findMany({
    where: { workspaceId: auth.workspaceId, archivedAt: null },
    include: {
      sources: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          provider: true,
          externalId: true,
          canonicalUrl: true,
          license: true,
          language: true,
          status: true,
          enabled: true,
          documentCount: true,
          chunkCount: true,
          lastError: true,
          lastIngestedAt: true,
        },
      },
      characters: {
        include: {
          character: { select: { id: true, name: true } },
        },
      },
      _count: { select: { sources: true, characters: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return Response.json({
    packs,
    providers: providerMeta(),
    seeds: listSeedTemplates(),
  });
}

/** Create a knowledge pack (or from seed template). */
export async function POST(req: Request) {
  const auth = await requireAccountApiKey(req, { bucket: "knowledge" });
  if (auth.error) return auth.error;

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid data" }, { status: 400 });
  }

  try {
    if (parsed.data.seedKey) {
      const { pack, created } = await createPackFromSeed({
        userId: auth.user.id,
        workspaceId: auth.workspaceId,
        seedKey: parsed.data.seedKey,
      });
      return Response.json({ pack, created }, { status: created ? 201 : 200 });
    }

    if (!parsed.data.name) {
      return Response.json(
        { error: "name or seedKey required" },
        { status: 400 },
      );
    }

    const pack = await createKnowledgePack({
      userId: auth.user.id,
      workspaceId: auth.workspaceId,
      name: parsed.data.name,
      description: parsed.data.description,
      language: parsed.data.language,
      slug: parsed.data.slug,
    });
    return Response.json({ pack, created: true }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return Response.json({ error: message }, { status: 400 });
  }
}
