import { getAppUser } from "@/lib/session";
import { needsAccountAgeGate } from "@/lib/legal/gate";
import { prisma } from "@/lib/db";
import { AppNav } from "@/components/AppNav";
import { PersonasList } from "@/components/PersonasList";
import { redirect } from "next/navigation";

export default async function PersonasPage() {
  const user = await getAppUser({ or: "redirect" });
  if (!user) redirect("/");
  if (needsAccountAgeGate(user)) redirect("/age-gate?zone=standard");

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
      _count: { select: { photos: true } },
    },
  });

  const list = characters.map((c) => ({
    id: c.id,
    name: c.name,
    intensity: c.intensity,
    active: c.active,
    updatedAt: c.updatedAt.toISOString(),
    photoCount: c._count.photos,
    hasApiKey: Boolean(c.apiKey),
    bots: c.telegramBots.map((b) => ({
      id: b.id,
      username: b.username,
      active: b.active,
      label: b.label,
      peerCount: b._count.peers,
    })),
    peerCount: c.telegramBots.reduce((n, b) => n + b._count.peers, 0),
  }));

  return (
    <>
      <AppNav email={user.email} />
      <PersonasList initial={list} />
    </>
  );
}
