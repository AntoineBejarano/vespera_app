import { getAppUser } from "@/lib/session";
import { needsAccountAgeGate } from "@/lib/legal/gate";
import { AppNav } from "@/components/AppNav";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { redirect } from "next/navigation";

export default async function NewPersonaPage() {
  const user = await getAppUser({ or: "redirect" });
  if (!user) redirect("/");
  if (needsAccountAgeGate(user)) redirect("/age-gate?zone=standard");

  return (
    <>
      <AppNav email={user.email} />
      <OnboardingFlow />
    </>
  );
}
