import "server-only";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import {
  addSource,
  createKnowledgePack,
  linkPackToCharacters,
} from "@/lib/knowledge/packs";
import { enqueueKnowledgeJob } from "@/lib/knowledge/ingest/jobs";
import { classifyObsidianNote } from "@/lib/persona/mind-graph";

export const obsidianNoteSchema = z.object({
  path: z.string().min(1).max(400),
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(200_000),
});

export const obsidianSyncBodySchema = z.object({
  notes: z.array(obsidianNoteSchema).min(1).max(80),
  replace: z.boolean().optional(),
  ingest: z.boolean().optional(),
});

export type ObsidianSyncBody = z.infer<typeof obsidianSyncBodySchema>;

function titleFromPath(path: string) {
  const base = path.split("/").pop() || path;
  return base.replace(/\.md$/i, "");
}

export async function syncObsidianVault(params: {
  userId: string;
  characterId: string;
  workspaceId?: string;
  body: ObsidianSyncBody;
}): Promise<
  | { ok: true; noteCount: number; packId: string | null; ingested: number }
  | { ok: false; status: number; error: string }
> {
  const character = await prisma.character.findFirst({
    where: {
      id: params.characterId,
      ...(params.workspaceId
        ? { workspaceId: params.workspaceId }
        : { userId: params.userId }),
    },
    select: {
      id: true,
      name: true,
      workspaceId: true,
      metaJson: true,
      userId: true,
    },
  });
  if (!character) {
    return { ok: false, status: 404, error: "Not found" };
  }

  // Prefer creator ownership when workspace match
  if (character.userId !== params.userId && !params.workspaceId) {
    return { ok: false, status: 404, error: "Not found" };
  }

  const notes = params.body.notes.map((n) => {
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
  const prevObsidian = (prev.obsidian ?? {}) as { notes?: typeof notes };
  const nextNotes =
    params.body.replace === false
      ? [...(prevObsidian.notes ?? []), ...notes].slice(-120)
      : notes;

  const metaJson = {
    ...prev,
    obsidian: {
      notes: nextNotes,
      syncedAt: new Date().toISOString(),
      noteCount: nextNotes.length,
      source: "obsidian-plugin",
    },
  };

  await prisma.character.update({
    where: { id: character.id },
    data: { metaJson: metaJson as Prisma.InputJsonValue },
  });

  let packId: string | null = null;
  let ingested = 0;

  if (params.body.ingest !== false) {
    const packName = `Obsidian · ${character.name}`;
    let pack = await prisma.knowledgePack.findFirst({
      where: {
        workspaceId: character.workspaceId,
        userId: params.userId,
        name: packName,
      },
    });
    if (!pack) {
      pack = await createKnowledgePack({
        userId: params.userId,
        workspaceId: character.workspaceId,
        name: packName,
        description: `Synced Obsidian vault for ${character.name}`,
        slug: `obsidian-${character.id.slice(0, 10)}`,
      });
    }
    packId = pack.id;

    await linkPackToCharacters({
      userId: params.userId,
      workspaceId: character.workspaceId,
      knowledgePackId: pack.id,
      characterIds: [character.id],
    });

    for (const note of notes.slice(0, 40)) {
      if (note.type === "ignore") continue;
      if (note.type === "memory" && note.private) continue;
      try {
        const { source } = await addSource({
          userId: params.userId,
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
        /* continue */
      }
    }
  }

  return {
    ok: true,
    noteCount: nextNotes.length,
    packId,
    ingested,
  };
}

export async function getObsidianSyncStatus(params: {
  userId: string;
  characterId: string;
  workspaceId?: string;
}) {
  const character = await prisma.character.findFirst({
    where: {
      id: params.characterId,
      ...(params.workspaceId
        ? { workspaceId: params.workspaceId }
        : { userId: params.userId }),
    },
    select: { metaJson: true },
  });
  if (!character) return null;
  const meta = (character.metaJson ?? {}) as {
    obsidian?: { notes?: unknown[]; syncedAt?: string; noteCount?: number };
  };
  return {
    noteCount: meta.obsidian?.noteCount ?? meta.obsidian?.notes?.length ?? 0,
    syncedAt: meta.obsidian?.syncedAt ?? null,
  };
}
