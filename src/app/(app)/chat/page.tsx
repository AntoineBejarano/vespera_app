import { getAppUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { ChatPanel } from "@/components/ChatPanel";
import { ChatPicker } from "@/components/ChatPicker";
import { redirect } from "next/navigation";

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ characterId?: string }>;
}) {
  const { characterId } = await searchParams;
  const user = await getAppUser({ or: "redirect" });
  if (!user) redirect("/handler/sign-in");

  if (!characterId) {
    const characters = await prisma.character.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, name: true, intensity: true, active: true },
    });
    return <ChatPicker characters={characters} />;
  }

  const character = await prisma.character.findFirst({
    where: { id: characterId, userId: user.id },
    select: { id: true, name: true, intensity: true, active: true },
  });
  if (!character) redirect("/chat");

  return (
    <ChatPanel characters={[character]} initialCharacterId={character.id} />
  );
}
