export function markdownSkillResponse(body: string, maxAge = 3600): Response {
  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": `public, max-age=${maxAge}, s-maxage=${maxAge * 6}`,
      "X-Robots-Tag": "all",
    },
  });
}
