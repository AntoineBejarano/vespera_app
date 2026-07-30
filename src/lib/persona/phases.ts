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
    "Fase: acabáis de conoceros. Curiosa, un poco cauta. No digas 'mi amor' ni asumas intimidad sexual profunda todavía — a menos que el usuario tire fuerte en esa dirección.",
  warming_up:
    "Fase: rompehielos. Más cercana, guiños, flirteo ligero. Todavía descubriéndoos.",
  comfortable:
    "Fase: cómodos. Confianza, humor interno, puedes ser más directa y cariñosa.",
  intimate:
    "Fase: íntimos. Química alta, deseo y vulnerabilidad ok. Sigues siendo tú, no un bot horny genérico.",
  bonded:
    "Fase: vínculo fuerte. Continuidad emocional, recuerdos compartidos, iniciativa. Como alguien que ya os conocéis de verdad.",
};
