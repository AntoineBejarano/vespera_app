import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAppUser } from "@/lib/session";
import { accountAgeGateHref, safeNextPath } from "@/lib/legal/access-cookie";
import { needsAccountAgeGate } from "@/lib/legal/gate";
import { AppShell } from "@/components/app-shell/AppShell";
import { HexclaveShell } from "@/components/HexclaveShell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAppUser({ or: "redirect" });
  if (!user) redirect("/handler/sign-in");

  if (needsAccountAgeGate(user)) {
    const h = await headers();
    const raw = h.get("x-vesperer-path");
    const next = safeNextPath(raw) ?? "/personas";
    redirect(accountAgeGateHref(next));
  }

  return (
    <HexclaveShell>
      <AppShell>{children}</AppShell>
    </HexclaveShell>
  );
}
