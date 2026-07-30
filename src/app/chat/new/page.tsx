import { auth } from "@/lib/auth";
import { AppNav } from "@/components/AppNav";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { redirect } from "next/navigation";

export default async function NewCharacterPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <>
      <AppNav email={session.user.email} />
      <OnboardingFlow />
    </>
  );
}
