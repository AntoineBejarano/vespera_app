export type PersonaBot = {
  id: string;
  username: string;
  active: boolean;
  label: string | null;
  peerCount: number;
  tokenMasked: string;
};

export type PersonaPhoto = {
  id: string;
  url: string;
  kind: string;
  tags: string[];
  caption: string | null;
};

export type PersonaProfile = {
  id: string;
  name: string;
  intensity: number;
  active: boolean;
  hasApiKey: boolean;
  soulMd: string;
  styleMd: string;
  rulesMd: string;
  contextMd: string;
  bots: PersonaBot[];
  photos: PersonaPhoto[];
  relationshipCount: number;
  memoryCount: number;
  isPublic: boolean;
  slug: string | null;
  tagline: string | null;
  openingLine: string | null;
  categories: string[];
  allowFork: boolean;
  isAdult: boolean;
  license: string;
  channels: string[];
  version: string;
  coverUrl: string | null;
};

export type PersonaTab =
  | "overview"
  | "mind"
  | "connections"
  | "photos"
  | "publish";

export const DOC_FIELDS = [
  {
    key: "soulMd" as const,
    label: "Soul",
    hint: "Who she is — stable identity, temperament, desires.",
  },
  {
    key: "styleMd" as const,
    label: "Style",
    hint: "How she texts — cadence, slang, emoji, horniness level.",
  },
  {
    key: "rulesMd" as const,
    label: "Rules",
    hint: "Hard boundaries and behavioral constraints.",
  },
  {
    key: "contextMd" as const,
    label: "Context",
    hint: "Light lore / backstory that can evolve.",
  },
];

export type DocKey = (typeof DOC_FIELDS)[number]["key"];
