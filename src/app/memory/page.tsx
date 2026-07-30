import { getAppUser } from "@/lib/session";
import { redirect } from "next/navigation";

/** Memory is per-persona — send people to the roster. */
export default async function MemoryPage() {
  const user = await getAppUser({ or: "redirect" });
  if (!user) redirect("/handler/sign-in");
  if (!user.ageVerifiedAt) redirect("/age-gate");
  redirect("/personas");
}
