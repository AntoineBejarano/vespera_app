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
  "adult AI companion with memory",
  "private AI companion 18+",
  "persistent adult AI character",
  "AI companion that remembers",
  "creator AI agent with memory",
  "adult AI character platform",
  "private persistent AI companion",
  "18+ AI identity for creators",
];

export const BUSINESS_KEYWORDS = [
  "AI identity platform for business",
  "persistent AI personas for agencies",
  "AI character API for platforms",
  "multi-tenant AI conversation infrastructure",
  "AI persona workspace RBAC",
  "human handoff AI chat",
  "deploy AI identity Telegram API",
  "governed AI digital twin platform",
  "AI character memory for enterprises",
  "creator AI identity management",
];

export const AGENCY_KEYWORDS = [
  "AI chatter agency software",
  "multi creator AI persona workspace",
  "AI identity management for agencies",
  "Telegram AI agent for creator agencies",
  "human handoff AI companion agency",
  "roster AI characters with memory",
];

export const PLATFORM_KEYWORDS = [
  "AI identity API",
  "embed AI persona API",
  "multi-tenant AI character engine",
  "chat key AI identity platform",
  "white label AI companion infrastructure",
  "digital twin conversation API",
];
