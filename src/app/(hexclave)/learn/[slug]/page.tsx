import type { Metadata } from "next";
import {
  SeoVerbPage,
  seoGenerateMetadata,
  seoStaticParams,
} from "@/lib/seo/catalog/page-helpers";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return seoStaticParams("learn");
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  return seoGenerateMetadata("learn", slug);
}

export default async function LearnPage({ params }: Params) {
  const { slug } = await params;
  return <SeoVerbPage verb="learn" slug={slug} />;
}
