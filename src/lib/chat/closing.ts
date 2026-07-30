/**
 * Conversation closing / silence — avoid goodbye loops.
 */

const CLOSING_ASSISTANT =
  /\b(go(ing|nna)\s+(to\s+)?(sleep|bed)|heading\s+to\s+bed|off\s+to\s+(sleep|bed)|tired|sleepy|talk\s+tomorrow|talk\s+later|good\s*night|\bgn\b|night\s+babe|me\s+voy\s+a\s+dormir|buenas\s+noches|hasta\s+ma[nñ]ana|me\s+duermo|voy\s+a\s+dormir)\b/i;

const USER_ACK =
  /^(ok+|okay|okey|k+|vale|bueno|bye+|byee+|good\s*night|goodnight|\bgn\b|night|sleep\s*well|descansa|hasta\s*ma[nñ]ana|hasta\s*luego|👍|❤️|💕|😘|🫡|🙏|yy+|mmm+)\s*[!.…]*$/i;

/**
 * User said a short ok/bye after the character said they're sleeping / ending.
 * → do not generate another reply (stops the loop).
 */
export function shouldStaySilent(
  userMessage: string,
  lastAssistantMessage?: string | null,
): boolean {
  const user = userMessage.trim();
  if (!user || user.length > 40) return false;
  if (!USER_ACK.test(user)) return false;
  if (!lastAssistantMessage) return false;
  return CLOSING_ASSISTANT.test(lastAssistantMessage);
}

/** Soft closing vibe for the prompt when relevant */
export function lastTurnWasClosing(lastAssistantMessage?: string | null): boolean {
  return Boolean(
    lastAssistantMessage && CLOSING_ASSISTANT.test(lastAssistantMessage),
  );
}
