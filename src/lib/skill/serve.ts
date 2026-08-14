import { SITE_URL } from "@/lib/site";

export function markdownSkillResponse(
  body: string,
  opts: {
    canonicalPath: string;
    /** Unique docs index; concatenated packs should pass false. */
    index?: boolean;
    maxAge?: number;
  },
): Response {
  const maxAge = opts.maxAge ?? 3600;
  const canonical = `${SITE_URL}${opts.canonicalPath}`;
  const index = opts.index !== false;
  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": `public, max-age=${maxAge}, s-maxage=${maxAge * 6}`,
      "X-Robots-Tag": index ? "all" : "noindex, follow",
      Link: [
        `<${canonical}>; rel="canonical"`,
        `<${SITE_URL}/developers>; rel="alternate"; type="text/html"`,
      ].join(", "),
    },
  });
}
