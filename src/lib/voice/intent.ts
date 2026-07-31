/** Detect when the user is asking for a spoken / voice-note reply. */
export function wantsVoiceMessage(text: string): boolean {
  const t = text.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  if (/^\/voice\b/.test(t.trim())) return true;
  return (
    /\b(mensaje|nota)\s+de\s+voz\b/.test(t) ||
    /\b(mandame|pasame|enviame|dame)\b.{0,24}\b(audio|voz|voice)\b/.test(t) ||
    /\b(audio|voz)\b.{0,16}\b(por\s+favor|please)\b/.test(t) ||
    /\bvoice\s*(note|message|memo)\b/.test(t) ||
    /\bsend\s+(me\s+)?(a\s+)?voice\b/.test(t) ||
    /\b(hablame|speak to me|say it out loud)\b/.test(t)
  );
}

/**
 * User text for the LLM when they asked for a voice note.
 * Strips /voice and pure “send me audio” phrasing — never injects stage directions.
 */
export function voiceRequestUserMessage(text: string): string {
  let cleaned = text.replace(/^\/voice\b/i, "").trim();
  cleaned = cleaned
    .replace(/\b(mensaje|nota)\s+de\s+voz\b/gi, " ")
    .replace(/\bvoice\s*(note|message|memo)\b/gi, " ")
    .replace(
      /\b(mandame|pasame|enviame|dame|send|send me)\b.{0,20}\b(un\s+)?(audio|voz|voice)\b/gi,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || "Hey — talk to me for a second.";
}

/** Strip labels the model sometimes prefixes before TTS. */
export function spokenTextFromBubbles(bubbles: string[]): string {
  let text = bubbles.join(" ").replace(/[*_`#\[\]]/g, "");

  text = text
    .replace(
      /^\s*((nota(\s+de)?\s*voz|voice\s*note|audio(\s*message)?|mensaje\s+de\s+voz)\s*[:\-–—]\s*)+/i,
      "",
    )
    .replace(
      /\b(nota(\s+de)?\s*voz|voice\s*note)\s*[:\-–—]\s*/gi,
      "",
    )
    .replace(/\s+/g, " ")
    .trim();

  return text.slice(0, 1200);
}

export const VOICE_NOTE_SYSTEM_ADDON = `
# Voice delivery
You are leaving a short spoken voice message (1–3 natural sentences).
Speak only the words that should be heard out loud.
Never label the reply (no "voice note:", "nota de voz:", "audio:", etc.).
No lists, no markdown, no stage directions.`;
