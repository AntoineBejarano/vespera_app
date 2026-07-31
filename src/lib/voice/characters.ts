import type { VoiceAgentId } from "@/lib/voice/types";

export type CastVoice = {
  voiceId: string;
  modelId: string;
  label: string;
  /** Used if the primary voiceId is blocked (e.g. free plan + library voice). */
  fallbackVoiceId?: string;
};

/**
 * Fixed cast voices. End users cannot change these.
 * Professional / library voices need a paid API plan; fallbackVoiceId keeps demos alive.
 */
export const CHARACTER_VOICES: Record<VoiceAgentId, CastVoice> = {
  einstein: {
    voiceId: "IKne3meq5aSn9XLyUdCD",
    modelId: "eleven_flash_v2_5",
    label: "Einstein",
  },
  luna: {
    voiceId: "EXAVITQu4vr4xnSDxMaL",
    modelId: "eleven_flash_v2_5",
    label: "Luna",
  },
  "stoic-mentor": {
    voiceId: "CwhRBWXzGAHq8TQ4Fs17",
    modelId: "eleven_flash_v2_5",
    label: "Stoic Mentor",
  },
  tatiana: {
    // Generated voice "Tatiana" — works on current API plan
    voiceId: "OpQXJBA6OKUsHKGIPpb4",
    fallbackVoiceId: "FGY2WhTYpPnrIDTdsKH5",
    modelId: "eleven_flash_v2_5",
    label: "Tatiana",
  },
};

export function getCharacterVoice(agent: VoiceAgentId): CastVoice | null {
  return CHARACTER_VOICES[agent] ?? null;
}

export function hasCharacterVoice(agent: VoiceAgentId) {
  return Boolean(CHARACTER_VOICES[agent]?.voiceId);
}

/** Resolve cast voice for a DB character (Telegram / product). */
export function resolveVoiceForCharacter(character: {
  name?: string | null;
  slug?: string | null;
  isAdult?: boolean | null;
}): CastVoice | null {
  const slug = character.slug?.toLowerCase().trim() ?? "";
  const name = character.name?.toLowerCase().trim() ?? "";

  if (slug === "tatiana" || name.includes("tatiana")) {
    return CHARACTER_VOICES.tatiana;
  }
  if (slug === "einstein" || name.includes("einstein")) {
    return CHARACTER_VOICES.einstein;
  }
  if (slug === "luna" || name === "luna") {
    return CHARACTER_VOICES.luna;
  }
  if (
    slug === "stoic-mentor" ||
    name.includes("stoic") ||
    name.includes("mentor")
  ) {
    return CHARACTER_VOICES["stoic-mentor"];
  }

  if (character.isAdult) {
    return CHARACTER_VOICES.tatiana;
  }

  return null;
}
