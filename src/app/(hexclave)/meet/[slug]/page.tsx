import type { Metadata } from "next";
import {
  SeoVerbPage,
  seoGenerateMetadata,
  seoStaticParams,
} from "@/lib/seo/catalog/page-helpers";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return seoStaticParams("meet");
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  return seoGenerateMetadata("meet", slug);
}

export default async function MeetPage({ params }: Params) {
  const { slug } = await params;
  return <SeoVerbPage verb="meet" slug={slug} />;
}
