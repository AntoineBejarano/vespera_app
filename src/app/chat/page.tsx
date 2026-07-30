import { getAppUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { AppNav } from "@/components/AppNav";
import { ChatPanel } from "@/components/ChatPanel";
import { redirect } from "next/navigation";

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ characterId?: string }>;
}) {
  const user = await getAppUser({ or: "redirect" });
  if (!user) redirect("/");
  if (!user.ageVerifiedAt) redirect("/age-gate");

  const { characterId } = await searchParams;

  const characters = await prisma.character.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, intensity: true, active: true },
  });

  if (!characters.length) redirect("/personas/new");

  const initial =
    characters.find((c) => c.id === characterId)?.id ??
    characters.find((c) => c.active)?.id ??
    characters[0]?.id;

  return (
    <>
      <AppNav email={user.email} />
      <ChatPanel characters={characters} initialCharacterId={initial} />
    </>
  );
}
