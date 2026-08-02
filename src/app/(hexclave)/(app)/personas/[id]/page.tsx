import { getAppUser } from "@/lib/session";
import { hasPlatformOperatorAttestation } from "@/lib/legal/operator";
import { prisma } from "@/lib/db";
import { PersonaDetail } from "@/components/PersonaDetail";
import { formatPersonaVersion } from "@/lib/personas/license";
import { getOrCreateActiveWorkspaceId } from "@/lib/workspace/ensure";
import { redirect, notFound } from "next/navigation";

type Params = { params: Promise<{ id: string }> };

export default async function PersonaPage({ params }: Params) {
  const { id } = await params;
  const user = await getAppUser({ or: "redirect" });
  if (!user) redirect("/handler/sign-in");

  const workspaceId = await getOrCreateActiveWorkspaceId(user);

  const character = await prisma.character.findFirst({
    where: { id, workspaceId, archivedAt: null },
    include: {
      telegramBots: {
        include: { _count: { select: { peers: true } } },
        orderBy: { createdAt: "desc" },
      },
      photos: { orderBy: { createdAt: "desc" } },
      _count: { select: { relationships: true, memories: true } },
    },
  });

  if (!character) notFound();

  const appUrl =
    process.env.APP_URL?.replace(/\/$/, "") ||
    process.env.AUTH_URL?.replace(/\/$/, "") ||
    "";

  const coverUrl =
    character.photos.find((p) => p.kind === "selfie" || p.kind === "face")
      ?.url ??
    character.photos[0]?.url ??
    null;

  return (
    <PersonaDetail
      operatorAttested={hasPlatformOperatorAttestation(user)}
      persona={{
        id: character.id,
        name: character.name,
        intensity: character.intensity,
        preferredModel: character.preferredModel,
        active: character.active,
        hasApiKey: Boolean(character.apiKey || character.apiKeyHash),
        soulMd: character.soulMd ?? "",
        styleMd: character.styleMd ?? "",
        rulesMd: character.rulesMd ?? "",
        contextMd: character.contextMd ?? "",
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
        memoryCount: character._count.memories,
        isPublic: character.isPublic,
        slug: character.slug,
        tagline: character.tagline,
        openingLine: character.openingLine,
        categories: character.categories,
        allowFork: character.allowFork,
        isAdult: character.isAdult,
        license: character.license,
        channels: character.channels,
        version: formatPersonaVersion(
          character.versionMajor,
          character.versionMinor,
        ),
        coverUrl,
      }}
      appUrl={appUrl}
    />
  );
}
