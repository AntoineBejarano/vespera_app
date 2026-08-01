import { getAppUser } from "@/lib/session";
import { accountAgeGateHref } from "@/lib/legal/access-cookie";
import { needsAccountAgeGate } from "@/lib/legal/gate";
import { AppNav } from "@/components/AppNav";
import { KnowledgePacksPanel } from "@/components/KnowledgePacksPanel";
import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ characterId?: string }>;
};

export default async function KnowledgePage({ searchParams }: Props) {
  const sp = await searchParams;
  const user = await getAppUser({ or: "redirect" });
  if (!user) redirect("/handler/sign-in");
  const knowledgeNext = sp.characterId
    ? `/knowledge?characterId=${encodeURIComponent(sp.characterId)}`
    : "/knowledge";
  if (needsAccountAgeGate(user)) redirect(accountAgeGateHref(knowledgeNext));

  return (
    <>
      <AppNav email={user.email} />
      <KnowledgePacksPanel characterId={sp.characterId} />
    </>
  );
}
