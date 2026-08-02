import type { MetadataRoute } from "next";
import {
  buildApexRobots,
  buildAfterDarkRobots,
} from "@/lib/seo/build-robots";
import { getRequestSurface } from "@/lib/seo/request-surface";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const surface = await getRequestSurface();
  if (surface.surface === "after-dark") {
    return buildAfterDarkRobots(surface);
  }
  return buildApexRobots(surface);
}
