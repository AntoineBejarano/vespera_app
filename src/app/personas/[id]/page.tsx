import { getAppUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { AppNav } from "@/components/AppNav";
import { PersonaDetail } from "@/components/PersonaDetail";
import { redirect, notFound } from "next/navigation";

type Params = { params: Promise<{ id: string }> };

export default async function PersonaPage({ params }: Params) {
  const user = await getAppUser({ or: "redirect" });
  if (!user) redirect("/");
  if (!user.ageVerifiedAt) redirect("/age-gate");
  const { id } = await params;

  const character = await prisma.character.findFirst({
    where: { id, userId: user.id },
    include: {
      telegramBots: {
        include: { _count: { select: { peers: true } } },
        orderBy: { createdAt: "desc" },
      },
      photos: { orderBy: { createdAt: "desc" } },
      _count: { select: { relationships: true } },
    },
  });

  if (!character) notFound();

  const appUrl =
    process.env.APP_URL?.replace(/\/$/, "") ||
    process.env.AUTH_URL?.replace(/\/$/, "") ||
    "";

  return (
    <>
      <AppNav email={user.email} />
      <PersonaDetail
        persona={{
          id: character.id,
          name: character.name,
          intensity: character.intensity,
          active: character.active,
          hasApiKey: Boolean(character.apiKey),
          soulPreview: character.soulMd?.slice(0, 280) ?? null,
          stylePreview: character.styleMd?.slice(0, 200) ?? null,
          bots: character.telegramBots.map((b) => ({
            id: b.id,
            username: b.username,
            active: b.active,
            label: b.label,
            peerCount: b._count.peers,
            tokenMasked: `${b.token.slice(0, 6)}…${b.token.slice(-4)}`,
          })),
          photos: character.photos.map((p) => ({
            id: p.id,
            url: p.url,
            kind: p.kind,
            tags: p.tags,
            caption: p.caption,
          })),
          relationshipCount: character._count.relationships,
        }}
        appUrl={appUrl}
      />
    </>
  );
}
