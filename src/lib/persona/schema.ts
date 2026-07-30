import { z } from "zod";

/** character.yaml equivalent */
export const characterMetaSchema = z.object({
  name: z.string(),
  relationshipMode: z.string().default("companion"),
  traits: z
    .object({
      warmth: z.number().min(0).max(1).default(0.5),
      playfulness: z.number().min(0).max(1).default(0.5),
      directness: z.number().min(0).max(1).default(0.5),
      possessiveness: z.number().min(0).max(1).default(0.2),
      mystery: z.number().min(0).max(1).default(0.3),
    })
    .default({
      warmth: 0.5,
      playfulness: 0.5,
      directness: 0.5,
      possessiveness: 0.2,
      mystery: 0.3,
    }),
  defaultMood: z.string().default("neutral"),
  intensity: z.number().int().min(1).max(5).default(3),
});

export const personaLayersSchema = z.object({
  meta: characterMetaSchema,
  /** Stable core identity — almost never changes */
  soulMd: z.string().min(40),
  /** How they speak in chat (colloquial, not literary) */
  styleMd: z.string().min(40),
  /** Hard rules, canon, boundaries */
  rulesMd: z.string().min(40),
  /** Situational background / lore — inject sparingly */
  contextMd: z.string().min(20),
  /** Legacy flat sheet for UI/compat */
  identity: z
    .object({
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
    })
    .optional(),
});

export type PersonaLayers = z.infer<typeof personaLayersSchema>;
export type CharacterMeta = z.infer<typeof characterMetaSchema>;

export const relationshipStateSchema = z.object({
  mood: z.string(),
  trust: z.number().min(0).max(1),
  affection: z.number().min(0).max(1),
  energy: z.number().min(0).max(1),
  summary: z.string().optional(),
});

export type RelationshipSnapshot = z.infer<typeof relationshipStateSchema>;
