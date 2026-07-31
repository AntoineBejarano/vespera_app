import { ImageResponse } from "next/og";
import { getPublicCharacterBySlug } from "@/lib/characters/public";
import { createOgImage, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/seo/opengraph";

export const alt = "Vesperer AI character";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

type Params = { params: Promise<{ slug: string }> };

export default async function Image({ params }: Params) {
  const { slug } = await params;
  const character = await getPublicCharacterBySlug(slug);

  if (!character) {
    return createOgImage("Character not found", "Vesperer AI characters");
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "linear-gradient(160deg, #07090d 0%, #10151d 55%, #122033 100%)",
          color: "#eef3f8",
          padding: 72,
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 24,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#aed4fa",
          }}
        >
          {character.categories[0] ?? "AI Character"}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              display: "flex",
              fontSize: 72,
              lineHeight: 1.05,
              fontWeight: 700,
              maxWidth: 960,
            }}
          >
            {character.name}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              color: "#8a96a8",
              maxWidth: 900,
              lineHeight: 1.35,
            }}
          >
            {character.tagline}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 26,
            color: "#5badee",
            letterSpacing: "0.04em",
          }}
        >
          Vesperer · Talk & create your own
        </div>
      </div>
    ),
    { ...OG_SIZE },
  );
}
