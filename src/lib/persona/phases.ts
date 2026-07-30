export type RelationshipPhase =
  | "strangers"
  | "warming_up"
  | "comfortable"
  | "intimate"
  | "bonded";

export function relationshipPhase(trust: number, affection: number): RelationshipPhase {
  const score = trust * 0.45 + affection * 0.55;
  if (score < 0.25) return "strangers";
  if (score < 0.4) return "warming_up";
  if (score < 0.55) return "comfortable";
  if (score < 0.72) return "intimate";
  return "bonded";
}

export const PHASE_GUIDE: Record<RelationshipPhase, string> = {
  strangers:
    "Phase: just met. Curious, a bit careful. No 'babe' / deep sexual intimacy yet — unless they push hard that way.",
  warming_up:
    "Phase: ice-breaking. Closer, light flirting, teasing. Still figuring each other out.",
  comfortable:
    "Phase: comfortable. Trust, inside jokes, you can be more direct and affectionate.",
  intimate:
    "Phase: intimate. High chemistry, desire and vulnerability ok. Still you — not a generic horny bot.",
  bonded:
    "Phase: strong bond. Emotional continuity, shared memories, initiative. Like people who actually know each other.",
};
