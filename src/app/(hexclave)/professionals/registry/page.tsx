import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { LegalFooter } from "@/components/LegalFooter";
import { MarketingNav } from "@/components/MarketingNav";
import {
  ProfessionalRegistry,
  type ProfessionalRegistryEntry,
} from "@/components/professionals/ProfessionalRegistry";
import { SHOWCASE_CHARACTERS } from "@/lib/characters/showcase";
import { isProfessionalPersona, professionalRole } from "@/lib/professionals";
import { listRegistryPersonas } from "@/lib/registry/public";
import { SITE_URL } from "@/lib/site";
import "@/styles/professionals-public.css";

export const metadata: Metadata = {
  title: "Professional Registry",
  description:
    "Find ready-to-use professors, coaches, mentors and specialist advisors on Vesperer.",
  alternates: { canonical: `${SITE_URL}/professionals/registry` },
};

export default async function ProfessionalRegistryPage() {
  const community = (await listRegistryPersonas({ adult: false, limit: 96 }))
    .filter((persona) => isProfessionalPersona(persona.categories))
    .map<ProfessionalRegistryEntry>((persona) => ({
      slug: persona.slug,
      href: `/p/${persona.slug}`,
      name: persona.name,
      tagline: persona.tagline,
      role: professionalRole(persona.categories),
      categories: persona.categories,
      photoUrl: persona.photoUrl,
      creatorLabel: persona.creatorLabel,
      channelLabels: persona.channelLabels,
      curated: false,
    }));

  const communitySlugs = new Set(community.map((persona) => persona.slug));
  const curated = SHOWCASE_CHARACTERS
    .filter(
      (persona) =>
        !persona.isAdult &&
        !communitySlugs.has(persona.slug) &&
        persona.categories.some(
          (category) => category.toLocaleLowerCase("en") === "professionals",
        ),
    )
    .map<ProfessionalRegistryEntry>((persona) => ({
      slug: persona.slug,
      href: `/c/${persona.slug}`,
      name: persona.name,
      tagline: persona.tagline,
      role: professionalRole(persona.categories),
      categories: persona.categories,
      photoUrl: persona.imageUrl,
      creatorLabel: persona.creatorLabel,
      channelLabels: ["Web", "Voice"],
      curated: true,
    }));

  const professionals = [...community, ...curated];

  return (
    <div className="professionals-theme">
      <MarketingNav />

      <header className="professional-registry-header border-b border-[var(--line)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-7 px-4 py-10 sm:px-6 sm:py-14 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase text-[var(--accent)]">
              Vesperer Professional Registry
            </p>
            <h1 className="mt-3 max-w-3xl font-[family-name:var(--font-display)] text-4xl font-semibold sm:text-5xl">
              Find the right mind for the work.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)]">
              Explore professionals ready for voice and text conversations, organized by role and expertise.
            </p>
          </div>
          <Link href="/personas/new" className="professional-registry-create">
            <Plus className="size-4" /> Create a professional
          </Link>
        </div>
      </header>

      <ProfessionalRegistry professionals={professionals} />
      <LegalFooter />
    </div>
  );
}
