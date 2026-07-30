import { auth } from "@/lib/auth";
import { AppNav } from "@/components/AppNav";
import { MemoryPanel } from "@/components/MemoryPanel";
import { redirect } from "next/navigation";

export default async function MemoryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <>
      <AppNav email={session.user.email} />
      <MemoryPanel />
    </>
  );
}
