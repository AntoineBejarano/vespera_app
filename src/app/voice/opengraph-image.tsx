import { createOgImage, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/seo/opengraph";

export const alt = "Vesperer Voice — spoken AI characters with memory";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return createOgImage(
    "Voice characters with persistent memory.",
    "Same identity across chat and voice — relationships that compound.",
  );
}
