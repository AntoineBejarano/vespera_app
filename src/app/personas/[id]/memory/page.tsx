import { getAppUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { AppNav } from "@/components/AppNav";
import { MemoryPanel } from "@/components/MemoryPanel";
import { redirect, notFound } from "next/navigation";

type Params = { params: Promise<{ id: string }> };

export default async function PersonaMemoryPage({ params }: Params) {
  const user = await getAppUser({ or: "redirect" });
  if (!user) redirect("/handler/sign-in");
  if (!user.ageVerifiedAt) redirect("/age-gate");

  const { id } = await params;
  const character = await prisma.character.findFirst({
    where: { id, userId: user.id },
    select: { id: true, name: true },
  });
  if (!character) notFound();

  return (
    <>
      <AppNav email={user.email} />
      <MemoryPanel
        characterId={character.id}
        characterName={character.name}
      />
    </>
  );
}
