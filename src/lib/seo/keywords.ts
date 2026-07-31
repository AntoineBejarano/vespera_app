const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Companions: [
    "AI companion with memory",
    "AI companion creator",
    "persistent AI companion",
  ],
  "Historical Minds": [
    "historical AI character",
    "AI mentor historical figure",
    "talk to Einstein AI",
  ],
  Roleplay: [
    "AI roleplay character",
    "interactive fiction AI",
    "AI story character with memory",
  ],
  Mentors: [
    "AI mentor with memory",
    "AI coaching character",
    "personal AI tutor",
  ],
  "Original Characters": [
    "create original AI character",
    "custom AI personality",
  ],
  "Virtual Creators": [
    "virtual creator AI",
    "AI influencer character",
  ],
};

export function characterSeoKeywords(
  name: string,
  categories: string[],
): string[] {
  const keywords = new Set<string>([
    `${name} AI character`,
    `talk to ${name}`,
    `${name} chatbot with memory`,
    "AI character with long-term memory",
  ]);

  for (const category of categories) {
    for (const kw of CATEGORY_KEYWORDS[category] ?? []) {
      keywords.add(kw);
    }
    keywords.add(`${category.toLowerCase()} AI character`);
  }

  return [...keywords];
}

export const TECHNOLOGY_KEYWORDS = [
  "AI character memory architecture",
  "persistent AI identity layers",
  "AI character versioning",
  "portable AI personality config",
  "AI relationship state per user",
  "multi-channel AI character deploy",
  "AI character engine",
  "long-term memory chatbot",
  "character continuity across models",
  "export AI character identity",
];

export const AFTER_DARK_KEYWORDS = [
  "adult AI companion creator",
  "NSFW AI character with memory",
  "private AI companion deployment",
  "18+ AI character platform",
  "adult AI chatbot with memory",
  "creator adult AI agent",
  "uncensored AI companion memory",
  "multi-tenant adult AI characters",
];
