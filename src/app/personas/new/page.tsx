import { getAppUser } from "@/lib/session";
import { AppNav } from "@/components/AppNav";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { redirect } from "next/navigation";

export default async function NewPersonaPage() {
  const user = await getAppUser({ or: "redirect" });
  if (!user) redirect("/");
  if (!user.ageVerifiedAt) redirect("/age-gate");

  return (
    <>
      <AppNav email={user.email} />
      <OnboardingFlow />
    </>
  );
}
