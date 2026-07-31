import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { PublicCharacterView } from "@/components/PublicCharacterView";
import { getPublicCharacterBySlug } from "@/lib/characters/public";
import { ADULT_COOKIE, LEGAL_VERSION } from "@/lib/legal/constants";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { SHOWCASE_CHARACTERS } from "@/lib/characters/showcase";

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return SHOWCASE_CHARACTERS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const character = await getPublicCharacterBySlug(slug);
  if (!character) {
    return { title: `Character not found · ${SITE_NAME}` };
  }

  const title = `${character.name} — ${character.tagline}`;
  const description =
    character.soulPreview ||
    `Talk with ${character.name} on Vesperer. Create your own version with memory that lasts.`;

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/c/${character.slug}` },
    openGraph: {
      title: `${character.name} · ${SITE_NAME}`,
      description,
      url: `${SITE_URL}/c/${character.slug}`,
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title: `${character.name} · ${SITE_NAME}`,
      description,
    },
    robots: character.isAdult
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

export default async function PublicCharacterPage({ params }: Params) {
  const { slug } = await params;
  const character = await getPublicCharacterBySlug(slug);
  if (!character) notFound();

  if (character.isAdult) {
    const jar = await cookies();
    if (jar.get(ADULT_COOKIE)?.value !== LEGAL_VERSION) {
      redirect(`/age-gate?next=${encodeURIComponent(`/c/${slug}`)}`);
    }
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: character.name,
    description: character.tagline,
    url: `${SITE_URL}/c/${character.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicCharacterView character={character} />
    </>
  );
}
