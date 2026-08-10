import { redirect } from "next/navigation";
import { ProfessionalsWorkspace } from "@/components/ProfessionalsWorkspace";
import { prisma } from "@/lib/db";
import { resolveCoverUrl } from "@/lib/chat/cover";
import { isProfessionalPersona } from "@/lib/professionals";
import { getAppUser } from "@/lib/session";
import { getOrCreateActiveWorkspaceId } from "@/lib/workspace/ensure";

export default async function ProfessionalsWorkspacePage() {
  const user = await getAppUser({ or: "redirect" });
  if (!user) redirect("/handler/sign-in");
  const workspaceId = await getOrCreateActiveWorkspaceId(user);

  const characters = await prisma.character.findMany({
    where: { workspaceId, archivedAt: null },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      tagline: true,
      categories: true,
      photos: {
        orderBy: [{ isProfile: "desc" }, { createdAt: "desc" }],
        take: 8,
        select: { url: true, isProfile: true, kind: true, tags: true },
      },
      _count: { select: { memories: true } },
    },
  });

  const professionals = characters
    .filter((character) => isProfessionalPersona(character.categories))
    .map((character) => ({
      id: character.id,
      name: character.name,
      tagline: character.tagline,
      categories: character.categories,
      coverUrl: resolveCoverUrl(character.photos),
      memoryCount: character._count.memories,
    }));

  return <ProfessionalsWorkspace professionals={professionals} />;
}
