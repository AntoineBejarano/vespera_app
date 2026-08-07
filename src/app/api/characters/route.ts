import { prisma } from "@/lib/db";
import { getAppUser } from "@/lib/session";
import { createPersonaFromBody } from "@/lib/personas/create";
import { getOrCreateActiveWorkspaceId } from "@/lib/workspace/ensure";

export async function GET() {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const workspaceId = await getOrCreateActiveWorkspaceId(user);
  const characters = await prisma.character.findMany({
    where: { workspaceId, archivedAt: null },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      intensity: true,
      active: true,
      createdAt: true,
      updatedAt: true,
      metaJson: true,
      apiKey: true,
      _count: {
        select: {
          telegramBots: true,
          photos: true,
          relationships: true,
        },
      },
      telegramBots: {
        select: {
          id: true,
          username: true,
          active: true,
          label: true,
          _count: { select: { peers: true } },
        },
      },
    },
  });

  return Response.json({
    characters: characters.map((c) => ({
      id: c.id,
      name: c.name,
      intensity: c.intensity,
      active: c.active,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      metaJson: c.metaJson,
      hasApiKey: Boolean(c.apiKey),
      botCount: c._count.telegramBots,
      photoCount: c._count.photos,
      peerCount: c.telegramBots.reduce((n, b) => n + b._count.peers, 0),
      bots: c.telegramBots.map((b) => ({
        id: b.id,
        username: b.username,
        active: b.active,
        label: b.label,
        peerCount: b._count.peers,
      })),
    })),
  });
}

export async function POST(req: Request) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const workspaceId = await getOrCreateActiveWorkspaceId(user);
    const result = await createPersonaFromBody(user, body, workspaceId);
    if (!result.ok) {
      if ("paywall" in result && result.paywall) {
        return Response.json(result.paywall, { status: result.status });
      }
      return Response.json({ error: result.error }, { status: result.status });
    }
    const character = result.character;
    return Response.json({
      character: {
        id: character.id,
        name: character.name,
        apiKey: character.chatApiKey,
        layers: character.layers,
      },
    });
  } catch (error) {
    console.error("[characters POST]", error);
    const detail =
      error instanceof Error ? error.message : "Unknown error";
    return Response.json(
      {
        error: `Could not generate persona: ${detail}`,
      },
      { status: 502 },
    );
  }
}
