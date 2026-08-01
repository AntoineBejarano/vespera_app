export const SITE_NAME = "Vesperer";
export const SITE_DOMAIN = "vesperer.com";
export const SITE_URL =
  process.env.APP_URL?.replace(/\/$/, "") ||
  process.env.NEXTAUTH_URL?.replace(/\/$/, "") ||
  "https://vesperer.com";

export {
  AFTER_DARK_HOST,
  AFTER_DARK_URL,
} from "@/lib/hosts";

export const SITE_TAGLINE =
  "Answer every client with all your knowledge — and build the connection that keeps them.";

export const SITE_DESCRIPTION =
  "Vesperer turns your business knowledge, voice, and rules into an AI that answers clients with memory — so relationships compound across web, Telegram, voice, and your own app via API.";

/** Main (non-XXX) brand — icy blue from logo */
export const BRAND_ACCENT = "#5badee";
export const BRAND_ACCENT_GLOW = "#aed4fa";

/** After Dark (XXX) brand — rose */
export const BRAND_AFTER_DARK_ACCENT = "#ff4d6d";
