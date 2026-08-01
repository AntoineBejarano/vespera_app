import { prisma } from "@/lib/db";
import { getAppUser } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

export type GraphNodeKind =
  | "persona"
  | "layer"
  | "memoryType"
  | "memory"
  | "relationship"
  | "bot"
  | "peer"
  | "knowledge";

export type PersonaGraphNode = {
  id: string;
  kind: GraphNodeKind;
  label: string;
  detail?: string | null;
  meta?: Record<string, string | number | boolean | null>;
};

export type PersonaGraphEdge = {
  id: string;
  source: string;
  target: string;
  label?: string;
};

const MEMORY_LIMIT = 24;
const RELATIONSHIP_LIMIT = 12;
const PEERS_PER_BOT = 8;

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
            take: PEERS_PER_BOT,
            orderBy: { updatedAt: "desc" },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  telegramUsername: true,
                  telegramFirstName: true,
                },
              },
            },
          },
          _count: { select: { peers: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      knowledgeLinks: {
        where: { active: true },
        include: {
          knowledgePack: { select: { id: true, name: true } },
        },
        take: 12,
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
          updatedAt: true,
        },
      },
      _count: {
        select: {
          memories: true,
          relationships: true,
        },
      },
    },
  });

  if (!character) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const relUserIds = character.relationships.map((r) => r.userId);
  const relUsers = relUserIds.length
    ? await prisma.user.findMany({
        where: { id: { in: relUserIds } },
        select: {
          id: true,
          name: true,
          telegramUsername: true,
          telegramFirstName: true,
          email: true,
        },
      })
    : [];
  const relUserMap = new Map(relUsers.map((u) => [u.id, u]));

  const nodes: PersonaGraphNode[] = [];
  const edges: PersonaGraphEdge[] = [];

  const personaNodeId = `persona:${character.id}`;
  nodes.push({
    id: personaNodeId,
    kind: "persona",
    label: character.name,
    detail: character.tagline,
    meta: {
      intensity: character.intensity,
      isAdult: character.isAdult,
      memoryCount: character._count.memories,
      relationshipCount: character._count.relationships,
    },
  });

  const layers: { key: string; label: string; content: string | null }[] = [
    { key: "soul", label: "Soul", content: character.soulMd },
    { key: "style", label: "Style", content: character.styleMd },
    { key: "rules", label: "Rules", content: character.rulesMd },
    { key: "context", label: "Context", content: character.contextMd },
  ];

  for (const layer of layers) {
    const text = layer.content?.trim();
    if (!text) continue;
    const nodeId = `layer:${layer.key}`;
    nodes.push({
      id: nodeId,
      kind: "layer",
      label: layer.label,
      detail: text.slice(0, 280),
      meta: { chars: text.length },
    });
    edges.push({
      id: `e:${personaNodeId}-${nodeId}`,
      source: personaNodeId,
      target: nodeId,
      label: "defines",
    });
  }

  const memoriesByType = new Map<string, typeof character.memories>();
  for (const m of character.memories) {
    const list = memoriesByType.get(m.type) ?? [];
    list.push(m);
    memoriesByType.set(m.type, list);
  }

  for (const [type, list] of memoriesByType) {
    const typeId = `memoryType:${type}`;
    nodes.push({
      id: typeId,
      kind: "memoryType",
      label: type,
      detail: `${list.length} recent`,
      meta: { count: list.length },
    });
    edges.push({
      id: `e:${personaNodeId}-${typeId}`,
      source: personaNodeId,
      target: typeId,
      label: "remembers",
    });

    for (const m of list.slice(0, 4)) {
      const memId = `memory:${m.id}`;
      nodes.push({
        id: memId,
        kind: "memory",
        label: truncate(m.content, 42),
        detail: m.content.slice(0, 400),
        meta: { type: m.type },
      });
      edges.push({
        id: `e:${typeId}-${memId}`,
        source: typeId,
        target: memId,
      });
    }
  }

  for (const rel of character.relationships) {
    const u = relUserMap.get(rel.userId);
    const label =
      u?.telegramFirstName ||
      u?.telegramUsername ||
      u?.name ||
      u?.email?.split("@")[0] ||
      "Peer";
    const nodeId = `rel:${rel.id}`;
    nodes.push({
      id: nodeId,
      kind: "relationship",
      label,
      detail: rel.summary?.slice(0, 280) ?? `mood: ${rel.mood}`,
      meta: {
        mood: rel.mood,
        trust: Number(rel.trust.toFixed(2)),
        affection: Number(rel.affection.toFixed(2)),
        energy: Number(rel.energy.toFixed(2)),
      },
    });
    edges.push({
      id: `e:${personaNodeId}-${nodeId}`,
      source: personaNodeId,
      target: nodeId,
      label: rel.mood,
    });
  }

  for (const bot of character.telegramBots) {
    const botId = `bot:${bot.id}`;
    nodes.push({
      id: botId,
      kind: "bot",
      label: `@${bot.username}`,
      detail: bot.label || "Telegram bot",
      meta: {
        active: bot.active,
        peerCount: bot._count.peers,
      },
    });
    edges.push({
      id: `e:${personaNodeId}-${botId}`,
      source: personaNodeId,
      target: botId,
      label: "channel",
    });

    for (const peer of bot.peers) {
      const peerId = `peer:${peer.id}`;
      const peerLabel =
        peer.telegramFirstName ||
        peer.telegramUsername ||
        peer.user.telegramFirstName ||
        peer.user.name ||
        `tg:${peer.telegramUserId}`;
      nodes.push({
        id: peerId,
        kind: "peer",
        label: peerLabel,
        detail: peer.telegramUsername
          ? `@${peer.telegramUsername}`
          : peer.telegramUserId,
        meta: {
          ageAttested: Boolean(peer.ageAttestedAt),
        },
      });
      edges.push({
        id: `e:${botId}-${peerId}`,
        source: botId,
        target: peerId,
        label: "talks",
      });
    }
  }

  for (const link of character.knowledgeLinks) {
    const packId = `knowledge:${link.knowledgePack.id}`;
    nodes.push({
      id: packId,
      kind: "knowledge",
      label: link.knowledgePack.name,
      detail: "Knowledge pack",
    });
    edges.push({
      id: `e:${personaNodeId}-${packId}`,
      source: personaNodeId,
      target: packId,
      label: "knows",
    });
  }

  return Response.json({
    nodes,
    edges,
    stats: {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      memoryTotal: character._count.memories,
      relationshipTotal: character._count.relationships,
    },
  });
}

function truncate(s: string, n: number) {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length <= n ? t : `${t.slice(0, n - 1)}…`;
}
