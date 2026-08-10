import { notFound, redirect } from "next/navigation";
import { ProfessionalActivation } from "@/components/professionals/ProfessionalActivation";
import { getShowcaseBySlug } from "@/lib/characters/showcase";
import { accountAgeGateHref } from "@/lib/legal/access-cookie";
import { needsAccountAgeGate } from "@/lib/legal/gate";
import { isProfessionalPersona } from "@/lib/professionals";
import { getAppUser } from "@/lib/session";
import "@/styles/professionals-public.css";

export default async function ActivateProfessionalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const professional = getShowcaseBySlug(slug);
  if (
    !professional ||
    professional.isAdult ||
    !professional.allowFork ||
    !isProfessionalPersona(professional.categories)
  ) {
    notFound();
  }

  const next = `/professionals/activate/${professional.slug}`;
  const user = await getAppUser();
  if (!user) {
    redirect(`/auth/continue?next=${encodeURIComponent(next)}`);
  }
  if (needsAccountAgeGate(user)) {
    redirect(accountAgeGateHref(next));
  }

  return (
    <ProfessionalActivation
      slug={professional.slug}
      name={professional.name}
      tagline={professional.tagline}
      imageUrl={professional.imageUrl}
    />
  );
}
