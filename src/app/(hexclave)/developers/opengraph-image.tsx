import { createOgImage, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/seo/opengraph";

export const alt = "Vesperer API and CLI — create persistent AI personas";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return createOgImage(
    "Vesperer API & CLI for AI personas.",
    "Account keys, chat keys, installable agent skill, and optional external reasoning.",
  );
}
