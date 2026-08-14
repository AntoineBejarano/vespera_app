import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { RegistryPersonaView } from "@/components/registry/RegistryPersonaView";
import { getRegistryPersonaBySlug } from "@/lib/registry/public";
import { ADULT_COOKIE, LEGAL_VERSION } from "@/lib/legal/constants";
import { characterSeoKeywords } from "@/lib/seo/keywords";
import { SITE_NAME, SITE_URL } from "@/lib/site";

type Params = { params: Promise<{ slug: string }> };

function hasIndexableRegistryContent(
  persona: Awaited<ReturnType<typeof getRegistryPersonaBySlug>>,
) {
  if (!persona || persona.isAdult) return false;
  const hasVersionHistory = persona.versions.length > 1;
  const hasProvenance = persona.knowledgePacks.length > 0 || persona.forkedFrom;
  const hasSubstantialIdentity =
    persona.soulPreview.length >= 120 || persona.layers.length >= 2;
  return Boolean(hasVersionHistory || hasProvenance || hasSubstantialIdentity);
}

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const persona = await getRegistryPersonaBySlug(slug);
  if (!persona) {
    return { title: `Persona not found · ${SITE_NAME}` };
  }

  const title = `${persona.name} — Persona Registry`;
  const description =
    persona.soulPreview ||
    `${persona.name} v${persona.version} by ${persona.creatorLabel}. Canonical identity on Vesperer — export, fork, publish anywhere.`;
  const canonical = `${SITE_URL}/p/${persona.slug}`;
  const ogImages = persona.photoUrl
    ? [{ url: new URL(persona.photoUrl, SITE_URL).toString() }]
    : undefined;

  const indexable = hasIndexableRegistryContent(persona);

  return {
    title,
    description,
    keywords: [
      ...characterSeoKeywords(persona.name, persona.categories),
      "persona registry",
      "AI character export",
      "Chai-ready character",
    ],
    alternates: { canonical },
    openGraph: {
      title: `${persona.name} · ${SITE_NAME} Registry`,
      description,
      url: canonical,
      type: "profile",
      ...(ogImages ? { images: ogImages } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: `${persona.name} · ${SITE_NAME} Registry`,
      description,
      ...(ogImages ? { images: ogImages.map((i) => i.url) } : {}),
    },
    robots: persona.isAdult
      ? { index: false, follow: false }
      : indexable
        ? { index: true, follow: true }
        : { index: false, follow: true },
  };
}

export default async function RegistryPersonaPage({ params }: Params) {
  const { slug } = await params;
  const persona = await getRegistryPersonaBySlug(slug);
  if (!persona) notFound();

  if (persona.isAdult) {
    const jar = await cookies();
    if (jar.get(ADULT_COOKIE)?.value !== LEGAL_VERSION) {
      redirect(`/age-gate?zone=adult&next=${encodeURIComponent(`/p/${slug}`)}`);
    }
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: persona.name,
    description: persona.tagline,
    version: persona.version,
    url: `${SITE_URL}/p/${persona.slug}`,
    author: {
      "@type": "Person",
      name: persona.creatorLabel,
    },
    license: persona.licenseLabel,
    ...(persona.photoUrl
      ? { image: new URL(persona.photoUrl, SITE_URL).toString() }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <RegistryPersonaView persona={persona} />
    </>
  );
}
