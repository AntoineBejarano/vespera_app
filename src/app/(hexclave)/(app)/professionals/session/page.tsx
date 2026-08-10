import { redirect } from "next/navigation";
import { VespererProductWorkspace } from "@/components/VespererProductWorkspace";
import { prisma } from "@/lib/db";
import { resolveCoverUrl } from "@/lib/chat/cover";
import { loadLivingMindSnapshot } from "@/lib/chat/living-mind";
import { getAppUser } from "@/lib/session";
import { getOrCreateActiveWorkspaceId } from "@/lib/workspace/ensure";

export default async function ProfessionalSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ characterId?: string }>;
}) {
  const { characterId } = await searchParams;
  if (!characterId) redirect("/professionals/workspace");

  const user = await getAppUser({ or: "redirect" });
  if (!user) redirect("/handler/sign-in");
  const workspaceId = await getOrCreateActiveWorkspaceId(user);

  const character = await prisma.character.findFirst({
    where: { id: characterId, workspaceId, archivedAt: null },
    select: {
      id: true,
      name: true,
      tagline: true,
      openingLine: true,
      photos: {
        orderBy: [{ isProfile: "desc" }, { createdAt: "desc" }],
        select: { url: true, isProfile: true, kind: true, tags: true },
      },
    },
  });
  if (!character) redirect("/professionals/workspace");

  const mind = await loadLivingMindSnapshot({
    userId: user.id,
    workspaceId,
    characterId: character.id,
  });

  return (
    <VespererProductWorkspace
      character={{
        id: character.id,
        name: character.name,
        tagline: character.tagline,
        openingLine: character.openingLine,
        coverUrl: resolveCoverUrl(character.photos),
      }}
      initialMind={mind}
    />
  );
}
