import { getAppUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { PersonasList } from "@/components/PersonasList";
import { redirect } from "next/navigation";

export default async function PersonasPage() {
  const user = await getAppUser({ or: "redirect" });
  if (!user) redirect("/handler/sign-in");

  const characters = await prisma.character.findMany({
    where: { userId: user.id },
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
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { url: true, kind: true },
      },
      _count: { select: { photos: true } },
    },
  });

  const list = characters.map((c) => {
    const cover =
      c.photos.find((p) => p.kind === "selfie" || p.kind === "face")?.url ??
      c.photos[0]?.url ??
      null;
    return {
      id: c.id,
      name: c.name,
      intensity: c.intensity,
      active: c.active,
      updatedAt: c.updatedAt.toISOString(),
      photoCount: c._count.photos,
      coverUrl: cover,
      hasApiKey: Boolean(c.apiKey || c.apiKeyHash),
      bots: c.telegramBots.map((b) => ({
        id: b.id,
        username: b.username,
        active: b.active,
        label: b.label,
        peerCount: b._count.peers,
      })),
      peerCount: c.telegramBots.reduce((n, b) => n + b._count.peers, 0),
    };
  });

  return <PersonasList initial={list} />;
}
