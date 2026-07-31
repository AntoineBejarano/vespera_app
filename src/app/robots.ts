import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/after-dark", "/bring", "/technology", "/c/", "/legal/"],
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
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
