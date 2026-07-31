import { ImageResponse } from "next/og";

export const alt = "Vesperer — Create characters people never forget";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
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
            fontSize: 28,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "#aed4fa",
          }}
        >
          AI CHARACTER CREATION
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              display: "flex",
              fontSize: 72,
              lineHeight: 1.05,
              fontWeight: 700,
              maxWidth: 900,
            }}
          >
            Create characters people never forget.
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              color: "#8a96a8",
              maxWidth: 820,
              lineHeight: 1.35,
            }}
          >
            Real personality. Long-term memory. Relationships that evolve.
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
          Vesperer
        </div>
      </div>
    ),
    { ...size },
  );
}
