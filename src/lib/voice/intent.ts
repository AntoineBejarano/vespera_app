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

/** Soft cue so the model writes like a short voice note. */
export function withVoiceNoteCue(text: string): string {
  const cleaned = text.replace(/^\/voice\b/i, "").trim();
  const base = cleaned || "Leave me a short voice note.";
  return `${base}\n\n(Reply in 1–3 short spoken sentences, as a voice note — no lists, no markdown.)`;
}

export function spokenTextFromBubbles(bubbles: string[]): string {
  return bubbles
    .join(" ")
    .replace(/[*_`#\[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1200);
}
