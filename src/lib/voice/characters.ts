import type { VoiceAgentId } from "@/lib/voice/types";

/**
 * Fixed ElevenLabs voice per demo character.
 * End users cannot change these — casting is a studio concern.
 *
 * Audition: https://elevenlabs.io/app/voice-library
 *
 * Voice Library / “professional” voices need a paid ElevenLabs plan for API use.
 * Free tier can only synthesize premade voices — keep desiredLibraryVoiceId until upgrade.
 */
export const CHARACTER_VOICES: Record<
  VoiceAgentId,
  {
    voiceId: string;
    modelId: string;
    label: string;
    desiredLibraryVoiceId?: string;
  }
> = {
  einstein: {
    voiceId: "IKne3meq5aSn9XLyUdCD", // premade Charlie (works on free)
    desiredLibraryVoiceId: "vmVmHDKBkkCgbLVIOJRb", // Charlie Chatlin
    modelId: "eleven_flash_v2_5",
    label: "Einstein",
  },
  luna: {
    voiceId: "EXAVITQu4vr4xnSDxMaL", // premade Sarah
    modelId: "eleven_flash_v2_5",
    label: "Luna",
  },
  "stoic-mentor": {
    voiceId: "CwhRBWXzGAHq8TQ4Fs17", // premade Roger
    modelId: "eleven_flash_v2_5",
    label: "Stoic Mentor",
  },
  tatiana: {
    // Premade fallback until paid plan unlocks library API
    voiceId: "FGY2WhTYpPnrIDTdsKH5", // Laura — Enthusiast, Quirky
    // https://elevenlabs.io/app/voice-library?voiceId=dHAwRJVaEPhU907QLTPW
    desiredLibraryVoiceId: "dHAwRJVaEPhU907QLTPW", // Tatiana Kulenko
    modelId: "eleven_flash_v2_5",
    label: "Tatiana",
  },
};

export function getCharacterVoice(agent: VoiceAgentId) {
  return CHARACTER_VOICES[agent] ?? null;
}

export function hasCharacterVoice(agent: VoiceAgentId) {
  return Boolean(CHARACTER_VOICES[agent]?.voiceId);
}
