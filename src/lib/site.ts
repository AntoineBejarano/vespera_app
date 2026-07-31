export const SITE_NAME = "Vesperer";
export const SITE_DOMAIN = "vesperer.com";
export const SITE_URL =
  process.env.APP_URL?.replace(/\/$/, "") ||
  process.env.NEXTAUTH_URL?.replace(/\/$/, "") ||
  "https://vesperer.com";

export const SITE_TAGLINE = "Create characters people never forget.";

export const SITE_DESCRIPTION =
  "Build AI characters with real memory, evolving relationships and a personality that stays consistent across every conversation.";

/** Main (non-XXX) brand — icy blue from logo */
export const BRAND_ACCENT = "#5badee";
export const BRAND_ACCENT_GLOW = "#aed4fa";

/** After Dark brand — rose */
export const BRAND_AFTER_DARK_ACCENT = "#ff4d6d";
