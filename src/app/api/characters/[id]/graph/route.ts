import { prisma } from "@/lib/db";
import { getAppUser } from "@/lib/session";
import {
  buildMindGraph,
  layersToMindDocs,
  type MindDoc,
} from "@/lib/persona/mind-graph";

type Params = { params: Promise<{ id: string }> };

type ObsidianMeta = {
  notes?: {
    path: string;
    title: string;
    content: string;
    type?: string;
    confidence?: number;
    private?: boolean;
  }[];
  syncedAt?: string;
};

const MEMORY_LIMIT = 20;
const RELATIONSHIP_LIMIT = 10;

export async function GET(_req: Request, { params }: Params) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { id } = await params;

  const character = await prisma.character.findFirst({
    where: { id, userId: user.id },
    include: {
      telegramBots: {
        include: {
          peers: {
            take: 6,
            orderBy: { updatedAt: "desc" },
          },
          _count: { select: { peers: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 8,
      },
      knowledgeLinks: {
        where: { active: true },
        include: {
          knowledgePack: {
            select: { id: true, name: true, description: true },
          },
        },
        take: 16,
      },
      relationships: {
        take: RELATIONSHIP_LIMIT,
        orderBy: { updatedAt: "desc" },
      },
      memories: {
        take: MEMORY_LIMIT,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          type: true,
          content: true,
        },
      },
      _count: {
        select: { memories: true, relationships: true },
      },
    },
  });

  if (!character) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const docs: MindDoc[] = [
    ...layersToMindDocs(character),
    ...character.knowledgeLinks.map((link) => ({
      id: `pack-${link.knowledgePack.id}`,
      title: link.knowledgePack.name,
      group: "knowledge",
      content: [
        link.knowledgePack.name,
        link.knowledgePack.description ?? "",
      ]
        .filter(Boolean)
        .join("\n\n"),
    })),
  ];

  const meta = (character.metaJson ?? {}) as {
    obsidian?: ObsidianMeta;
  };
  for (const note of meta.obsidian?.notes ?? []) {
    const typed = note as {
      path: string;
      title: string;
      content: string;
      type?: import("@/lib/persona/mind-graph").MindNodeType;
      confidence?: number;
      private?: boolean;
    };
    docs.push({
      id: `obsidian-${typed.path}`,
      title: typed.title || typed.path,
      group: "note",
      type: typed.type,
      content: typed.content,
      sourcePath: typed.path,
      confidence: typed.confidence,
      private: typed.private,
    });
  }

  for (const mem of character.memories) {
    docs.push({
      id: `memory-${mem.id}`,
      title: `Memory · ${mem.type}`,
      group: "memory",
      content: mem.content,
    });
  }

  for (const bot of character.telegramBots) {
    docs.push({
      id: `bot-${bot.id}`,
      title: `@${bot.username}`,
      group: "channel",
      content: [
        `Telegram bot @${bot.username}`,
        bot.label ? `Label: ${bot.label}` : "",
        `${bot._count.peers} peers`,
        ...bot.peers.map(
          (p) =>
            `Peer: ${p.telegramFirstName || p.telegramUsername || p.telegramUserId}`,
        ),
      ]
        .filter(Boolean)
        .join("\n"),
    });
  }

  for (const rel of character.relationships) {
    docs.push({
      id: `rel-${rel.id}`,
      title: `Relationship · ${rel.mood}`,
      group: "relationship",
      content: [
        `mood: ${rel.mood}`,
        `trust: ${rel.trust.toFixed(2)}`,
        `affection: ${rel.affection.toFixed(2)}`,
        `energy: ${rel.energy.toFixed(2)}`,
        rel.summary ?? "",
      ]
        .filter(Boolean)
        .join("\n"),
    });
  }

  const graph = buildMindGraph(docs, {
    rootId: `persona:${character.id}`,
    rootLabel: character.name,
    maxConcepts: 100,
  });

  return Response.json({
    graph,
    stats: {
      nodeCount: graph.nodes.length,
      linkCount: graph.links.length,
      memoryTotal: character._count.memories,
      relationshipTotal: character._count.relationships,
      obsidianNotes: meta.obsidian?.notes?.length ?? 0,
    },
  });
}
