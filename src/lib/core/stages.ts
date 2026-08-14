export const RELATIONSHIP_STAGES = [
  "new_contact",
  "active",
  "trusted",
  "distant",
] as const;

export type RelationshipStage = (typeof RELATIONSHIP_STAGES)[number];

const ALLOWED_TRANSITIONS: Record<RelationshipStage, readonly RelationshipStage[]> = {
  new_contact: ["active"],
  active: ["trusted", "distant"],
  trusted: ["active", "distant"],
  distant: ["active"],
};

export function isRelationshipStage(raw: unknown): raw is RelationshipStage {
  return (
    typeof raw === "string" &&
    (RELATIONSHIP_STAGES as readonly string[]).includes(raw)
  );
}

export function parseRelationshipStage(raw: unknown): RelationshipStage {
  return isRelationshipStage(raw) ? raw : "new_contact";
}

/** Hermes saying "trusted" does not make it so — Vesperer validates the hop. */
export function isAllowedStageTransition(
  from: RelationshipStage,
  to: RelationshipStage,
): boolean {
  if (from === to) return true;
  return ALLOWED_TRANSITIONS[from].includes(to);
}
