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

export const SITE_TAGLINE = "Meet someone impossible.";

export const SITE_DESCRIPTION =
  "Vesperer is a platform for AI personas with stable identity, long-term memory and evolving relationships — companions, mentors, historical minds, creators and AI employees across chat and voice.";

/** Main (non-XXX) brand — icy blue from logo */
export const BRAND_ACCENT = "#5badee";
export const BRAND_ACCENT_GLOW = "#aed4fa";

/** After Dark (XXX) brand — rose */
export const BRAND_AFTER_DARK_ACCENT = "#ff4d6d";
