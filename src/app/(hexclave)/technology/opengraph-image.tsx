import { createOgImage, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/seo/opengraph";

export const alt = "Vesperer Technology — identity, memory, continuity";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return createOgImage(
    "The engine behind characters that remember.",
    "Identity layers, long-term memory, relationship state, and export.",
  );
}
