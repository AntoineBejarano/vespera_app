import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { PublicCharacterView } from "@/components/PublicCharacterView";
import { getPublicCharacterBySlug } from "@/lib/characters/public";
import { ADULT_COOKIE, LEGAL_VERSION } from "@/lib/legal/constants";
import { characterSeoKeywords } from "@/lib/seo/keywords";
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
  const canonical = `${SITE_URL}/c/${character.slug}`;
  const ogImages = character.photoUrl
    ? [{ url: new URL(character.photoUrl, SITE_URL).toString() }]
    : undefined;

  return {
    title,
    description,
    keywords: characterSeoKeywords(character.name, character.categories),
    alternates: { canonical },
    openGraph: {
      title: `${character.name} · ${SITE_NAME}`,
      description,
      url: canonical,
      type: "profile",
      ...(ogImages ? { images: ogImages } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: `${character.name} · ${SITE_NAME}`,
      description,
      ...(ogImages ? { images: ogImages.map((i) => i.url) } : {}),
    },
    robots: character.isAdult
      ? { index: false, follow: false }
      : { index: false, follow: true },
  };
}

export default async function PublicCharacterPage({ params }: Params) {
  const { slug } = await params;
  const character = await getPublicCharacterBySlug(slug);
  if (!character) notFound();

  if (character.isAdult) {
    const jar = await cookies();
    if (jar.get(ADULT_COOKIE)?.value !== LEGAL_VERSION) {
      redirect(`/age-gate?zone=adult&next=${encodeURIComponent(`/c/${slug}`)}`);
    }
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: character.name,
    description: character.tagline,
    url: `${SITE_URL}/c/${character.slug}`,
    ...(character.photoUrl
      ? { image: new URL(character.photoUrl, SITE_URL).toString() }
      : {}),
    ...(character.categories.length
      ? { jobTitle: character.categories.join(", ") }
      : {}),
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
