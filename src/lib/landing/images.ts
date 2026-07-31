/** Shared landing / showcase art — cool charcoal + icy blue brand. */
export const LANDING_IMAGES = {
  companion: {
    src: "/landing/hero-companion.jpg",
    alt: "AI companion character portrait",
  },
  einstein: {
    src: "/landing/hero-einstein.jpg",
    alt: "Historical mind character portrait inspired by Einstein",
  },
  anime: {
    src: "/landing/hero-anime.jpg",
    alt: "Anime-inspired character portrait",
  },
  stoic: {
    src: "/landing/hero-stoic.jpg",
    alt: "Stoic mentor character portrait",
  },
  fantasy: {
    src: "/landing/hero-fantasy.jpg",
    alt: "Fantasy character portrait",
  },
  creator: {
    src: "/landing/hero-creator.jpg",
    alt: "Virtual creator character portrait",
  },
} as const;

export type LandingImageKey = keyof typeof LANDING_IMAGES;
