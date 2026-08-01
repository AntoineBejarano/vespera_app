import { getAppUser } from "@/lib/session";
import { needsAccountAgeGate } from "@/lib/legal/gate";
import { AppNav } from "@/components/AppNav";
import { KnowledgePacksPanel } from "@/components/KnowledgePacksPanel";
import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ characterId?: string }>;
};

export default async function KnowledgePage({ searchParams }: Props) {
  const user = await getAppUser({ or: "redirect" });
  if (!user) redirect("/handler/sign-in");
  if (needsAccountAgeGate(user)) redirect("/age-gate?zone=standard");

  const sp = await searchParams;

  return (
    <>
      <AppNav email={user.email} />
      <KnowledgePacksPanel characterId={sp.characterId} />
    </>
  );
}
