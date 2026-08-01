import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { getAppUser } from "@/lib/session";
import {
  addSource,
  createKnowledgePack,
  linkPackToCharacters,
} from "@/lib/knowledge/packs";
import { enqueueKnowledgeJob } from "@/lib/knowledge/ingest/jobs";
import { classifyObsidianNote } from "@/lib/persona/mind-graph";

type Params = { params: Promise<{ id: string }> };

const noteSchema = z.object({
  path: z.string().min(1).max(400),
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(200_000),
});

const bodySchema = z.object({
  notes: z.array(noteSchema).min(1).max(80),
  /** Replace previous vault snapshot (default true) */
  replace: z.boolean().optional(),
  ingest: z.boolean().optional(),
});

function titleFromPath(path: string) {
  const base = path.split("/").pop() || path;
  return base.replace(/\.md$/i, "");
}

/**
 * Connect an Obsidian-compatible markdown vault to a persona.
 * Stores note graph in metaJson + optionally ingests into a knowledge pack.
 */
export async function POST(req: Request, { params }: Params) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { id } = await params;

  const character = await prisma.character.findFirst({
    where: { id, userId: user.id },
    select: {
      id: true,
      name: true,
      workspaceId: true,
      metaJson: true,
    },
  });
  if (!character) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid vault payload" }, { status: 400 });
  }

  const notes = parsed.data.notes.map((n) => {
    const path = n.path.replace(/\\/g, "/");
    const title = n.title || titleFromPath(n.path);
    const classified = classifyObsidianNote({
      path,
      title,
      content: n.content,
    });
    return {
      path,
      title,
      content: n.content,
      type: classified.type,
      confidence: classified.confidence,
      private: classified.private,
      reason: classified.reason,
    };
  });

  const prev = (character.metaJson ?? {}) as Record<string, unknown>;
  const prevObsidian = (prev.obsidian ?? {}) as {
    notes?: typeof notes;
  };
  const nextNotes =
    parsed.data.replace === false
      ? [...(prevObsidian.notes ?? []), ...notes].slice(-120)
      : notes;

  const metaJson = {
    ...prev,
    obsidian: {
      notes: nextNotes,
      syncedAt: new Date().toISOString(),
      noteCount: nextNotes.length,
    },
  };

  await prisma.character.update({
    where: { id: character.id },
    data: { metaJson: metaJson as Prisma.InputJsonValue },
  });

  let packId: string | null = null;
  let ingested = 0;

  if (parsed.data.ingest !== false) {
    const packName = `Obsidian · ${character.name}`;
    let pack = await prisma.knowledgePack.findFirst({
      where: {
        workspaceId: character.workspaceId,
        userId: user.id,
        name: packName,
      },
    });
    if (!pack) {
      pack = await createKnowledgePack({
        userId: user.id,
        workspaceId: character.workspaceId,
        name: packName,
        description: `Synced Obsidian vault for ${character.name}`,
        slug: `obsidian-${character.id.slice(0, 10)}`,
      });
    }
    packId = pack.id;

    await linkPackToCharacters({
      userId: user.id,
      workspaceId: character.workspaceId,
      knowledgePackId: pack.id,
      characterIds: [character.id],
    });

    // Ingest knowledge/source/belief notes — skip ignore & private journal by default
    for (const note of notes.slice(0, 40)) {
      if (note.type === "ignore") continue;
      if (note.type === "memory" && note.private) continue;
      try {
        const { source } = await addSource({
          userId: user.id,
          knowledgePackId: pack.id,
          provider: "user_owned",
          externalId: `obsidian:${note.path}`,
          config: {
            kind: "manual",
            title: `[${note.type}] ${note.title}`,
            content: note.content,
            language: "en",
          },
        });
        await enqueueKnowledgeJob({
          knowledgePackId: pack.id,
          sourceId: source.id,
          kind: "ingest",
        });
        ingested++;
      } catch {
        // continue other notes
      }
    }
  }

  return Response.json({
    ok: true,
    noteCount: nextNotes.length,
    packId,
    ingested,
  });
}

export async function GET(_req: Request, { params }: Params) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { id } = await params;
  const character = await prisma.character.findFirst({
    where: { id, userId: user.id },
    select: { metaJson: true },
  });
  if (!character) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  const meta = (character.metaJson ?? {}) as {
    obsidian?: { notes?: unknown[]; syncedAt?: string; noteCount?: number };
  };
  return Response.json({
    noteCount: meta.obsidian?.noteCount ?? meta.obsidian?.notes?.length ?? 0,
    syncedAt: meta.obsidian?.syncedAt ?? null,
  });
}
