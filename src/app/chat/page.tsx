import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppNav } from "@/components/AppNav";
import { ChatPanel } from "@/components/ChatPanel";
import { redirect } from "next/navigation";

export default async function ChatPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const characters = await prisma.character.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, intensity: true, active: true },
  });

  return (
    <>
      <AppNav email={session.user.email} />
      <ChatPanel
        characters={characters}
        initialCharacterId={characters.find((c) => c.active)?.id}
      />
    </>
  );
}
