import { z } from "zod";
import { getAppUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import {
  createKnowledgePack,
  createPackFromSeed,
  listSeedTemplates,
} from "@/lib/knowledge/packs";
import { providerMeta } from "@/lib/knowledge/adapters/registry";

export async function GET() {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const packs = await prisma.knowledgePack.findMany({
    where: { userId: user.id },
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
          checksum: true,
          datasetRevision: true,
        },
      },
      characters: {
        include: {
          character: { select: { id: true, name: true } },
        },
      },
      jobs: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          sourceId: true,
          kind: true,
          status: true,
          progress: true,
          documentsDone: true,
          documentsTotal: true,
          chunksDone: true,
          error: true,
          createdAt: true,
          finishedAt: true,
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

const createSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).optional(),
  language: z.string().max(16).optional(),
  slug: z.string().max(80).optional(),
  seedKey: z.string().optional(),
});

export async function POST(req: Request) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid data" }, { status: 400 });
  }

  try {
    if (parsed.data.seedKey) {
      const { pack, created } = await createPackFromSeed({
        userId: user.id,
        seedKey: parsed.data.seedKey,
      });
      return Response.json({ pack, created }, { status: created ? 201 : 200 });
    }

    if (!parsed.data.name) {
      return Response.json({ error: "name or seedKey required" }, { status: 400 });
    }

    const pack = await createKnowledgePack({
      userId: user.id,
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
