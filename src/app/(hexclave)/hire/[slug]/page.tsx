import type { Metadata } from "next";
import {
  SeoVerbPage,
  seoGenerateMetadata,
  seoStaticParams,
} from "@/lib/seo/catalog/page-helpers";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return seoStaticParams("hire");
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  return seoGenerateMetadata("hire", slug);
}

export default async function HirePage({ params }: Params) {
  const { slug } = await params;
  return <SeoVerbPage verb="hire" slug={slug} />;
}
