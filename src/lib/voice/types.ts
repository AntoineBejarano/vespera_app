export type VoiceAgentId =
  | "luna"
  | "einstein"
  | "stoic-mentor"
  | "tatiana";

export type VoiceCatalog = "sfw" | "after-dark";

export const SFW_VOICE_AGENTS: VoiceAgentId[] = [
  "luna",
  "einstein",
  "stoic-mentor",
];

export const AFTER_DARK_VOICE_AGENTS: VoiceAgentId[] = ["tatiana"];
