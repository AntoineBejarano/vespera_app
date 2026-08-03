import { getAppUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { PersonasList } from "@/components/PersonasList";
import { getOrCreateActiveWorkspaceId } from "@/lib/workspace/ensure";
import { resolveCoverUrl } from "@/lib/chat/cover";
import { redirect } from "next/navigation";

export default async function PersonasPage() {
  const user = await getAppUser({ or: "redirect" });
  if (!user) redirect("/handler/sign-in");

  const workspaceId = await getOrCreateActiveWorkspaceId(user);

  const characters = await prisma.character.findMany({
    where: { workspaceId, archivedAt: null },
    orderBy: { updatedAt: "desc" },
    include: {
      telegramBots: {
        select: {
          id: true,
          username: true,
          active: true,
          label: true,
          _count: { select: { peers: true } },
        },
      },
      photos: {
        orderBy: [{ isProfile: "desc" }, { createdAt: "desc" }],
        take: 8,
        select: { url: true, kind: true, tags: true, isProfile: true },
      },
      _count: { select: { photos: true } },
    },
  });

  const list = characters.map((c) => {
    const bots = c.telegramBots.map((b) => ({
      id: b.id,
      username: b.username,
      active: b.active,
      label: b.label,
      peerCount: b._count.peers,
    }));
    return {
      id: c.id,
      name: c.name,
      intensity: c.intensity,
      active: c.active,
      updatedAt: c.updatedAt.toISOString(),
      photoCount: c._count.photos,
      coverUrl: resolveCoverUrl(c.photos),
      hasApiKey: Boolean(c.apiKey || c.apiKeyHash),
      bots,
      peerCount: bots.reduce((n, b) => n + b.peerCount, 0),
    };
  });

  return <PersonasList initial={list} />;
}
