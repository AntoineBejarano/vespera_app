import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/bring",
          "/technology",
          "/voice",
          "/docs",
          "/help",
          "/explore",
          "/meet/",
          "/learn/",
          "/hire/",
          "/create/",
          "/characters/",
          "/historical-figures/",
          "/use-cases/",
          "/c/",
          "/legal/",
          "/llms.txt",
          "/llm.txt",
        ],
        disallow: [
          "/api/",
          "/handler/",
          "/personas",
          "/chat",
          "/memory",
          "/settings",
          "/age-gate",
          "/underage",
          "/login",
          "/register",
          "/report",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
