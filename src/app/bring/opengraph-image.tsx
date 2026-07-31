import { createOgImage, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/seo/opengraph";

export const alt = "Bring an existing AI character to Vesperer";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return createOgImage(
    "Bring an existing character.",
    "Import Character Card, SillyTavern, or your own config — keep what you built.",
  );
}
