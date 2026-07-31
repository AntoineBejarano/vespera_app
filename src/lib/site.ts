export const SITE_NAME = "Vesperer";
export const SITE_DOMAIN = "vesperer.com";
export const SITE_URL =
  process.env.APP_URL?.replace(/\/$/, "") ||
  process.env.NEXTAUTH_URL?.replace(/\/$/, "") ||
  "https://vesperer.com";

export const SITE_TAGLINE = "Create characters people never forget.";

export const SITE_DESCRIPTION =
  "Most AI characters forget everything and feel generic. Vesperer builds characters with real identity and long-term memory — a closer, more human connection with your audience, students, or clients. Deploy on web, WhatsApp, Telegram, Discord, or your own app.";

/** Main (non-XXX) brand — icy blue from logo */
export const BRAND_ACCENT = "#5badee";
export const BRAND_ACCENT_GLOW = "#aed4fa";

/** After Dark brand — rose */
export const BRAND_AFTER_DARK_ACCENT = "#ff4d6d";
