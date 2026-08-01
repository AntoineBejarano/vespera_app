import { notFound, permanentRedirect } from "next/navigation";
import { resolveUseCaseAlias } from "@/lib/seo/catalog";

type Params = { params: Promise<{ slug: string }> };

export default async function UseCasesAliasPage({ params }: Params) {
  const { slug } = await params;
  const target = resolveUseCaseAlias(slug);
  if (!target) notFound();
  permanentRedirect(target);
}
