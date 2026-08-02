import { createOgImage, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/seo/opengraph";

export const alt = "Vesperer After Dark — private AI companions 18+";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return createOgImage(
    "After Dark — private AI companions.",
    "Adult characters with memory, relationship progression, and creator control.",
    "after-dark",
  );
}
