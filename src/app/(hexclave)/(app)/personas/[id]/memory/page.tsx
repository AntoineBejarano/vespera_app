import { getAppUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { MemoryPanel } from "@/components/MemoryPanel";
import { redirect, notFound } from "next/navigation";

type Params = { params: Promise<{ id: string }> };

export default async function PersonaMemoryPage({ params }: Params) {
  const { id } = await params;
  const user = await getAppUser({ or: "redirect" });
  if (!user) redirect("/handler/sign-in");

  const character = await prisma.character.findFirst({
    where: { id, userId: user.id },
    select: { id: true, name: true },
  });
  if (!character) notFound();

  return (
    <MemoryPanel
      characterId={character.id}
      characterName={character.name}
    />
  );
}
