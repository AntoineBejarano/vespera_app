import { getAppUser } from "@/lib/session";
import { accountAgeGateHref } from "@/lib/legal/access-cookie";
import { needsAccountAgeGate } from "@/lib/legal/gate";
import { prisma } from "@/lib/db";
import { AppNav } from "@/components/AppNav";
import { ChatPanel } from "@/components/ChatPanel";
import { redirect } from "next/navigation";

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ characterId?: string }>;
}) {
  const { characterId } = await searchParams;
  const user = await getAppUser({ or: "redirect" });
  if (!user) redirect("/handler/sign-in");
  const chatNext = characterId
    ? `/chat?characterId=${encodeURIComponent(characterId)}`
    : "/personas";
  if (needsAccountAgeGate(user)) redirect(accountAgeGateHref(chatNext));

  if (!characterId) redirect("/personas");

  const character = await prisma.character.findFirst({
    where: { id: characterId, userId: user.id },
    select: { id: true, name: true, intensity: true, active: true },
  });
  if (!character) redirect("/personas");

  // Only this persona in the test chat — no global roster switcher feel.
  return (
    <>
      <AppNav email={user.email} />
      <ChatPanel
        characters={[character]}
        initialCharacterId={character.id}
      />
    </>
  );
}
