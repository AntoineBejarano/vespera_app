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
    prompt: "What's her name? Just the name you'll call her.",
  },
  {
    id: "personality",
    prompt:
      "How is she — no résumé needed. What's the vibe? How does she talk? What makes her different?",
  },
  {
    id: "relationshipType",
    prompt:
      "What kind of relationship do you want with her? (companionship, romance, tension, dominance, intimate friendship…)",
  },
  {
    id: "attractionsIrritated",
    prompt:
      "What draws you to someone like that, and what would annoy you if she did or said it?",
  },
  {
    id: "boundaries",
    prompt:
      "Any hard limits, or almost full freedom? (Adults 18+ only. No minors.)",
  },
  {
    id: "style",
    prompt:
      "How should she feel? (warm, challenging, dominant, shy, tsundere, unpredictable…)",
  },
  {
    id: "intensity",
    prompt:
      "On a scale of 1–5, how explicit can adult chemistry get? (1 = subtle, 5 = very explicit)",
  },
] as const;
