import { prisma } from "@/lib/db";
import { getAppUser } from "@/lib/session";
import {
  buildMindGraph,
  layersToMindDocs,
  type MindDoc,
} from "@/lib/persona/mind-graph";
import { listCharacterSubjects } from "@/lib/persona/subject";

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

/**
 * Authenticated mind graph.
 * ?subjectId= — when set, includes Affect, Intentions, Memories for that relationship.
 * Without subjectId — Self, Knowledge, Agency, Relationships list only.
 */
export async function GET(req: Request, { params }: Params) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { id } = await params;
  const subjectId = new URL(req.url).searchParams.get("subjectId");

  const character = await prisma.character.findFirst({
    where: { id, userId: user.id },
    include: {
      telegramBots: {
        include: {
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
        include: { subject: true },
        take: 20,
        orderBy: { updatedAt: "desc" },
      },
      photos: { take: 1, select: { id: true } },
      _count: {
        select: { memories: true, relationships: true, photos: true },
      },
    },
  });

  if (!character) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const subjects = await listCharacterSubjects(character.id);

  const docs: MindDoc[] = [
    ...layersToMindDocs(character),
    ...character.knowledgeLinks.map((link) => ({
      id: `pack-${link.knowledgePack.id}`,
      title: link.knowledgePack.name,
      group: "knowledge",
      type: "knowledge" as const,
      universe: "knowledge" as const,
      content: [
        link.knowledgePack.name,
        link.knowledgePack.description ?? "",
      ]
        .filter(Boolean)
        .join("\n\n"),
    })),
  ];

  // Relationships list (always — who they know)
  for (const rel of character.relationships) {
    docs.push({
      id: `rel-${rel.id}`,
      title:
        rel.subject.displayName ||
        rel.subject.webUserId ||
        rel.subject.telegramUserId ||
        "Someone",
      group: "relationship",
      type: "relationship",
      universe: "relationships",
      content: [
        `Subject: ${rel.subjectId}`,
        `mood: ${rel.mood}`,
        `tone: ${rel.currentTone}`,
        rel.summary ?? "",
      ]
        .filter(Boolean)
        .join("\n"),
      updatedAt: rel.updatedAt.toISOString(),
    });
  }

  // Agency ring
  for (const bot of character.telegramBots) {
    docs.push({
      id: `bot-${bot.id}`,
      title: `@${bot.username}`,
      group: "channel",
      type: "channel",
      universe: "agency",
      content: [
        `Telegram bot @${bot.username}`,
        bot.label ? `Label: ${bot.label}` : "",
        `${bot._count.peers} peers`,
      ]
        .filter(Boolean)
        .join("\n"),
    });
  }
  for (const ch of character.channels ?? []) {
    docs.push({
      id: `ch-${ch}`,
      title: ch,
      group: "channel",
      type: "channel",
      universe: "agency",
      content: `Declared channel: ${ch}`,
    });
  }
  if (character.apiKey || character.apiKeyHash) {
    docs.push({
      id: "agency-api",
      title: "Chat API",
      group: "tool",
      type: "tool",
      universe: "agency",
      content: "Persona chat key enabled (vesp_…)",
    });
  }
  if (character._count.photos > 0) {
    docs.push({
      id: "agency-photos",
      title: "Visual presence",
      group: "capability",
      type: "capability",
      universe: "agency",
      content: `${character._count.photos} photos available`,
    });
  }

  const meta = (character.metaJson ?? {}) as {
    obsidian?: ObsidianMeta;
    traits?: Record<string, number> | string[];
  };

  // Obsidian notes — Self/Knowledge classified (never dumped as memory by default)
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

  // Subject-scoped: Affect, Intentions, Memories — never aggregate across subjects
  if (subjectId) {
    const owned = character.relationships.some((r) => r.subjectId === subjectId);
    const subjectExists = subjects.some((s) => s.id === subjectId);
    if (owned || subjectExists) {
      const [rel, intentions, memories] = await Promise.all([
        prisma.relationshipState.findUnique({
          where: {
            subjectId_characterId: {
              subjectId,
              characterId: character.id,
            },
          },
          include: { subject: true },
        }),
        prisma.openIntention.findMany({
          where: { subjectId, characterId: character.id, status: "open" },
          orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
          take: 12,
        }),
        prisma.memory.findMany({
          where: { subjectId, characterId: character.id },
          take: MEMORY_LIMIT,
          orderBy: { updatedAt: "desc" },
        }),
      ]);

      if (rel) {
        docs.push({
          id: `affect-${rel.id}`,
          title: `Affect · ${rel.subject.displayName || "this person"}`,
          group: "affect",
          type: "affect",
          universe: "affect",
          content: [
            `Familiarity: ${rel.familiarity.toFixed(2)}`,
            `Trust: ${rel.trust.toFixed(2)}`,
            `Openness: ${rel.openness.toFixed(2)}`,
            `Playfulness: ${rel.playfulness.toFixed(2)}`,
            `Affection: ${rel.affection.toFixed(2)}`,
            `Energy: ${rel.energy.toFixed(2)}`,
            `Current tone: ${rel.currentTone}`,
            `Mood: ${rel.mood}`,
            rel.summary ?? "",
          ].join("\n"),
          updatedAt: rel.updatedAt.toISOString(),
        });
      }

      for (const intention of intentions) {
        docs.push({
          id: `intention-${intention.id}`,
          title: `${intention.kind}: ${intention.content.slice(0, 40)}`,
          group: "intention",
          type: "intention",
          universe: "intentions",
          content: [
            intention.content,
            intention.dueHint ? `Due hint: ${intention.dueHint}` : "",
            `Confidence: ${intention.confidence.toFixed(2)}`,
          ]
            .filter(Boolean)
            .join("\n"),
          confidence: intention.confidence,
          updatedAt: intention.updatedAt.toISOString(),
        });
      }

      for (const mem of memories) {
        docs.push({
          id: `memory-${mem.id}`,
          title: `Memory · ${mem.type}`,
          group: "memory",
          type: "memory",
          universe: "memory",
          content: mem.content,
          updatedAt: mem.updatedAt.toISOString(),
        });
      }
    }
  }

  const graph = buildMindGraph(docs, {
    rootId: `persona:${character.id}`,
    rootLabel: character.name,
    maxConcepts: 100,
  });

  return Response.json({
    graph,
    subjects: subjects.map((s) => ({
      id: s.id,
      displayName:
        s.displayName ||
        s.webUserId ||
        (s.telegramUserId ? `tg:${s.telegramUserId}` : null) ||
        s.externalCustomerId ||
        "Someone",
      webUserId: s.webUserId,
      telegramUserId: s.telegramUserId,
      externalCustomerId: s.externalCustomerId,
    })),
    selectedSubjectId: subjectId,
    stats: {
      nodeCount: graph.nodes.length,
      linkCount: graph.links.length,
      memoryTotal: character._count.memories,
      relationshipTotal: character._count.relationships,
      obsidianNotes: meta.obsidian?.notes?.length ?? 0,
      subjectScoped: Boolean(subjectId),
    },
  });
}
