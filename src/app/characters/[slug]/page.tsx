import { notFound, permanentRedirect } from "next/navigation";
import { resolveMeetAlias } from "@/lib/seo/catalog";

type Params = { params: Promise<{ slug: string }> };

export default async function CharactersAliasPage({ params }: Params) {
  const { slug } = await params;
  const target = resolveMeetAlias(slug);
  if (!target) notFound();
  permanentRedirect(target);
}
