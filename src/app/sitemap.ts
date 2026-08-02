import type { MetadataRoute } from "next";
import { buildApexSitemap, buildAfterDarkSitemap } from "@/lib/seo/build-sitemap";
import { getRequestSurface } from "@/lib/seo/request-surface";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { surface } = await getRequestSurface();
  if (surface === "after-dark") {
    return buildAfterDarkSitemap();
  }
  return buildApexSitemap();
}
