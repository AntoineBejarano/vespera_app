import { z } from "zod";

export const identitySheetSchema = z.object({
  temperament: z.string(),
  desires: z.array(z.string()).default([]),
  fears: z.array(z.string()).default([]),
  contradictions: z.array(z.string()).default([]),
  linguisticStyle: z.string(),
  humor: z.string(),
  backstory: z.string(),
  goals: z.array(z.string()).default([]),
  relationshipDynamic: z.string(),
  intensity: z.number().int().min(1).max(5).default(3),
  kinks: z.array(z.string()).default([]),
  boundaries: z.array(z.string()).default([]),
  excludedThemes: z.array(z.string()).default([]),
});

export type IdentitySheet = z.infer<typeof identitySheetSchema>;

export const onboardingAnswersSchema = z.object({
  name: z.string().min(1).max(80),
  personality: z.string().min(10),
  relationshipType: z.string().min(3),
  attractions: z.string().min(3),
  irritations: z.string().min(3),
  boundaries: z.string().default(""),
  style: z.string().min(3),
  intensity: z.number().int().min(1).max(5).default(3),
});

export type OnboardingAnswers = z.infer<typeof onboardingAnswersSchema>;

export const ONBOARDING_STEPS = [
  {
    id: "name",
    prompt:
      "¿Cómo se llama esta persona? Solo el nombre con el que quieres llamarla.",
  },
  {
    id: "personality",
    prompt:
      "Cuéntame cómo es — no hace falta un currículum. ¿Qué vibe tiene? ¿Cómo habla? ¿Qué la hace distinta?",
  },
  {
    id: "relationshipType",
    prompt:
      "¿Qué tipo de relación buscas con ella? (compañía, romance, tensión, dominio, amistad íntima…)",
  },
  {
    id: "attractionsIrritated",
    prompt:
      "¿Qué te atrae de alguien así, y qué te irritaría que hiciera o dijera?",
  },
  {
    id: "boundaries",
    prompt:
      "¿Hay límites duros, o prefieres libertad casi total? (Recuerda: solo adultos 18+. Nada de menores.)",
  },
  {
    id: "style",
    prompt:
      "¿Cómo te gustaría que se sienta? (cariñosa, desafiante, dominante, tímida, tsundere, impredecible…)",
  },
  {
    id: "intensity",
    prompt:
      "En una escala del 1 al 5, ¿cuán explícita puede ser la química adulta? (1 = sutil, 5 = muy explícita)",
  },
] as const;
