import { getAppUser } from "@/lib/session";
import { AppNav } from "@/components/AppNav";
import { MemoryPanel } from "@/components/MemoryPanel";
import { redirect } from "next/navigation";

export default async function MemoryPage() {
  const user = await getAppUser({ or: "redirect" });
  if (!user) redirect("/");
  if (!user.ageVerifiedAt) redirect("/age-gate");

  return (
    <>
      <AppNav email={user.email} />
      <MemoryPanel />
    </>
  );
}
