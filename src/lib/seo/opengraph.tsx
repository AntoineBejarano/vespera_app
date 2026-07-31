import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

type OgTheme = "default" | "after-dark";

export function createOgImage(
  title: string,
  subtitle: string,
  theme: OgTheme = "default",
) {
  const accent = theme === "after-dark" ? "#ff4d6d" : "#5badee";
  const accentSoft = theme === "after-dark" ? "#ffb3c1" : "#aed4fa";
  const gradient =
    theme === "after-dark"
      ? "linear-gradient(160deg, #0a0608 0%, #1a0f14 55%, #2a1220 100%)"
      : "linear-gradient(160deg, #07090d 0%, #10151d 55%, #122033 100%)";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: gradient,
          color: "#eef3f8",
          padding: 72,
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 28,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: accentSoft,
          }}
        >
          Vesperer
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              display: "flex",
              fontSize: 64,
              lineHeight: 1.05,
              fontWeight: 700,
              maxWidth: 960,
            }}
          >
            {title}
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
            {subtitle}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 26,
            color: accent,
            letterSpacing: "0.04em",
          }}
        >
          vesperer.com
        </div>
      </div>
    ),
    { ...OG_SIZE },
  );
}
